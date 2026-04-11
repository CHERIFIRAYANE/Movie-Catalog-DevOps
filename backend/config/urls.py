"""
URL configuration for movie_catalog project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from movies.views import MovieViewSet, FavoriteViewSet, HealthCheckView

# Create router for REST endpoints
router = routers.DefaultRouter()
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/', include([
        path('', include(router.urls)),
        path('health/', HealthCheckView.as_view(), name='health'),
    ])),
]
