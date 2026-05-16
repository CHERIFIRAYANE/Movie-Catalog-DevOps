"""
REST Framework views for movies app.
"""
import logging
from collections import Counter
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from movies.models import Movie, Favorite
from movies.serializers import MovieSerializer, MovieDetailSerializer, FavoriteSerializer
from movies.filters import MovieFilter

logger = logging.getLogger(__name__)


def _cache_get(key):
    """Read from cache and degrade gracefully if cache backend is unavailable."""
    try:
        return cache.get(key)
    except Exception as exc:
        logger.warning("Cache GET failed for key '%s': %s", key, exc)
        return None


def _cache_set(key, value, ttl):
    """Write to cache and degrade gracefully if cache backend is unavailable."""
    try:
        cache.set(key, value, ttl)
    except Exception as exc:
        logger.warning("Cache SET failed for key '%s': %s", key, exc)


def _cache_delete(key):
    """Delete cache key and degrade gracefully if cache backend is unavailable."""
    try:
        cache.delete(key)
    except Exception as exc:
        logger.warning("Cache DELETE failed for key '%s': %s", key, exc)


def _invalidate_recommendations_cache(user_id):
    """Invalidate common recommendation cache keys for a user."""
    for limit in (6, 12, 20, 24):
        _cache_delete(f"recommendations:user:{user_id}:limit:{limit}")


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
        cached_data = _cache_get(cache_key)
        if cached_data:
            return Response(cached_data)

        # If not cached, get from database
        response = super().list(request, *args, **kwargs)

        # Cache the response for 1 hour (3600 seconds)
        _cache_set(cache_key, response.data, 3600)

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
        cached_data = _cache_get(cache_key)
        if cached_data:
            return Response(cached_data)

        # If not cached, get from database
        response = super().retrieve(request, *args, **kwargs)

        # Cache for 24 hours
        _cache_set(cache_key, response.data, 86400)

        return response


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Favorite model.
    Allows authenticated users to add/remove favorite movies.
    
    Endpoints:
    - GET /api/favorites/ - List user's favorites (requires auth)
    - POST /api/favorites/ - Add movie to favorites (requires auth)
    - DELETE /api/favorites/{id}/ - Remove from favorites (requires auth)
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    filtering_fields = ['movie_id']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return favorites for the current authenticated user."""
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
        _cache_delete(f"favorites:{request.user.id}")
        _invalidate_recommendations_cache(request.user.id)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    def destroy(self, request, *args, **kwargs):
        """
        Remove movie from favorites.
        """
        response = super().destroy(request, *args, **kwargs)

        # Invalidate cache
        _cache_delete(f"favorites:{request.user.id}")
        _invalidate_recommendations_cache(request.user.id)

        return response


def _get_personalized_recommendations(user, limit):
    """Return recommendations based on user's favorite genre affinity."""
    favorite_movies = list(
        Movie.objects.filter(favorited_by__user=user)
        .only('id', 'genres')
        .distinct()
    )

    if not favorite_movies:
        return [], 0, Counter()

    favorite_ids = {movie.id for movie in favorite_movies}
    genre_weights = Counter()
    for movie in favorite_movies:
        for genre in movie.genres or []:
            if genre:
                genre_weights[genre] += 1

    # Limit evaluation window for performance while keeping quality.
    candidate_movies = list(
        Movie.objects.exclude(id__in=favorite_ids)
        .only('id', 'title', 'release_date', 'genres', 'vote_average', 'overview', 'poster_url', 'budget', 'revenue', 'created_at')
        .order_by('-vote_average', '-release_date')[:500]
    )

    current_year = timezone.now().year
    scored = []

    for movie in candidate_movies:
        overlap_genres = [genre for genre in (movie.genres or []) if genre in genre_weights]

        # Keep a few highly-rated fallback movies even without overlap.
        if not overlap_genres and (movie.vote_average or 0) < 8.5:
            continue

        genre_score = sum(genre_weights[g] for g in overlap_genres)
        rating_score = (movie.vote_average or 0) / 10.0
        recency_bonus = 0.2 if movie.release_date and movie.release_date.year >= current_year - 5 else 0.0
        total_score = (2.0 * genre_score) + (0.6 * rating_score) + recency_bonus

        reason = 'Top rated for your profile'
        if overlap_genres:
            reason = f"Similar genres: {', '.join(overlap_genres[:2])}"

        scored.append((total_score, movie, reason))

    scored.sort(key=lambda row: (row[0], row[1].vote_average or 0), reverse=True)

    recommendations = []
    seen = set()
    for _, movie, reason in scored:
        if movie.id in seen:
            continue
        seen.add(movie.id)
        recommendations.append((movie, reason))
        if len(recommendations) >= limit:
            break

    return recommendations, len(favorite_ids), genre_weights


