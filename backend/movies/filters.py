"""
Filters for movies app.
"""
import django_filters
from movies.models import Movie


class MovieFilter(django_filters.FilterSet):
    """
    Filters for Movie model.
    Used by DRF to filter movies in list endpoint.
    """
    title = django_filters.CharFilter(
        field_name='title',
        lookup_expr='icontains',  # Case-insensitive contains
        label='Title (case-insensitive contains)'
    )
    
    genres = django_filters.CharFilter(
        field_name='genres',
        lookup_expr='contains',
        label='Genre (must be in genres array)'
    )
    
    release_year_min = django_filters.NumberFilter(
        field_name='release_date',
        lookup_expr='year__gte',
        label='Release year minimum'
    )
    
    release_year_max = django_filters.NumberFilter(
        field_name='release_date',
        lookup_expr='year__lte',
        label='Release year maximum'
    )
    
    vote_average_min = django_filters.NumberFilter(
        field_name='vote_average',
        lookup_expr='gte',
        label='Minimum vote average'
    )
    
    vote_average_max = django_filters.NumberFilter(
        field_name='vote_average',
        lookup_expr='lte',
        label='Maximum vote average'
    )

    class Meta:
        model = Movie
        fields = ['title', 'genres', 'release_year_min', 'release_year_max', 
                  'vote_average_min', 'vote_average_max']
