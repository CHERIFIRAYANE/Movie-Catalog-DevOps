# Kaggle Dataset Import Guide

## Overview

This guide explains how to download the TMDB Movies dataset from Kaggle and import it into PostgreSQL.

**Dataset**: [TMDB Movies Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)  
**Size**: ~500MB compressed, ~5,000 movies with full metadata  
**Fields**: Title, Release Date, Genres, Vote Average, Budget, Revenue, Overview, Poster URL, etc.

---

## Step 1: Download from Kaggle

### Option A: Web Interface (Easy)

1. Go to [Kaggle TMDB Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)
2. Click **Download** button (top right)
3. Sign in with Kaggle account (create if needed)
4. Download `tmdb_5000_movies.csv` (~150MB)

### Option B: Kaggle API (Advanced)

```bash
# Install Kaggle CLI
pip install kaggle

# Configure API credentials
# Download from: https://www.kaggle.com/settings/account
# Create ~/.kaggle/kaggle.json with your API token

# Download dataset
kaggle datasets download -d tmdb/tmdb-movie-metadata

# Extract
unzip tmdb-movie-metadata.zip
```

---

## Step 2: Place CSV in Project

```bash
# Copy CSV to project root
cp /path/to/tmdb_5000_movies.csv ./movies.csv

# Verify
ls -la movies.csv
# Expected: -rw-r--r-- 1 user group 150000000 Apr 11 12:00 movies.csv
```

### CSV Structure

The CSV should have these columns:

```
budget,genres,homepage,id,keywords,original_language,original_title,
overview,popularity,poster_path,production_companies,production_countries,
release_date,revenue,runtime,spoken_languages,status,tagline,title,vote_average,vote_count
```

**Example first row**:

```
27000000,"[{""id"": 28, ""name"": ""Action""}]","http://...",19995,[...],en,Avatar,
"In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora...",150.437,/...,
[...],United States,2009-12-18,2923706049,162,[...],Released,"Enter Pandora.",Avatar,7.2,11800
```

---

## Step 3: Create Django Import Command

Create `backend/management/commands/import_movies.py`:

```python
import json
import csv
from django.core.management.base import BaseCommand
from movies.models import Movie

class Command(BaseCommand):
    help = 'Import movies from Kaggle TMDB CSV'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            default='movies.csv',
            help='Path to CSV file (default: movies.csv)'
        )

    def handle(self, *args, **options):
        csv_path = options['csv']

        self.stdout.write(f'Starting import from {csv_path}...')

        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)

                movies_to_create = []
                skipped = 0

                for row in reader:
                    try:
                        # Parse genres from JSON string
                        genres_json = row.get('genres', '[]')
                        genres = []
                        if genres_json:
                            try:
                                genres_list = json.loads(genres_json)
                                genres = [g['name'] for g in genres_list if 'name' in g]
                            except json.JSONDecodeError:
                                genres = []

                        # Create Movie object
                        movie = Movie(
                            title=row.get('title', 'Unknown'),
                            release_date=row.get('release_date') or None,
                            genres=genres,
                            vote_average=float(row.get('vote_average', 0)) or 0,
                            overview=row.get('overview', ''),
                            poster_url=row.get('poster_path', ''),
                            budget=int(row.get('budget', 0)) or 0,
                            revenue=int(row.get('revenue', 0)) or 0,
                        )
                        movies_to_create.append(movie)

                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Skipped row: {row.get("title", "Unknown")} - {str(e)}'
                            )
                        )
                        skipped += 1

                # Bulk create (much faster than save() for each)
                if movies_to_create:
                    Movie.objects.bulk_create(movies_to_create, batch_size=1000)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Successfully imported {len(movies_to_create)} movies'
                        )
                    )

                if skipped > 0:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ Skipped {skipped} rows due to errors')
                    )

        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(
                    f'✗ CSV file not found: {csv_path}\n'
                    f'  Download from: https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata'
                )
            )
            raise
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Import failed: {str(e)}'))
            raise
```

---

## Step 4: Run Import Command

### Using Docker Compose

```bash
# Make sure services are running
docker-compose up -d

# Copy CSV into container
docker cp movies.csv movie_backend:/app/

# Run import command
docker-compose exec backend python manage.py import_movies --csv movies.csv

# Monitor progress (may take 1-2 minutes)
# Expected output:
# Starting import from movies.csv...
# ✓ Successfully imported 5000 movies
# ⚠ Skipped 3 rows due to errors
```

### Without Docker

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run import
cd backend
python manage.py import_movies --csv ../movies.csv
```

---

## Step 5: Verify Import

### Check Count

```bash
# Using Docker
docker-compose exec backend python manage.py shell
>>> from movies.models import Movie
>>> Movie.objects.count()
5000

# Query specific
>>> from django.db.models import Avg
>>> Movie.objects.aggregate(Avg('vote_average'))
{'vote_average__avg': 6.4}

# Exit
>>> exit()
```

### Check Database Directly

```bash
# Using psql
docker-compose exec db psql -U postgres -d movie_db

# Count movies
SELECT COUNT(*) FROM movies_movie;
# Result: 5000

