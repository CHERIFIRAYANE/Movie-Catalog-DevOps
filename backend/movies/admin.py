"""
Django admin configuration for movies app.
"""
from django.contrib import admin
from movies.models import Movie, Favorite


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    """Admin interface for Movie model."""
    list_display = ('id', 'title', 'release_date', 'vote_average', 'budget', 'created_at')
    list_filter = ('release_date', 'vote_average', 'created_at')
    search_fields = ('title', 'overview')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'release_date', 'overview')
        }),
        ('Media', {
            'fields': ('poster_url', 'genres')
        }),
        ('Ratings & Finance', {
            'fields': ('vote_average', 'budget', 'revenue')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Movies are imported from CSV, not added manually
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent accidental deletion
        return False


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    """Admin interface for Favorite model."""
    list_display = ('id', 'user', 'movie', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('user__username', 'movie__title')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        # Favorites are managed via API
        return False
