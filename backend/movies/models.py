"""
Database models for movies app.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import secrets
from datetime import timedelta
from django.utils import timezone


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


class EmailVerification(models.Model):
    """
    EmailVerification model: handles email verification tokens for registration.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    token = models.CharField(max_length=256, unique=True)
    verification_code = models.CharField(max_length=6)  # 6-digit backup code
    
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    resend_count = models.IntegerField(default=0)
    max_resends = 5
    
    email_sent_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('delivered', 'Delivered'),
            ('bounced', 'Bounced'),
            ('failed', 'Failed')
        ],
        default='pending'
    )

    class Meta:
        db_table = 'movies_email_verification'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verification for {self.user.email}"
    
    @classmethod
    def create_for_user(cls, user):
        """Generate verification token and code for a user."""
        token = secrets.token_urlsafe(32)
        code = f'{secrets.randbelow(1000000):06d}'
        
        verification = cls.objects.create(
            user=user,
            token=token,
            verification_code=code,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        return verification


class UserProfile(models.Model):
    """
    UserProfile model: stores optional user profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Optional fields
    full_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    
    # Preferences
    receive_recommendations = models.BooleanField(default=True)
    receive_notifications = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'movies_user_profile'
    
    def __str__(self):
        return f"Profile for {self.user.email}"
