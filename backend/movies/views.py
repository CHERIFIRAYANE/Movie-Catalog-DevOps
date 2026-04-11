"""
REST Framework views for movies app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.cache import cache
from django.db.models import Q
from movies.models import Movie, Favorite
from movies.serializers import MovieSerializer, MovieDetailSerializer, FavoriteSerializer
from movies.filters import MovieFilter


class HealthCheckView(APIView):
    """
    Simple health check endpoint for Kubernetes liveness probes.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Return health status."""
        try:
            # Test database connection
            Movie.objects.count()
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'

        try:
            # Test Redis connection
            cache.set('health_check', 'ok', 10)
            redis_status = 'connected'
        except Exception as e:
            redis_status = f'error: {str(e)}'

        return Response({
            'status': 'healthy',
            'database': db_status,
            'cache': redis_status,
        })


class MovieViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Movie model.
    Provides list and retrieve actions with search, filtering, and caching.
    
    Endpoints:
    - GET /api/movies/ - List all movies (paginated, cached)
    - GET /api/movies/{id}/ - Get single movie detail (cached)
    - GET /api/movies/?search=term - Search movies by title/overview
    """
    queryset = Movie.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MovieFilter
    search_fields = ['title', 'overview']
    ordering_fields = ['release_date', 'vote_average', 'title']
    ordering = ['-release_date']

    def get_serializer_class(self):
        """Use detail serializer for single object requests."""
        if self.action == 'retrieve':
            return MovieDetailSerializer
        return MovieSerializer

    def list(self, request, *args, **kwargs):
        """
        List movies with caching.
        Cache key: movies:page:{page_num}
        Cache TTL: 1 hour
        """
        page = request.query_params.get('page', 1)
        search = request.query_params.get('search', '')
        cache_key = f"movies:page:{page}:search:{search}"

        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # If not cached, get from database
        response = super().list(request, *args, **kwargs)

        # Cache the response for 1 hour (3600 seconds)
        cache.set(cache_key, response.data, 3600)

        return response

    def retrieve(self, request, *args, **kwargs):
        """
        Get single movie detail with caching.
        Cache key: movie:{id}
        Cache TTL: 24 hours
        """
        movie_id = kwargs.get('pk')
        cache_key = f"movie:{movie_id}"

        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # If not cached, get from database
        response = super().retrieve(request, *args, **kwargs)

        # Cache for 24 hours
        cache.set(cache_key, response.data, 86400)

        return response


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Favorite model.
    Allows authenticated users to add/remove favorite movies.
    
    Endpoints:
    - GET /api/favorites/ - List user's favorites
    - POST /api/favorites/ - Add movie to favorites
    - DELETE /api/favorites/{id}/ - Remove from favorites
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    filtering_fields = ['movie_id']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return favorites for the current user."""
        return Favorite.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Add movie to favorites.
        Handles duplicate favorites gracefully.
        """
        movie_id = request.data.get('movie_id')

        # Check if movie exists
        try:
            movie = Movie.objects.get(id=movie_id)
        except Movie.DoesNotExist:
            return Response(
                {'error': 'Movie not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already favorited
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            movie=movie
        )

        serializer = self.get_serializer(favorite)

        # Invalidate cache
        cache.delete(f"favorites:{request.user.id}")

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    def destroy(self, request, *args, **kwargs):
        """
        Remove movie from favorites.
        """
        response = super().destroy(request, *args, **kwargs)

        # Invalidate cache
        cache.delete(f"favorites:{request.user.id}")

        return response
