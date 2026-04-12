"""
URL configuration for movie_catalog project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from movies.views import (
    MovieViewSet, FavoriteViewSet, HealthCheckView, advanced_search, 
    search_autocomplete, register, login, verify_email, resend_verification,
    user_profile, update_profile
)

# Create router for REST endpoints
router = routers.DefaultRouter()
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/', include([
        # Authentication endpoints
        path('auth/register/', register, name='register'),
        path('auth/login/', login, name='login'),
        path('auth/verify-email/', verify_email, name='verify_email'),
        path('auth/resend-verification/', resend_verification, name='resend_verification'),
        path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/profile/', user_profile, name='user_profile'),
        path('auth/profile/update/', update_profile, name='update_profile'),
        
        # Search endpoints (custom, MUST come before router)
        path('search/', advanced_search, name='advanced_search'),
        path('autocomplete/', search_autocomplete, name='search_autocomplete'),
        
        # Standard REST endpoints
        path('', include(router.urls)),
        path('health/', HealthCheckView.as_view(), name='health'),
    ])),
]
