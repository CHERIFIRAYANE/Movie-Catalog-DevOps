"""
Django management command to import movies from Kaggle CSV file.
"""
import json
import csv
from django.core.management.base import BaseCommand
from django.core.cache import cache
from movies.models import Movie


class Command(BaseCommand):
    help = 'Import movies from Kaggle TMDB CSV file into the database.'

    def add_arguments(self, parser):
        """Add command-line arguments."""
        parser.add_argument(
            '--csv',
            type=str,
            default='movies.csv',
            help='Path to CSV file (default: movies.csv in project root)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing movies before importing'
        )

    def handle(self, *args, **options):
        """Execute the import command."""
        csv_path = options['csv']
        clear_existing = options.get('clear', False)

        self.stdout.write(self.style.WARNING(f'Importing movies from {csv_path}...'))

        # Clear existing movies if requested
        if clear_existing:
            count = Movie.objects.count()
            Movie.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(f'Deleted {count} existing movies.')
            )

        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                if not reader.fieldnames:
                    raise ValueError('CSV file is empty or invalid')

                movies_to_create = []
                skipped = 0
                processed = 0

                for row_num, row in enumerate(reader, start=2):  # start=2 to skip header
                    try:
                        # Parse genres from JSON string
                        genres_json = row.get('genres', '[]')
                        genres = []
                        if genres_json:
                            try:
                                genres_list = json.loads(genres_json)
                                genres = [g['name'] for g in genres_list if 'name' in g]
                            except (json.JSONDecodeError, TypeError):
                                genres = []

                        # Create Movie object
                        movie = Movie(
                            title=row.get('title', 'Unknown'),
                            release_date=row.get('release_date') if row.get('release_date') else None,
                            genres=genres,
                            vote_average=float(row.get('vote_average', 0)) if row.get('vote_average') else 0,
                            overview=row.get('overview', ''),
                            poster_url=row.get('poster_path', ''),
                            budget=int(row.get('budget', 0)) if row.get('budget', '0').isdigit() else 0,
                            revenue=int(row.get('revenue', 0)) if row.get('revenue', '0').isdigit() else 0,
                        )
                        movies_to_create.append(movie)
                        processed += 1

                        # Progress indicator every 500 rows
                        if processed % 500 == 0:
                            self.stdout.write(f'  Processed {processed} rows...')

                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Row {row_num}: Skipped - {row.get("title", "Unknown")} - {str(e)}'
                            )
                        )
                        skipped += 1

                # Bulk create (much faster than save() for each)
                if movies_to_create:
                    Movie.objects.bulk_create(movies_to_create, batch_size=1000)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'\n✓ Successfully imported {len(movies_to_create)} movies'
                        )
                    )
                else:
                    self.stdout.write(self.style.WARNING('No movies to import.'))

                if skipped > 0:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ Skipped {skipped} rows due to errors')
                    )

                # Clear all caches to ensure fresh data
                cache.clear()
                self.stdout.write(self.style.SUCCESS('✓ Cache cleared'))

                # Summary
                total = Movie.objects.count()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n📊 Summary:\n'
                        f'  Total movies in database: {total}\n'
                        f'  Imported in this run: {len(movies_to_create)}\n'
                        f'  Skipped: {skipped}'
                    )
                )

        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(
                    f'✗ CSV file not found: {csv_path}\n'
                    f'  Download from: https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata\n'
                    f'  Place the file in the project root or specify path with --csv option'
                )
            )
            raise
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Import failed: {str(e)}'))
            raise