# Sample data
SELECT title, release_date, vote_average FROM movies_movie LIMIT 5;
# Result:
#           title       | release_date | vote_average
# ----------------------+--------------+--------------
#  Avatar               | 2009-12-18   |          7.2
#  Avatar               | 2009-12-18   |          7.2
#  The Godfather        | 1972-03-24   |          8.7
# ... (5000 total)

# Exit
\q
```

### Test API Endpoint

```bash
# Frontend: http://localhost:3000
# Should show movie grid with 20 movies on first page

# Backend API
curl "http://localhost:8000/api/movies/"
# Should return JSON with 5000 movies total

curl "http://localhost:8000/api/movies/?search=inception"
# Should return Inception and similar movies
```

---

## Step 6: Data Validation

### Issues & Solutions

**Problem**: Import takes very long (> 10 minutes)

- **Solution**: CSV rows processed in batches; check `docker-compose logs backend` for errors

**Problem**: Movies not appearing in UI

- **Solution**:
  1. Verify count: `docker-compose exec backend python manage.py shell`
  2. Check API: `curl http://localhost:8000/api/movies/`
  3. Restart services: `docker-compose restart backend`

**Problem**: "poster_path" fields are missing/null

- **Solution**: This is expected; Kaggle CSV has poster URLs, but some may be incomplete
  - Frontend displays placeholder image for missing posters

**Problem**: Duplicate movies in database

- **Solution**: Run `import_movies` again; it appends, doesn't replace
  - To clear and reimport:
    ```bash
    docker-compose exec backend python manage.py shell
    >>> from movies.models import Movie
    >>> Movie.objects.all().delete()  # Remove all
    >>> exit()
    # Then run import again
    ```

---

## Step 7: (Re)Import if Needed

### Full Clean Reimport

```bash
# Delete all existing movies
docker-compose exec backend python manage.py shell
>>> from movies.models import Movie
>>> Movie.objects.all().delete()
>>> exit()

# Run import again
docker-compose exec backend python manage.py import_movies --csv movies.csv
```

### Trim Dataset (for faster testing)

If 5000 movies is too much for testing:

```bash
# Extract first 500 rows
head -501 movies.csv > movies_test.csv

# Import
docker-compose exec backend python manage.py import_movies --csv movies_test.csv
```

---

## Data Fields Explanation

| Field          | Source               | Type    | Purpose                          |
| -------------- | -------------------- | ------- | -------------------------------- |
| `title`        | movies.title         | String  | Movie name                       |
| `release_date` | movies.release_date  | Date    | Release date (YYYY-MM-DD)        |
| `genres`       | movies.genres (JSON) | Array   | Genre names: ["Action", "Drama"] |
| `vote_average` | movies.vote_average  | Float   | IMDb rating (0.0 - 10.0)         |
| `overview`     | movies.overview      | Text    | Movie description/plot           |
| `poster_url`   | movies.poster_path   | String  | TMDB image URL path              |
| `budget`       | movies.budget        | Integer | Production budget (USD)          |
| `revenue`      | movies.revenue       | Integer | Box office revenue (USD)         |

---

## Kaggle API Details

For batch operations, use Kaggle's official CSV format:

```python
# Example: Load and explore CSV
import pandas as pd

df = pd.read_csv('movies.csv')
print(df.shape)              # (5000, 20) - rows, columns
print(df.columns)            # All column names
print(df['title'].head())    # First 5 titles
print(df.isnull().sum())     # Missing values per column
```

---

## Troubleshooting

### Import Fails with "FileNotFoundError"

```
✗ CSV file not found: movies.csv
  Download from: https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata
```

**Solution**:

1. Download CSV from Kaggle
2. Copy to project root: `cp ~/Downloads/tmdb_5000_movies.csv .`
3. Run again: `docker-compose exec backend python manage.py import_movies`

### Import Fails with "CSV Error"

```
✗ Import failed: line contains NUL byte
```

**Solution**: CSV encoding issue

```bash
# Check encoding
file movies.csv

# Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 movies.csv > movies_utf8.csv

# Import converted file
docker-compose exec backend python manage.py import_movies --csv movies_utf8.csv
```

### Database Lock / "Could Not Serialize"

```
✗ Import failed: could not serialize access
```

**Solution**: Another process using database

```bash
# Restart database
docker-compose restart db

# Wait 5 seconds
sleep 5

# Try again
docker-compose exec backend python manage.py import_movies
```

---

## Performance Notes

- **Import Duration**: ~1-2 minutes for 5000 movies
- **Database Size**: ~500MB with all movie data
- **RAM Usage**: ~256MB during import (typical)
- **Disk Space**: Ensure 1GB free for CSV + database

---

## Next Steps

1. ✅ Download Kaggle dataset
2. ✅ Place CSV in project root
3. ✅ Run import command
4. ✅ Verify in Django admin: http://localhost:8000/admin/
5. ✅ Test API: http://localhost:8000/api/movies/
6. ✅ Browse frontend: http://localhost:3000

**Last Updated**: April 11, 2026