def _get_public_recommendations(limit):
    """Return generic high-quality recommendations when user history is unavailable."""
    movies = list(
        Movie.objects.only(
            'id', 'title', 'release_date', 'genres', 'vote_average',
            'overview', 'poster_url', 'budget', 'revenue', 'created_at'
        ).order_by('-vote_average', '-release_date')[:limit]
    )
    return [(movie, 'Popular right now') for movie in movies]


@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations(request):
    """
    Recommendation endpoint.

    Query parameters:
    - limit: number of recommendations (default: 12, max: 24)
    """
    try:
        limit = int(request.query_params.get('limit', 12))
    except (TypeError, ValueError):
        limit = 12

    limit = max(1, min(limit, 24))
    user = request.user if request.user.is_authenticated else None

    cache_key = f"recommendations:public:limit:{limit}"
    if user:
        cache_key = f"recommendations:user:{user.id}:limit:{limit}"

    cached = _cache_get(cache_key)
    if cached:
        return Response(cached)

    if user:
        recommendations_with_reason, seed_count, genre_weights = _get_personalized_recommendations(user, limit)
        strategy = 'personalized'

        if not recommendations_with_reason:
            recommendations_with_reason = _get_public_recommendations(limit)
            strategy = 'popular_fallback'
    else:
        recommendations_with_reason = _get_public_recommendations(limit)
        seed_count = 0
        genre_weights = Counter()
        strategy = 'popular'

    movies = [movie for movie, _ in recommendations_with_reason]
    serializer = MovieSerializer(movies, many=True)
    reason_by_id = {movie.id: reason for movie, reason in recommendations_with_reason}

    results = []
    for item in serializer.data:
        results.append({
            **item,
            'recommendation_reason': reason_by_id.get(item['id'], 'Suggested for you')
        })

    response_payload = {
        'strategy': strategy,
        'seed_favorites_count': seed_count,
        'top_genres': [genre for genre, _ in genre_weights.most_common(5)],
        'results': results,
    }

    _cache_set(cache_key, response_payload, 900)
    return Response(response_payload)


