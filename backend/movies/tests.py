"""
Tests for movies app models and views.
"""
from datetime import date
from django.test import TestCase, Client
from django.contrib.auth.models import User
from movies.models import Movie, Favorite
from rest_framework.test import APIClient
from rest_framework import status


class MovieModelTest(TestCase):
    """Test cases for Movie model."""

    def setUp(self):
        self.movie = Movie.objects.create(
            title='Test Movie',
            release_date=date(2023, 1, 1),
            genres=['Action', 'Drama'],
            vote_average=8.5,
            overview='A test movie',
            poster_url='https://example.com/poster.jpg',
            budget=1000000,
            revenue=5000000
        )

    def test_movie_creation(self):
        """Test that a movie can be created."""
        self.assertEqual(self.movie.title, 'Test Movie')
        self.assertEqual(self.movie.vote_average, 8.5)
        self.assertIn('Action', self.movie.genres)

    def test_movie_str(self):
        """Test string representation of movie."""
        self.assertIn('Test Movie', str(self.movie))


class FavoriteModelTest(TestCase):
    """Test cases for Favorite model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.movie = Movie.objects.create(
            title='Test Movie',
            release_date=date(2023, 1, 1),
            genres=['Action'],
            vote_average=8.5
        )
        self.favorite = Favorite.objects.create(
            user=self.user,
            movie=self.movie
        )

    def test_favorite_creation(self):
        """Test that a favorite can be created."""
        self.assertEqual(self.favorite.user, self.user)
        self.assertEqual(self.favorite.movie, self.movie)

    def test_favorite_uniqueness(self):
        """Test that duplicate favorites are prevented."""
        with self.assertRaises(Exception):
            Favorite.objects.create(user=self.user, movie=self.movie)


class MovieAPITest(TestCase):
    """Test cases for Movie API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.movie = Movie.objects.create(
            title='Inception',
            release_date=date(2010, 7, 16),
            genres=['Action', 'Sci-Fi'],
            vote_average=8.8
        )

    def test_list_movies(self):
        """Test GET /api/movies/"""
        response = self.client.get('/api/movies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_retrieve_movie(self):
        """Test GET /api/movies/{id}/"""
        response = self.client.get(f'/api/movies/{self.movie.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Inception')

    def test_search_movies(self):
        """Test GET /api/movies/?search=term"""
        response = self.client.get('/api/movies/?search=Inception')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)

    def test_health_check(self):
        """Test GET /api/health/"""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')


class FavoriteAPITest(TestCase):
    """Test cases for Favorite API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.movie = Movie.objects.create(
            title='Inception',
            release_date=date(2010, 7, 16),
            genres=['Action']
        )

    def test_add_favorite_unauthenticated(self):
        """Test that unauthenticated users can't add favorites."""
        response = self.client.post('/api/favorites/', {'movie_id': self.movie.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_favorite_authenticated(self):
        """Test that authenticated users can add favorites."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/favorites/', {'movie_id': self.movie.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_user_favorites(self):
        """Test GET /api/favorites/ for authenticated user."""
        self.client.force_authenticate(user=self.user)
        Favorite.objects.create(user=self.user, movie=self.movie)
        response = self.client.get('/api/favorites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)


class RecommendationAPITest(TestCase):
    """Test cases for recommendation API endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='reco_user',
            email='reco@example.com',
            password='testpass123'
        )

        self.favorite_seed = Movie.objects.create(
            title='Seed Action Movie',
            release_date=date(2015, 1, 1),
            genres=['Action', 'Sci-Fi'],
            vote_average=8.0
        )

        self.recommended_candidate = Movie.objects.create(
            title='Action Candidate',
            release_date=date(2020, 6, 1),
            genres=['Action', 'Thriller'],
            vote_average=8.6
        )

        self.other_movie = Movie.objects.create(
            title='Drama Candidate',
            release_date=date(2018, 3, 10),
            genres=['Drama'],
            vote_average=7.0
        )

    def test_recommendations_public(self):
        """GET /api/recommendations/ should work for anonymous users."""
        response = self.client.get('/api/recommendations/?limit=3')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('strategy', response.data)
        self.assertTrue(len(response.data['results']) > 0)

    def test_recommendations_personalized_excludes_favorites(self):
        """Authenticated recommendations should not include favorited movies."""
        Favorite.objects.create(user=self.user, movie=self.favorite_seed)
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/api/recommendations/?limit=5')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['strategy'], 'personalized')

        recommended_ids = {item['id'] for item in response.data['results']}
        self.assertNotIn(self.favorite_seed.id, recommended_ids)
        self.assertIn(self.recommended_candidate.id, recommended_ids)
