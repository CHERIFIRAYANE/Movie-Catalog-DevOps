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


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm']
    
    def validate(self, data):
        """Validate that passwords match."""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data
    
    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=password,
            is_active=False  # Not active until email verified
        )
        
        # Create user profile
        from movies.models import UserProfile
        UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField(required=False, allow_blank=True)
    verification_code = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """At least one of token or verification_code must be provided."""
        if not data.get('token') and not data.get('verification_code'):
            raise serializers.ValidationError('Either token or verification_code is required.')
        return data


class ResendVerificationSerializer(serializers.Serializer):
    """
    Serializer for resending verification email.
    """
    email = serializers.EmailField()


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model.
    """
    email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        from movies.models import UserProfile
        model = UserProfile
        fields = [
            'email', 'username', 'full_name', 'bio', 'avatar_url',
            'receive_recommendations', 'receive_notifications', 'created_at'
        ]
        read_only_fields = ['created_at']
