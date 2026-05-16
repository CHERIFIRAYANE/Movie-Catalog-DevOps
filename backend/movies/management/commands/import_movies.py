"""
Django management command to import movies from CSV file
"""
import csv
import json
from django.core.management.base import BaseCommand, CommandError
from django.core.cache import cache
from movies.models import Movie


class Command(BaseCommand):
    help = 'Import movies from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            required=True,
            help='Path to the CSV file containing movie data'
        )

    def handle(self, *args, **options):
        csv_path = options['csv']
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                movies_to_create = []
                
                for idx, row in enumerate(reader, 1):
                    try:
                        # Parse genres from JSON string
                        genres_str = row.get('genres', '[]')
                        try:
                            genres = json.loads(genres_str)
                            if isinstance(genres, list):
                                genre_names = [g.get('name') for g in genres if isinstance(g, dict)]
                            else:
                                genre_names = []
                        except (json.JSONDecodeError, ValueError):
                            genre_names = []
                        
                        # Parse vote average
                        try:
                            vote_avg = float(row.get('vote_average', 0))
                            if vote_avg < 0 or vote_avg > 10:
                                vote_avg = 0
                        except (ValueError, TypeError):
                            vote_avg = 0
                        
                        # Parse budget and revenue
                        try:
                            budget = float(row.get('budget', 0)) or 0
                        except (ValueError, TypeError):
                            budget = 0
                        
                        try:
                            revenue = float(row.get('revenue', 0)) or 0
                        except (ValueError, TypeError):
                            revenue = 0
                        
                        # Generate poster URL using a reliable image service
                        # Use Picsum for consistent, cached images
                        movie_id = row.get('id', '')
                        if movie_id:
                            poster_url = f"https://picsum.photos/500/750?random={movie_id}"
                        else:
                            poster_url = "https://picsum.photos/500/750?random=1"
                        
                        movie = Movie(
                            title=row.get('title', 'Unknown')[:255],
                            release_date=row.get('release_date') or None,
                            genres=genre_names,
                            vote_average=vote_avg,
                            overview=row.get('overview', '')[:1000],
                            poster_url=poster_url,
                            budget=budget,
                            revenue=revenue
                        )
                        movies_to_create.append(movie)
                        
                        # Batch create every 1000 rows
                        if len(movies_to_create) >= 1000:
                            Movie.objects.bulk_create(movies_to_create, ignore_conflicts=True)
                            self.stdout.write(f'✓ Imported {idx} movies so far...')
                            movies_to_create = []
                    
                    except (KeyError, ValueError) as e:
                        self.stdout.write(
                            self.style.WARNING(f'Skipping row {idx}: {str(e)}')
                        )
                        continue
                
                # Create remaining movies
                if movies_to_create:
                    Movie.objects.bulk_create(movies_to_create, ignore_conflicts=True)
                
                # Clear cache
                cache.delete_pattern('movies:*')
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Successfully imported {idx} movies!')
                )
        
        except FileNotFoundError:
            raise CommandError(f'CSV file not found: {csv_path}')
        except Exception as e:
            raise CommandError(f'Error importing movies: {str(e)}')
