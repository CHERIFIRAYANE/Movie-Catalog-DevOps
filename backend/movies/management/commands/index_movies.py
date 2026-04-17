"""
Django management command to index all movies into Elasticsearch.

Usage:
    python manage.py index_movies
    python manage.py index_movies --clear  # Clear index first
    python manage.py index_movies --batch-size 50
"""
from django.core.management.base import BaseCommand, CommandError
from django.db.models import QuerySet
from movies.models import Movie
from movies.search import MovieSearchService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Management command for indexing movies."""
    help = 'Index all movies from database into Elasticsearch'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear the index before indexing',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of movies to index per batch (default: 100)',
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        try:
            search_service = MovieSearchService()
            clear_index = options['clear']
            batch_size = options['batch_size']
            
            self.stdout.write(
                self.style.SUCCESS('Starting Elasticsearch indexing...')
            )
            
            # Check Elasticsearch connection
            health = search_service.get_health()
            if health['status'] != 'connected':
                message = f"Elasticsearch not connected: {health.get('error', 'Unknown error')}"
                self.stdout.write(self.style.ERROR(f"❌ {message}"))
                raise CommandError(message)
            
            self.stdout.write(
                self.style.SUCCESS('✓ Elasticsearch connected')
            )
            
            # Clear index if requested
            if clear_index:
                self.stdout.write('Clearing existing index...')
                search_service.clear_index()
                self.stdout.write(self.style.SUCCESS('✓ Index cleared'))
            
            # Get all movies
            movies = Movie.objects.all().order_by('id')
            total_movies = movies.count()
            
            self.stdout.write(
                f'Found {total_movies} movies to index'
            )
            
            # Index movies in batches
            indexed_count = 0
            for i in range(0, total_movies, batch_size):
                batch = movies[i:i + batch_size]
                for movie in batch:
                    if search_service.index_movie(movie):
                        indexed_count += 1
                
                progress = min(i + batch_size, total_movies)
                percentage = (progress / total_movies) * 100
                
                self.stdout.write(
                    f'Progress: {progress}/{total_movies} ({percentage:.1f}%) - '
                    f'Indexed: {indexed_count}'
                )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Successfully indexed {indexed_count}/{total_movies} movies'
                )
            )
            
            # Verify index
            health = search_service.get_health()
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Index health: {health.get('state', 'unknown').upper()}"
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error: {str(e)}')
            )
            logger.exception('Error in index_movies command')
            raise CommandError(str(e))
