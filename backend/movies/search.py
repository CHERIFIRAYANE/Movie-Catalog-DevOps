"""
Elasticsearch search service for movies.
Provides full-text search, filtering, and autocomplete functionality.
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError, NotFoundError
from elasticsearch_dsl import Search, Q, A
from django.conf import settings
from movies.models import Movie

logger = logging.getLogger(__name__)


class ElasticsearchConfig:
    """Elasticsearch configuration."""
    INDEX_NAME = 'movies'
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Mapping for the movies index
    MAPPING = {
        'properties': {
            'id': {'type': 'integer'},
            'title': {
                'type': 'text',
                'analyzer': 'standard',
                'fields': {
                    'keyword': {'type': 'keyword'},
                    'suggest': {'type': 'completion'}
                }
            },
            'overview': {
                'type': 'text',
                'analyzer': 'standard'
            },
            'genres': {
                'type': 'keyword'
            },
            'release_date': {'type': 'date'},
            'vote_average': {'type': 'float'},
            'vote_count': {'type': 'integer'},
            'budget': {'type': 'long'},
            'revenue': {'type': 'long'},
            'popularity': {'type': 'float'},
            'created_at': {'type': 'date'},
            'updated_at': {'type': 'date'},
        }
    }


class MovieSearchService:
    """
    Professional search service for movies using Elasticsearch.
    Handles indexing, searching, and filtering.
    """
    
    def __init__(self):
        """Initialize Elasticsearch client."""
        es_host = getattr(settings, 'ELASTICSEARCH_HOST', 'localhost')
        es_port = getattr(settings, 'ELASTICSEARCH_PORT', 9200)
        
        self.es = Elasticsearch([f'http://{es_host}:{es_port}'])
        self.index_name = ElasticsearchConfig.INDEX_NAME
        self._ensure_index_exists()
    
    def _ensure_index_exists(self):
        """Create index if it doesn't exist."""
        try:
            if not self.es.indices.exists(index=self.index_name):
                self.es.indices.create(
                    index=self.index_name,
                    body={'mappings': ElasticsearchConfig.MAPPING}
                )
                logger.info(f"Created Elasticsearch index: {self.index_name}")
        except ConnectionError:
            logger.warning("Elasticsearch connection failed. Search functionality may be unavailable.")
    
    def index_movie(self, movie: Movie) -> bool:
        """
        Index a single movie.
        
        Args:
            movie: Movie instance to index
            
        Returns:
            Success status
        """
        try:
            release_year = movie.release_date.year if movie.release_date else None
            
            doc_body = {
                'id': movie.id,
                'title': movie.title,
                'overview': movie.overview,
                'genres': movie.genres or [],
                'release_date': movie.release_date.isoformat() if movie.release_date else None,
                'vote_average': movie.vote_average,
                'vote_count': 0,  # Will be calculated
                'budget': movie.budget,
                'revenue': movie.revenue,
                'popularity': 0.0,  # Will be calculated
                'created_at': movie.created_at.isoformat() if movie.created_at else None,
                'updated_at': movie.updated_at.isoformat() if movie.updated_at else None,
            }
            
            self.es.index(
                index=self.index_name,
                id=movie.id,
                document=doc_body
            )
            return True
        except Exception as e:
            logger.error(f"Error indexing movie {movie.id}: {str(e)}")
            return False
    
    def bulk_index_movies(self, movies: List[Movie], batch_size: int = 100) -> int:
        """
        Index multiple movies in batches.
        
        Args:
            movies: List of Movie instances
            batch_size: Number of movies per batch
            
        Returns:
            Number of successfully indexed movies
        """
        indexed_count = 0
        
        for i in range(0, len(movies), batch_size):
            batch = movies[i:i + batch_size]
            for movie in batch:
                if self.index_movie(movie):
                    indexed_count += 1
            
            logger.info(f"Indexed {indexed_count}/{len(movies)} movies")
        
        # Force refresh to make documents immediately searchable
        try:
            self.es.indices.refresh(index=self.index_name)
        except Exception as e:
            logger.warning(f"Could not refresh index: {str(e)}")
        
        return indexed_count
    
    def search(
        self,
        query: str = '',
        genres: Optional[List[str]] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        rating_min: Optional[float] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Advanced search with filtering.
        
        Args:
            query: Search query string
            genres: List of genres to filter by
            year_min: Minimum release year
            year_max: Maximum release year
            rating_min: Minimum vote average
            page: Page number (1-indexed)
            page_size: Results per page
            
        Returns:
            Dictionary with results and metadata
        """
        try:
            # Validate inputs
            page_size = min(page_size, ElasticsearchConfig.MAX_PAGE_SIZE)
            offset = (page - 1) * page_size
            
            # Build search query
            search = Search(using=self.es, index=self.index_name)
            
            # Main text search (if query provided)
            if query.strip():
                # Use a bool query to prioritize exact/near-exact matches
                search = search.query(
                    'bool',
                    should=[
                        # Exact phrase match on title (highest priority)
                        Q('match_phrase', title={'query': query, 'boost': 10}),
                        # Exact keyword match on title
                        Q('match', title={'query': query, 'boost': 5, 'fuzziness': '0'}),
                        # Fuzzy match on title (for typos)
                        Q('match', title={'query': query, 'boost': 3, 'fuzziness': 'AUTO'}),
                        # Match in overview (lower priority)
                        Q('match', overview={'query': query, 'boost': 1}),
                    ],
                    minimum_should_match=1
                )
            
            # Apply filters
            filters = []
            
            if genres:
                # Filter by any of the selected genres
                filters.append(Q('terms', genres=genres))
            
            if year_min is not None:
                filters.append(Q('range', release_date={'gte': f'{year_min}-01-01'}))
            
            if year_max is not None:
                filters.append(Q('range', release_date={'lte': f'{year_max}-12-31'}))
            
            if rating_min is not None:
                filters.append(Q('range', vote_average={'gte': rating_min}))
            
            # Apply all filters
            for f in filters:
                search = search.filter(f)
            
            # Add sorting
            search = search.sort('-vote_average', '-release_date')
            
            # Add aggregations for filters
            search.aggs.bucket('genres', A('terms', field='genres', size=100))
            search.aggs.bucket('release_years', A('date_histogram', field='release_date', calendar_interval='year'))
            
            # Pagination
            search = search[offset:offset + page_size]
            
            # Execute search
            response = search.execute()
            
            # Format results
            results = []
            for hit in response:
                results.append({
                    'id': hit.id,
                    'title': hit.title,
                    'overview': hit.overview,
                    'genres': hit.genres,
                    'release_date': hit.release_date,
                    'vote_average': hit.vote_average,
                    'budget': hit.budget,
                    'revenue': hit.revenue,
                })
            
            # Extract aggregations
            available_genres = []
            if 'genres' in response.aggregations:
                available_genres = [
                    bucket.key for bucket in response.aggregations.genres.buckets
                ]
            
            available_years = []
            if 'release_years' in response.aggregations:
                available_years = [
                    int(bucket.key_as_string.split('-')[0]) 
                    for bucket in response.aggregations.release_years.buckets
                ]
            
            return {
                'results': results,
                'total': response.hits.total.value,
                'page': page,
                'page_size': page_size,
                'total_pages': (response.hits.total.value + page_size - 1) // page_size,
                'available_genres': sorted(set(available_genres)),
                'available_years': sorted(set(available_years), reverse=True),
            }
        
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return {
                'results': [],
                'total': 0,
                'page': page,
                'page_size': page_size,
                'total_pages': 0,
                'error': str(e),
                'available_genres': [],
                'available_years': [],
            }
    
    def autocomplete(self, query: str, size: int = 10) -> List[str]:
        """
        Get autocomplete suggestions.
        
        Args:
            query: Partial query string
            size: Number of suggestions
            
        Returns:
            List of suggestions
        """
        try:
            search = Search(using=self.es, index=self.index_name)
            search = search.query(
                'match',
                title={
                    'query': query,
                    'operator': 'and'
                }
            )
            search = search.source(['title'])
            search = search[:size]
            
            response = search.execute()
            
            suggestions = []
            for hit in response:
                if hit.title not in suggestions:
                    suggestions.append(hit.title)
            
            return suggestions[:size]
        
        except Exception as e:
            logger.error(f"Autocomplete error: {str(e)}")
            return []
    
    def clear_index(self) -> bool:
        """Clear all documents from the index."""
        try:
            self.es.indices.delete(index=self.index_name, ignore=[400, 404])
            self._ensure_index_exists()
            logger.info(f"Cleared index: {self.index_name}")
            return True
        except Exception as e:
            logger.error(f"Error clearing index: {str(e)}")
            return False
    
    def get_health(self) -> Dict[str, Any]:
        """Get Elasticsearch cluster health."""
        try:
            health = self.es.cluster.health()
            return {
                'status': 'connected',
                'state': health.get('status', 'unknown'),
                'index_exists': self.es.indices.exists(index=self.index_name),
            }
        except Exception as e:
            return {
                'status': 'disconnected',
                'error': str(e),
            }
