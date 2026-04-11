"""
Database models for movies app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Movie(models.Model):
    """
    Movie model: stores movie information from Kaggle TMDB dataset.
    """
    title = models.CharField(max_length=255, db_index=True)
    release_date = models.DateField(null=True, blank=True)
    genres = models.JSONField(default=list, blank=True)  # Array of genre strings
    vote_average = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    overview = models.TextField(blank=True)
    poster_url = models.URLField(blank=True, null=True)
    budget = models.BigIntegerField(default=0)
    revenue = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'movies_movie'
        ordering = ['-release_date', '-vote_average']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['release_date']),
            models.Index(fields=['vote_average']),
        ]

    def __str__(self):
        return f"{self.title} ({self.release_date.year if self.release_date else 'N/A'})"


class Favorite(models.Model):
    """
    Favorite model: junction table for user-movie relationships.
    Allows users to save their favorite movies.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movies_favorite'
        unique_together = ('user', 'movie')  # Prevent duplicate favorites
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'movie']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}"