@api_view(['GET'])
def advanced_search(request):
    """
    Advanced search endpoint with Elasticsearch.
    
    Query Parameters:
    - q: Search query (searches title and overview)
    - genres: Comma-separated genres filter (e.g., "Action,Drama")
    - year_min: Minimum release year
    - year_max: Maximum release year
    - rating_min: Minimum vote average (0-10)
    - page: Page number (default: 1)
    - page_size: Results per page (default: 20, max: 100)
    
    Example:
    /api/movies/search/?q=action&genres=Action,Thriller&year_min=2010&rating_min=7
    """
    from movies.search import MovieSearchService
    
    try:
        search_service = MovieSearchService()
        
        # Get query parameters
        query = request.query_params.get('q', '').strip()
        genres = request.query_params.get('genres', '')
        year_min = request.query_params.get('year_min')
        year_max = request.query_params.get('year_max')
        rating_min = request.query_params.get('rating_min')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Parse genres
        genres_list = [g.strip() for g in genres.split(',') if g.strip()] if genres else None
        
        # Parse numbers
        year_min = int(year_min) if year_min else None
        year_max = int(year_max) if year_max else None
        rating_min = float(rating_min) if rating_min else None
        
        # Ensure valid page and page_size
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        
        # Perform search
        results = search_service.search(
            query=query,
            genres=genres_list,
            year_min=year_min,
            year_max=year_max,
            rating_min=rating_min,
            page=page,
            page_size=page_size
        )
        
        # Add movie details using database
        results_with_details = []
        for result in results['results']:
            try:
                movie = Movie.objects.get(id=result['id'])
                results_with_details.append({
                    **result,
                    'genres': movie.genres,
                    'poster_url': movie.poster_url,
                })
            except Movie.DoesNotExist:
                results_with_details.append(result)
        
        results['results'] = results_with_details
        
        return Response(results)
    
    except Exception as e:
        logger.exception('Advanced search error')
        return Response(
            {'error': 'Search failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def search_autocomplete(request):
    """
    Autocomplete suggestions for movie search.
    
    Query Parameters:
    - q: Partial query (minimum 1 character)
    - limit: Maximum suggestions (default: 10, max: 50)
    """
    from movies.search import MovieSearchService
    
    try:
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 10))
        
        # Validate input
        if not query or len(query) < 1:
            return Response({'suggestions': []})
        
        limit = max(1, min(limit, 50))
        
        search_service = MovieSearchService()
        suggestions = search_service.autocomplete(query, limit)
        
        return Response({'suggestions': suggestions})
    
    except Exception as e:
        logger.exception('Autocomplete error')
        return Response(
            {'suggestions': [], 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ===================== AUTHENTICATION VIEWS =====================

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils import timezone
from movies.models import EmailVerification, UserProfile
from movies.serializers import (
    UserRegistrationSerializer, UserLoginSerializer,
    EmailVerificationSerializer, ResendVerificationSerializer,
    UserProfileSerializer
)
import dns.resolver


def validate_email_domain(email):
    """Check if email domain can receive mail (has MX records)."""
    try:
        domain = email.split('@')[1]
        mx_records = dns.resolver.resolve(domain, 'MX')
        return bool(mx_records)
    except:
        # If DNS lookup fails, allow it (domain might be valid but DNS unreachable)
        return True


def send_verification_email(user, verification):
    """Send verification email to user."""
    verification_url = f'http://localhost:5173/verify?token={verification.token}'
    
    email_body = f'''
Hello,

Thank you for registering at Movie Catalog!

Click the link below to verify your email:
{verification_url}

Or enter this code: {verification.verification_code}

This link expires in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
Movie Catalog Team
'''
    
    try:
        send_mail(
            subject='Verify your email address',
            message=email_body,
            from_email='noreply@moviecatalog.local',
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        verification.email_sent_at = timezone.now()
        verification.delivery_status = 'delivered'
        verification.save()
        
        return True
    except Exception as e:
        logger.error(f'Failed to send verification email: {str(e)}')
        verification.delivery_status = 'failed'
        verification.save()
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    User registration endpoint.
    Creates a new user account and returns JWT tokens.
    No email verification required for school project.
    
    Request body:
    {
        "email": "user@example.com",
        "password": "securepassword123",
        "password_confirm": "securepassword123"
    }
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    
    # Check if email already registered
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user and mark as active immediately
    user = serializer.save()
    user.email = email
    user.is_active = True  # Mark active immediately (no email verification needed)
    user.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response(
        {
            'message': 'Account created successfully! You are now logged in.',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    User login endpoint.
    Returns JWT tokens (access and refresh) on successful authentication.
    
    Request body:
    {
        "email": "user@example.com",
        "password": "securepassword123"
    }
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']
    
    # Get user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate user
    user = authenticate(username=user.username, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Account is inactive. Please contact support.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Email verification endpoint.
    Accepts either a verification token or code to verify user's email.
    
    Request body (one of):
    {
        "token": "abc123xyz..."
    }
    OR
    {
        "verification_code": "123456"
    }
    """
    serializer = EmailVerificationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    token = serializer.validated_data.get('token')
    code = serializer.validated_data.get('verification_code')
    
    # Find verification record
    if token:
        verification = EmailVerification.objects.filter(
            token=token,
            is_used=False,
            expires_at__gt=timezone.now()
        ).first()
    else:
        verification = EmailVerification.objects.filter(
            verification_code=code,
            is_used=False,
            expires_at__gt=timezone.now()
        ).first()
    
    if not verification:
        return Response(
            {'error': 'Invalid or expired verification token/code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark user as active and verification as used
    verification.user.is_active = True
    verification.user.save()
    
    verification.is_used = True
    verification.save()
    
    return Response({
        'message': 'Email verified successfully! You can now login.',
        'email': verification.user.email
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """
    Resend verification email endpoint.
    Rate-limited to prevent spam.
    
    Request body:
    {
        "email": "user@example.com"
    }
    """
    serializer = ResendVerificationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email'].lower()
    
    # Find user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if user.is_active:
        return Response(
            {'error': 'Email already verified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get verification record
    try:
        verification = EmailVerification.objects.get(user=user)
    except EmailVerification.DoesNotExist:
        return Response(
            {'error': 'No verification record found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check resend limit
    if verification.resend_count >= verification.max_resends:
        return Response(
            {'error': 'Too many resend attempts. Try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Check time between resends (minimum 1 minute)
    if verification.email_sent_at:
        time_diff = (timezone.now() - verification.email_sent_at).total_seconds()
        if time_diff < 60:
            return Response(
                {'error': f'Wait {int(60 - time_diff)} seconds before resending'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
    
    # Send email again
    verification.resend_count += 1
    verification.save()
    
    email_sent = send_verification_email(user, verification)
    
    message = 'Verification email resent'
    if not email_sent:
        message += ' (Note: Email sending issue, use code: ' + verification.verification_code + ')'
    
    return Response({
        'message': message,
        'verification_code': verification.verification_code  # For development/testing
    })


@api_view(['GET'])
def user_profile(request):
    """
    Get current user's profile information.
    Requires authentication.
    """
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
def update_profile(request):
    """
    Update current user's profile information.
    Requires authentication.
    """
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
