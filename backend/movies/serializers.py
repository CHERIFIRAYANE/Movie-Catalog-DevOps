"""
REST Framework serializers for movies app.
"""
from rest_framework import serializers
from movies.models import Movie, Favorite
from django.contrib.auth.models import User


class MovieSerializer(serializers.ModelSerializer):
    """
    Serializer for Movie model.
    Converts Movie instances to/from JSON.
    """
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'release_date', 'genres', 'vote_average',
            'overview', 'poster_url', 'budget', 'revenue', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MovieDetailSerializer(MovieSerializer):
    """
    Extended serializer for single movie detail view.
    Includes all fields from MovieSerializer.
    """
    class Meta(MovieSerializer.Meta):
        fields = MovieSerializer.Meta.fields + ['updated_at']


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for Favorite model.
    Includes nested movie data for convenience.
    """
    movie = MovieSerializer(read_only=True)
    movie_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'movie', 'movie_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        """
        Create a favorite instance.
        User is automatically set from the request context.
        """
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id']
