# Movie Catalog Technical Details

This document is a technical reference for the project only. It focuses on runtime topology, ports, pod relations, configuration, API routes, container images, scaling, security, and CI/CD.

## 1. Project Identity

- Project name: `Movie Catalog Web Application`
- Domain: movie browsing, search, favorites, recommendations, auth
- Main stack: Django REST Framework, React + Vite, PostgreSQL, Redis, Elasticsearch, Docker, Kubernetes
- Primary namespace in Kubernetes: `movie-catalog`
- Main public host in Kubernetes: `movie.local`

## 2. Repository Map

### Backend

- `backend/config/settings.py`: Django settings and environment-driven configuration
- `backend/config/urls.py`: main API routing, auth endpoints, search endpoints, health endpoint
- `backend/movies/models.py`: `Movie`, `Favorite`, `EmailVerification`, `UserProfile`
- `backend/movies/serializers.py`: API serializers for movies, auth, profile, favorites
- `backend/movies/views.py`: list/retrieve/search/recommendation/auth logic
- `backend/movies/search.py`: Elasticsearch index mapping and search service
- `backend/management/commands/import_movies.py`: dataset import command
- `backend/movies/management/commands/index_movies.py`: Elasticsearch indexing command
- `backend/movies/tests.py`: backend model/API/recommendation tests

### Frontend

- `frontend/src/App.jsx`: app shell, route gating, API health banner, favorites state
- `frontend/src/services/api.js`: Axios API client and endpoint wrappers
- `frontend/src/hooks/useFavorites.js`: favorites state management
- `frontend/src/pages/Search.jsx`: browse/search page with recommendations
- `frontend/src/pages/Favorites.jsx`: favorites page with movie modal support
- `frontend/src/pages/Login.jsx`: login form
- `frontend/src/pages/Register.jsx`: registration form
- `frontend/src/pages/VerifyEmail.jsx`: token/code verification flow
- `frontend/src/context/ThemeContext.jsx`: theme persistence and html class toggling
- `frontend/src/components/AdvancedSearch.jsx`: full search UI with autocomplete and filters
- `frontend/src/components/MovieModal.jsx`: detail modal
- `frontend/src/components/MovieCard.jsx`: movie card with favorite action
- `frontend/src/components/SearchBar.jsx`: simple debounced search bar
- `frontend/src/components/FavoriteButton.jsx`: add/remove favorite button
- `frontend/src/components/Pagination.jsx`: paging controls
- `frontend/src/components/LoadingSpinner.jsx`: loading UI

### Infrastructure

- `docker-compose.yml`: local multi-service runtime
- `frontend/nginx.conf`: SPA hosting and `/api` reverse proxy
- `backend/Dockerfile`: multi-stage backend image
- `frontend/Dockerfile`: production frontend image
- `frontend/Dockerfile.dev`: frontend development image
- `k8s/base/*.yaml`: Kubernetes base manifests
- `k8s/overlays/local/*.yaml`: local overlay and secret
- `.github/workflows/ci-cd.yml`: CI/CD pipeline
- `scripts/start-project.bat`, `scripts/validate-project.bat`: Windows launch and validation
- `scripts/linux/run-project.sh`, `scripts/linux/validate-project.sh`: Linux launch and validation

## 3. Technology Stack and Versions

| Layer             | Technology            | Version / Image                                         | Role                              |
| ----------------- | --------------------- | ------------------------------------------------------- | --------------------------------- |
| Backend framework | Django                | 4.2.11                                                  | Web application and ORM           |
| API layer         | Django REST Framework | 3.14.0                                                  | JSON API, pagination, filtering   |
| Auth              | Simple JWT            | 5.3.1                                                   | Access and refresh tokens         |
| DB                | PostgreSQL            | 15-alpine / 15                                          | Relational persistence            |
| Cache             | Redis                 | 7-alpine / 7.0.x                                        | Response caching                  |
| Search            | Elasticsearch         | 8.11.0                                                  | Full-text search and autocomplete |
| Frontend          | React                 | 18.2.0                                                  | SPA UI                            |
| Frontend build    | Vite                  | 5.x                                                     | Dev server and production bundle  |
| Frontend HTTP     | Axios                 | 1.6.x                                                   | API client                        |
| UI motion         | Framer Motion         | 12.x                                                    | Animations                        |
| Container runtime | Docker                | Multi-stage builds                                      | Reproducible images               |
| Orchestration     | Kubernetes            | apps/v1, batch/v1, networking.k8s.io/v1, autoscaling/v2 | Deployment and scaling            |

Backend package set is defined in `backend/requirements.txt`, frontend package set in `frontend/package.json`.

## 4. Runtime Topologies

### 4.1 Docker Compose topology

Docker Compose is used as a local development topology with direct host ports.

| Service         | Container image                                        | Internal port | Host port | Depends on               |
| --------------- | ------------------------------------------------------ | ------------- | --------- | ------------------------ |
| `db`            | `postgres:15-alpine`                                   | 5432          | 5432      | none                     |
| `redis`         | `redis:7-alpine`                                       | 6379          | 6379      | none                     |
| `elasticsearch` | `docker.elastic.co/elasticsearch/elasticsearch:8.11.0` | 9200          | 9200      | none                     |
| `backend`       | built from `backend/Dockerfile`                        | 8000          | 8000      | db, redis, elasticsearch |
| `frontend`      | built from `frontend/Dockerfile.dev`                   | 5173          | 3000      | backend                  |

Key compose details:

- `db` uses a named volume `postgres_data`.
- `elasticsearch` uses a named volume `elasticsearch_data`.
- `backend` waits for healthy db/redis/elasticsearch containers.
- `frontend` uses `VITE_API_URL=http://localhost:8000/api`.
- The compose network is `app-network` using a bridge driver.

### 4.2 Kubernetes topology

Kubernetes is the target deployment topology.

| Resource       | Name                          | Type                    | Replicas   | Notes                           |
| -------------- | ----------------------------- | ----------------------- | ---------- | ------------------------------- |
| Namespace      | `movie-catalog`               | Namespace               | n/a        | Project isolation boundary      |
| Backend        | `backend`                     | Deployment              | 2          | Stateless API                   |
| Frontend       | `frontend`                    | Deployment              | 2          | Static SPA served by Nginx      |
| PostgreSQL     | `postgres`                    | StatefulSet             | 1          | Stable identity and PVC         |
| Redis          | `redis`                       | Deployment              | 1          | Cache layer                     |
| Elasticsearch  | `elasticsearch`               | StatefulSet             | 1          | Index layer and PVC             |
| Migrations     | `backend-migrate`             | Job                     | 1          | Schema bootstrap                |
| Data bootstrap | `movies-bootstrap`            | Job                     | 1          | Import and indexing             |
| DB backups     | `postgres-backup`             | CronJob                 | 1 schedule | Every 6 hours                   |
| HPA            | `backend-hpa`, `frontend-hpa` | HorizontalPodAutoscaler | n/a        | Autoscaling on resource metrics |

## 5. Backend Configuration

### 5.1 Settings and environment variables

`backend/config/settings.py` is fully environment-driven.

| Variable                         | Default / Behavior              | Purpose                 |
| -------------------------------- | ------------------------------- | ----------------------- |
| `SECRET_KEY`                     | dev placeholder                 | Django secret           |
| `DEBUG`                          | `True`                          | Debug mode toggle       |
| `ALLOWED_HOSTS`                  | `localhost,127.0.0.1,backend`   | Host validation         |
| `DATABASE_ENGINE`                | `django.db.backends.postgresql` | DB backend              |
| `DATABASE_NAME`                  | `movie_db`                      | DB name                 |
| `DATABASE_USER`                  | `postgres`                      | DB user                 |
| `DATABASE_PASSWORD`              | `postgres123`                   | DB password             |
| `DATABASE_HOST`                  | `localhost`                     | DB host                 |
| `DATABASE_PORT`                  | `5432`                          | DB port                 |
| `CACHE_BACKEND`                  | `redis` or `locmem`             | Cache backend selection |
| `REDIS_URL`                      | `redis://127.0.0.1:6379/0`      | Redis connection        |
| `ELASTICSEARCH_HOST`             | `localhost`                     | ES host                 |
| `ELASTICSEARCH_PORT`             | `9200`                          | ES port                 |
| `SESSION_COOKIE_SECURE`          | env-driven                      | Secure cookie flag      |
| `CSRF_COOKIE_SECURE`             | env-driven                      | CSRF cookie flag        |
| `SECURE_SSL_REDIRECT`            | env-driven                      | HTTPS redirect          |
| `SECURE_HSTS_SECONDS`            | env-driven                      | HSTS duration           |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | env-driven                      | HSTS subdomains         |
| `SECURE_HSTS_PRELOAD`            | env-driven                      | HSTS preload            |
| `EMAIL_HOST`                     | `smtp.mailtrap.io`              | SMTP host               |
| `EMAIL_PORT`                     | `2525`                          | SMTP port               |
| `EMAIL_USE_TLS`                  | `True`                          | SMTP TLS                |
| `EMAIL_HOST_USER`                | empty                           | SMTP user               |
| `EMAIL_HOST_PASSWORD`            | empty                           | SMTP password           |
| `DEFAULT_FROM_EMAIL`             | `noreply@moviecatalog.local`    | Sender address          |

### 5.2 Django and DRF configuration

- `INSTALLED_APPS` includes Django defaults, `rest_framework`, `corsheaders`, `django_filters`, `rest_framework_simplejwt`, and `movies`.
- `MIDDLEWARE` includes `CorsMiddleware` before `CommonMiddleware`.
- `REST_FRAMEWORK` defaults:
  - pagination: `PageNumberPagination`
  - page size: `20`
  - filter backends: DjangoFilterBackend, SearchFilter, OrderingFilter
  - auth classes: JWT + SessionAuthentication
  - permission class: `IsAuthenticatedOrReadOnly`
- `DEFAULT_THROTTLE_RATES` are configured for anonymous and authenticated users, even though no custom throttle class is enabled.
- `CORS_ALLOWED_ORIGINS` includes local dev origins on ports 3000, 5173, 8080, 18080, 19090, 30080 and loopback variants, plus `http://frontend:3000`.
- JWT settings:
  - access token lifetime: 15 minutes
  - refresh token lifetime: 7 days
  - refresh rotation: enabled
  - blacklist after rotation: enabled

### 5.3 Cache behavior

The backend switches cache implementation based on `CACHE_BACKEND`.

- `locmem` -> Django `LocMemCache` for CI and test isolation
- otherwise -> `django_redis.cache.RedisCache`

Cache behavior in views is wrapped with fail-open helpers:

- `_cache_get`
- `_cache_set`
- `_cache_delete`

Those helpers catch cache backend failures and log warnings instead of breaking the API.

### 5.4 Health endpoint

`GET /api/health/` checks:

- database connectivity via `Movie.objects.count()`
- cache connectivity via a temporary cache set

Response shape:

```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

## 6. Backend Domain Model

### 6.1 `Movie`

Table: `movies_movie`

Fields:

- `title` char field, indexed
- `release_date` date field
- `genres` JSONField list of strings
- `vote_average` float, validated between 0 and 10
- `overview` text field
- `poster_url` URL field
- `budget` bigint
- `revenue` bigint
- `created_at` auto timestamp
- `updated_at` auto timestamp

Meta:

- ordering: `-release_date`, `-vote_average`
- indexes on `title`, `release_date`, `vote_average`

String representation:

- `Title (Year)`
- uses year if `release_date` exists, otherwise `N/A`

### 6.2 `Favorite`

Table: `movies_favorite`

Fields:

- `user` FK to `auth.User`
- `movie` FK to `Movie`
- `created_at`

Constraints and meta:

- unique together: `(user, movie)`
- ordering: `-created_at`
- indexes on `(user, movie)` and `user`

### 6.3 `EmailVerification`

Table: `movies_email_verification`

Fields:

- `user` one-to-one relation
- `token` unique
- `verification_code` 6 digits
- `is_used`
- `created_at`
- `expires_at`
- `resend_count`
- `max_resends` = 5
- `email_sent_at`
- `delivery_status` in `pending`, `delivered`, `bounced`, `failed`

Factory method:

- `create_for_user(user)` creates a token and 24-hour expiry

### 6.4 `UserProfile`

Table: `movies_user_profile`

Fields:

- `user` one-to-one relation
- `full_name`
- `bio`
- `avatar_url`
- `receive_recommendations`
- `receive_notifications`
- timestamps

## 7. Backend Serializers

### `MovieSerializer`

Fields:

- `id`, `title`, `release_date`, `genres`, `vote_average`, `overview`, `poster_url`, `budget`, `revenue`, `created_at`

### `MovieDetailSerializer`

- Extends `MovieSerializer`
- adds `updated_at`

### `FavoriteSerializer`

- nested read-only `movie` using `MovieSerializer`
- write-only `movie_id`
- sets `user` automatically from request context

### `UserRegistrationSerializer`

- fields: `email`, `password`, `password_confirm`
- validates password match
- creates inactive user at serializer level
- creates a `UserProfile` immediately

### `UserLoginSerializer`

- fields: `email`, `password`

### `EmailVerificationSerializer`

- accepts either `token` or `verification_code`

### `ResendVerificationSerializer`

- field: `email`

### `UserProfileSerializer`

- exposes `email` and `username` from related user
- writable fields: `full_name`, `bio`, `avatar_url`, `receive_recommendations`, `receive_notifications`

## 8. Backend API Routes

### 8.1 Route table

| Method      | Path                             | Purpose                                | Auth          |
| ----------- | -------------------------------- | -------------------------------------- | ------------- |
| `GET`       | `/api/health/`                   | DB/cache health check                  | none          |
| `GET`       | `/api/movies/`                   | Paginated movie list                   | public        |
| `GET`       | `/api/movies/{id}/`              | Movie detail                           | public        |
| `GET`       | `/api/search/`                   | Elasticsearch-backed advanced search   | public        |
| `GET`       | `/api/autocomplete/`             | Search suggestions                     | public        |
| `GET`       | `/api/recommendations/`          | Public or personalized recommendations | public        |
| `GET`       | `/api/favorites/`                | Current user favorites                 | authenticated |
| `POST`      | `/api/favorites/`                | Add favorite                           | authenticated |
| `DELETE`    | `/api/favorites/{id}/`           | Remove favorite                        | authenticated |
| `POST`      | `/api/auth/register/`            | Register account                       | public        |
| `POST`      | `/api/auth/login/`               | Login and issue JWT                    | public        |
| `POST`      | `/api/auth/verify-email/`        | Verify by token or code                | public        |
| `POST`      | `/api/auth/resend-verification/` | Resend verification email              | public        |
| `POST`      | `/api/auth/refresh/`             | Refresh JWT                            | public        |
| `GET`       | `/api/auth/profile/`             | Current user profile                   | authenticated |
| `PUT/PATCH` | `/api/auth/profile/update/`      | Update profile                         | authenticated |

### 8.2 List endpoint behavior

`MovieViewSet` is a `ReadOnlyModelViewSet`.

- public access (`AllowAny`)
- filtering: title, genres, release year min/max, vote average min/max
- search fields: `title`, `overview`
- ordering fields: `release_date`, `vote_average`, `title`
- default ordering: `-release_date`
- list response cached for 1 hour
- detail response cached for 24 hours

### 8.3 Favorites endpoint behavior

`FavoriteViewSet` is a `ModelViewSet` with `IsAuthenticated`.

- `get_queryset()` returns favorites for the current user only
- `create()` uses `movie_id` and `get_or_create()` to prevent duplicates
- delete invalidates:
  - `favorites:{user_id}` cache key
  - recommendation cache keys for the user

### 8.4 Recommendations endpoint behavior

`GET /api/recommendations/?limit=N`

- limit is clamped between 1 and 24
- cache key differs for authenticated and anonymous users
- public path returns popular top-rated movies
- personalized path:
  - extracts favorite movies
  - builds genre weights with `Counter`
  - scores candidate movies by genre overlap, rating, and recency
  - excludes favorited movies from results
- fallback path:
  - if user has no useful history, falls back to public recommendations
- response payload includes:
  - `strategy`
  - `seed_favorites_count`
  - `top_genres`
  - `results`

Cache TTL for recommendations: 900 seconds.

### 8.5 Advanced search endpoint

`GET /api/search/` delegates to `MovieSearchService`.

Query params:

- `q`
- `genres` comma-separated
- `year_min`
- `year_max`
- `rating_min`
- `page`
- `page_size`

Response shape:

- `results`
- `total`
- `page`
- `page_size`
- `total_pages`
- `available_genres`
- `available_years`

The backend enriches search results with database values when available, especially `genres` and `poster_url`.

### 8.6 Autocomplete endpoint

`GET /api/autocomplete/`

- `q` must be at least 1 character
- `limit` is clamped between 1 and 50
- response shape: `{ "suggestions": [...] }`

### 8.7 Auth endpoints

Registration and login issue JWT access and refresh tokens.

- access token lifetime: 15 minutes
- refresh token lifetime: 7 days
- refresh rotation enabled

Registration path behavior:

- email is normalized to lowercase
- user is created via serializer
- the backend marks the user active immediately for the project flow
- JWT tokens are returned in the response

Login path behavior:

- user is looked up by email
- password is verified with Django auth
- inactive users are rejected
- JWT tokens are returned in the response

Verification path behavior:

- accepts either token or 6-digit verification code
- code/token must not be expired or already used
- user becomes active after verification

Resend behavior:

- enforces resend count limit (`max_resends = 5`)
- enforces minimum delay of 60 seconds between sends

Profile endpoints:

- create a profile on demand if missing
- allow partial updates

## 9. Elasticsearch Search Service

`movies/search.py` implements the search engine layer.

### 9.1 Index configuration

Index name: `movies`

Mapping highlights:

- `id`: integer
- `title`: text with `keyword` and `completion` subfields
- `overview`: text
- `genres`: keyword array
- `release_date`: date
- `vote_average`: float
- `vote_count`: integer
- `budget`: long
- `revenue`: long
- `popularity`: float
- `created_at`: date
- `updated_at`: date

### 9.2 Index lifecycle

- index is created lazily if it does not exist
- connection failures are logged and tolerated
- `bulk_index_movies()` indexes in batches and refreshes the index
- `clear_index()` drops the index and recreates it

### 9.3 Search scoring strategy

The advanced search query uses a bool query with weighted clauses:

- exact phrase title match, boost 10
- exact title match, boost 5
- fuzzy title match, boost 3
- overview match, boost 1

Filters can be applied for:

- genres
- release year range
- rating minimum

Sorting:

- `-vote_average`
- `-release_date`

Aggregations:

- genres buckets
- yearly release histogram

### 9.4 Autocomplete strategy

- uses a title match query
- returns unique suggestions only
- truncates to requested size

### 9.5 Health check

`get_health()` returns:

- `status`: `connected` or `disconnected`
- cluster state
- index existence flag

## 10. Data Import and Indexing Commands

### `import_movies`

Path: `backend/management/commands/import_movies.py`

Behavior:

- accepts `--csv`
- accepts `--clear`
- parses Kaggle TMDB CSV
- converts `genres` JSON into a string list
- bulk creates movies in batches of 1000
- clears Django cache after import
- prints summary counts

### `index_movies`

Path: `backend/movies/management/commands/index_movies.py`

Behavior:

- accepts `--clear`
- accepts `--batch-size`
- checks Elasticsearch connectivity first
- iterates over all movies ordered by id
- indexes one by one through `MovieSearchService`
- verifies index health at the end

### Dataset image

- `k8s/bootstrap/Dockerfile` is a minimal Alpine image
- it copies `tmdb_5000_movies.csv` into `/seed/tmdb_5000_movies.csv`
- this image is used by the Kubernetes bootstrap job

## 11. Frontend Architecture

### 11.1 App shell

`frontend/src/App.jsx` is the top-level shell.

- uses `ThemeProvider`
- uses `BrowserRouter`
- stores the current page in local state (`search` or `favorites`)
- displays a health banner based on `/api/health/`
- loads user data from `localStorage`
- loads favorites via `useFavorites()`

Public routes:

- `/register`
- `/login`
- `/verify`

Protected experience:

- search page
- favorites page

### 11.2 API client

`frontend/src/services/api.js` uses Axios.

Base URL:

- development base URL: `http://localhost:8000/api`

Features:

- attaches bearer access token from `localStorage`
- automatic 401 handling with refresh token flow
- queueing of concurrent failed requests while refresh is in progress
- redirect to `/login` if no refresh token is available

Wrapped endpoints:

- `getMovies(page, search)`
- `getMovieDetail(movieId)`
- `getFavorites(page)`
- `advancedSearch(params)`
- `searchAutocomplete(query, limit)`
- `getRecommendations(limit)`
- `addToFavorites(movieId)`
- `removeFromFavorites(favoriteId)`
- `healthCheck()`

### 11.3 Favorites hook

`useFavorites()` behavior:

- reads `access_token` from `localStorage`
- fetches favorites only when authenticated
- exposes `favorites`, `loading`, `error`
- `addFavorite(movieId)` appends the returned favorite
- `removeFavorite(movieIdOrFavoriteId)` accepts either movie id or favorite id
- `isFavorited(movieId)` checks by nested `movie.id`

### 11.4 Search page

`frontend/src/pages/Search.jsx`

- loads recommendations on mount
- reloads recommendations after favorite changes
- passes movie click handler into `AdvancedSearch`
- renders a recommendation strip above the search results
- uses `MovieModal` for detail display

### 11.5 Favorites page

`frontend/src/pages/Favorites.jsx`

- shows saved movies in a grid
- supports opening `MovieModal` for any favorite movie
- allows removal from either the card or modal flow

### 11.6 Search UI

`frontend/src/components/AdvancedSearch.jsx`

- debounced autocomplete request delay: 300ms
- supports keyword search, genre filter, year range, rating minimum
- filters are hidden by default
- search results are paginated
- autocomplete closes on outside click
- initial search runs on mount

### 11.7 Movie card and modal

`MovieCard`

- uses lazy-loaded posters
- displays rating badge, year, genres, and an optional quality badge
- includes a favorite button
- supports remove confirmation modal in card-level flow

`MovieModal`

- lazy-fetches movie detail by id
- shows poster, vote average, year, runtime, budget, revenue, genres, overview, vote count, popularity
- supports favorite/unfavorite actions

### 11.8 Login and registration flow

`Login.jsx`

- posts to `http://localhost:8000/api/auth/login/`
- stores `access_token`, `refresh_token`, and `user` in `localStorage`
- notifies parent through `onLoginSuccess`

`Register.jsx`

- posts to `http://localhost:8000/api/auth/register/`
- stores JWT tokens in `localStorage`
- triggers a delayed redirect after successful registration

`VerifyEmail.jsx`

- can verify by token from query string
- can verify manually by 6-digit code
- can resend verification email using the email passed in location state

### 11.9 Theme

`ThemeContext.jsx`

- defaults to `dark`
- persists theme in `localStorage`
- toggles `dark` / `light` classes on the root `html` element
- delays rendering until the theme is mounted to avoid hydration flicker

### 11.10 UI dependencies

Frontend `package.json` scripts:

- `dev`
- `build`
- `lint`
- `preview`
- `test`
- `test:e2e`

Frontend library set:

- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `framer-motion`
- `lucide-react`
- `vitest`, `jsdom`, Testing Library

## 12. Container Images

### 12.1 Backend image

File: `backend/Dockerfile`

Build flow:

- base image: `python:3.11-slim`
- builder stage installs `build-essential` and `libpq-dev`
- Python dependencies installed into `/opt/python`
- runtime stage installs only `libpq5`
- application copied into `/app`
- non-root user `appuser` is created and used
- exposed port: `8000`
- runtime command: Gunicorn with 2 workers, timeout 120

### 12.2 Frontend production image

File: `frontend/Dockerfile`

Build flow:

- build stage: `node:20-alpine`
- `npm ci`
- `npm run build`
- runtime stage: `nginx:alpine`
- copies built `dist` into `/usr/share/nginx/html`
- custom `nginx.conf` is used
- exposed port: `80`
- health check hits `/index.html`

### 12.3 Frontend development image

File: `frontend/Dockerfile.dev`

- base image: `node:20-alpine`
- `npm install`
- Vite dev server on `0.0.0.0:5173`
- used for Docker Compose local development

### 12.4 Frontend Nginx config

File: `frontend/nginx.conf`

Important behavior:

- upstream `backend_api` points to `backend:8000`
- `/` uses SPA fallback to `index.html`
- `/api/` is proxied to the backend service
- `/health` returns plain text `healthy`
- static asset caching is enabled
- HTML caching is disabled
- `client_max_body_size` is 20M

## 13. Kubernetes Manifests

### 13.1 Namespace and labels

`k8s/base/namespace.yaml`

- namespace name: `movie-catalog`
- labels:
  - `app.kubernetes.io/part-of: movie-catalog`
  - `app.kubernetes.io/managed-by: kubectl`

`k8s/base/kustomization.yaml`

- applies namespace `movie-catalog`
- includes all base resources
- adds the `app.kubernetes.io/part-of: movie-catalog` label to resources

### 13.2 ConfigMap and secret

`k8s/base/configmap.yaml` contains non-sensitive runtime configuration:

- `DEBUG=False`
- database connection values
- Redis URL
- Elasticsearch host/port
- allowed hosts
- `VITE_API_URL=/api`

`k8s/overlays/local/secret.local.yaml` contains local secret values:

- `SECRET_KEY`
- `DATABASE_PASSWORD`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

### 13.3 Services and ports

| K8s object       | Name                     | Port | Target port | Role                 |
| ---------------- | ------------------------ | ---- | ----------- | -------------------- |
| Service          | `backend`                | 8000 | 8000        | API service          |
| Service          | `frontend`               | 80   | 80          | SPA service          |
| Service          | `postgres`               | 5432 | 5432        | DB service           |
| Headless Service | `postgres-headless`      | 5432 | 5432        | StatefulSet identity |
| Service          | `redis`                  | 6379 | 6379        | Cache service        |
| Service          | `elasticsearch`          | 9200 | 9200        | Search service       |
| Headless Service | `elasticsearch-headless` | 9200 | 9200        | StatefulSet identity |

### 13.4 Backend workload

`k8s/base/backend.yaml`

- Deployment replicas: 2
- RollingUpdate with `maxUnavailable: 0` and `maxSurge: 1`
- container port: 8000
- service account: `backend-sa`
- non-root securityContext: uid/gid 1000
- startup/readiness/liveness probes on `/api/health/` with `Host: backend`
- requests/limits:
  - CPU: 200m / 1000m
  - memory: 256Mi / 1Gi

Also in the same file:

- Job `backend-migrate`
- runs `python manage.py migrate --noinput`
- uses the same backend image
- uses `backend-sa`
- resource requests/limits:
  - CPU: 100m / 500m
  - memory: 256Mi / 512Mi

### 13.5 Frontend workload

`k8s/base/frontend.yaml`

- Deployment replicas: 2
- RollingUpdate with `maxUnavailable: 0` and `maxSurge: 1`
- container port: 80
- service account: `frontend-sa`
- startup/readiness/liveness probes on `/health`
- requests/limits:
  - CPU: 100m / 500m
  - memory: 128Mi / 512Mi

### 13.6 PostgreSQL workload

`k8s/base/postgres.yaml`

- StatefulSet replicas: 1
- headless service: `postgres-headless`
- service: `postgres`
- container port: 5432
- service account: `data-sa`
- readiness/liveness probes use `pg_isready`
- requests/limits:
  - CPU: 200m / 1000m
  - memory: 512Mi / 1Gi
- PVC request: 10Gi

### 13.7 Redis workload

`k8s/base/redis.yaml`

- Deployment replicas: 1
- service: `redis`
- container port: 6379
- service account: `data-sa`
- command: `redis-server --appendonly yes`
- readiness/liveness probes use `redis-cli ping`
- requests/limits:
  - CPU: 50m / 250m
  - memory: 128Mi / 512Mi

### 13.8 Elasticsearch workload

`k8s/base/elasticsearch.yaml`

- StatefulSet replicas: 1
- headless service: `elasticsearch-headless`
- service: `elasticsearch`
- container port: 9200
- service account: `data-sa`
- environment:
  - `discovery.type=single-node`
  - `xpack.security.enabled=false`
  - `ES_JAVA_OPTS=-Xms512m -Xmx512m`
- readiness/liveness probes hit `/_cluster/health`
- requests/limits:
  - CPU: 250m / 1000m
  - memory: 768Mi / 2Gi
- PVC request: 15Gi

### 13.9 Bootstrap job

`k8s/base/bootstrap.yaml`

- Job name: `movies-bootstrap`
- TTL after finished: 86400 seconds
- service account: `backend-sa`
- initContainer `seed-copy` copies the CSV from the dataset image to `/work`
- main container uses backend image
- job waits for DB connectivity
- imports movies only if table is empty
- runs `python manage.py index_movies --clear`
- retries Elasticsearch readiness up to 20 times
- uses `emptyDir` for seed volume
- requests/limits:
  - CPU: 150m / 700m
  - memory: 256Mi / 1Gi

### 13.10 Ingress

`k8s/base/ingress.yaml`

- ingress class: `nginx`
- host: `movie.local`
- path `/api` -> service `backend`, port 8000
- path `/` -> service `frontend`, port 80
- annotations:
  - body size 20m
  - connect/read/send timeout 60s

### 13.11 HPA

`k8s/base/hpa.yaml`

Backend HPA:

- target: Deployment `backend`
- min replicas: 2
- max replicas: 5
- metrics:
  - CPU utilization 70%
  - memory utilization 80%
- scale-up behavior:
  - stabilization window 60s
  - policies: 100% or 2 pods per 60s
- scale-down behavior:
  - stabilization window 300s
  - policy: 50% per 60s

Frontend HPA:

- target: Deployment `frontend`
- min replicas: 2
- max replicas: 4
- metrics:
  - CPU utilization 75%
- scale-up behavior:
  - stabilization window 30s
  - policy: 100% per 60s
- scale-down behavior:
  - stabilization window 180s
  - policy: 50% per 60s

HPA requires metrics-server in the cluster.

### 13.12 Network policies

`k8s/base/networkpolicy.yaml`

Default posture:

- default deny all ingress and egress
- explicit DNS egress allowed
- frontend ingress allowed only from `ingress-nginx`
- backend ingress allowed only from `ingress-nginx`
- backend egress allowed to PostgreSQL, Redis, Elasticsearch, and DNS
- PostgreSQL ingress allowed only from backend
- Redis ingress allowed only from backend
- Elasticsearch ingress allowed only from backend

`k8s/base/networkpolicy-backup.yaml`

Backup-related flows:

- backup job egress to PostgreSQL and DNS
- PostgreSQL ingress from backup job
- Redis/Elasticsearch ingress from bootstrap job
- bootstrap egress to PostgreSQL, Redis, Elasticsearch, and DNS

### 13.13 Service accounts and RBAC

`k8s/base/serviceaccounts.yaml`

- `backend-sa`
- `frontend-sa`
- `data-sa`
- all have `automountServiceAccountToken: false`

`k8s/base/rbac.yaml`

- Role `app-read-config` allows `get` on configmaps and secrets
- RoleBinding `backend-read-config` binds that role to `backend-sa`

### 13.14 Reliability resources

`k8s/base/reliability.yaml`

- PodDisruptionBudget `backend-pdb` with `minAvailable: 1`
- PodDisruptionBudget `frontend-pdb` with `minAvailable: 1`
- PVC `postgres-backups` with 5Gi
- CronJob `postgres-backup` scheduled every 6 hours (`0 */6 * * *`)
- backup container uses `pg_dump` and writes SQL dumps to `/backups`
- backup job uses `data-sa`

## 14. Traffic and Port Matrix

### 14.1 External and local ports

| Component                 | Local / Host access | Internal / Cluster access | Notes           |
| ------------------------- | ------------------- | ------------------------- | --------------- |
| Frontend Compose          | `localhost:3000`    | `frontend:5173`           | Vite dev server |
| Backend Compose           | `localhost:8000`    | `backend:8000`            | Django API      |
| Docker Compose DB         | `localhost:5432`    | `db:5432`                 | PostgreSQL      |
| Docker Compose Redis      | `localhost:6379`    | `redis:6379`              | Cache           |
| Docker Compose ES         | `localhost:9200`    | `elasticsearch:9200`      | Search          |
| K8s Ingress               | `movie.local`       | service routing           | public entry    |
| K8s port-forward frontend | `localhost:18080`   | `svc/frontend:80`         | used by scripts |
| K8s port-forward backend  | `localhost:8000`    | `svc/backend:8000`        | used by scripts |

### 14.2 Main traffic flows

| Source        | Destination      | Port                    | Purpose            |
| ------------- | ---------------- | ----------------------- | ------------------ |
| Browser       | Ingress NGINX    | 80 / host `movie.local` | public entry       |
| Ingress       | Frontend service | 80                      | SPA delivery       |
| Ingress       | Backend service  | 8000                    | API delivery       |
| Frontend pod  | Backend service  | 8000                    | API calls          |
| Backend pod   | PostgreSQL       | 5432                    | persistence        |
| Backend pod   | Redis            | 6379                    | cache              |
| Backend pod   | Elasticsearch    | 9200                    | search             |
| Bootstrap job | PostgreSQL       | 5432                    | import             |
| Bootstrap job | Redis            | 6379                    | cache/coordination |
| Bootstrap job | Elasticsearch    | 9200                    | index build        |
| Backup job    | PostgreSQL       | 5432                    | database dump      |

## 15. CI/CD Pipeline

File: `.github/workflows/ci-cd.yml`

### 15.1 Jobs

#### `backend-ci`

- runs on `ubuntu-latest`
- installs Python 3.11
- `pip install -r requirements.txt`
- `python manage.py check --deploy --fail-level WARNING`
- `python -m compileall .`
- runs tests with `DATABASE_ENGINE=django.db.backends.sqlite3`
- forces cache backend to `locmem`

#### `frontend-ci`

- runs on `ubuntu-latest`
- installs Node 20
- `npm ci`
- `npm run test -- --run`
- `npm run build`

#### `k8s-validate`

- depends on backend and frontend CI
- runs `kubectl kustomize k8s/overlays/local`
- verifies rendered output is not empty

#### `docker-build`

- builds backend image from `./backend/Dockerfile`
- builds frontend image from `./frontend/Dockerfile`
- uses Docker Buildx

#### `publish-images`

- manual trigger only (`workflow_dispatch`)
- logs into Docker Hub
- pushes backend and frontend images with the current commit SHA tag

### 15.2 Validation coverage

The pipeline covers:

- Python syntax and deploy checks
- backend test suite
- frontend test suite
- production frontend build
- Kustomize rendering
- Docker image builds

## 16. Local Launch and Validation Scripts

### Windows launcher

`./scripts/start-project.bat`

Behavior:

- checks `docker` and `kubectl`
- ensures cluster reachability
- installs `ingress-nginx` if missing
- builds backend image
- builds production frontend image
- builds dataset seed image
- applies `k8s/overlays/local`
- restarts backend and frontend deployments to pick up local images
- waits for postgres, elasticsearch, redis, backend, frontend
- waits for jobs `backend-migrate` and `movies-bootstrap`
- starts port-forwards:
  - frontend `18080:80`
  - backend `8000:8000`

### Windows validation

`./scripts/validate-project.bat`

Checks:

- pod readiness
- ingress, services, HPA
- backend health through `localhost:8000/api/health/`
- frontend root through `localhost:18080/`
- movie count queried from backend pod
- HPA descriptions

### Linux launcher

`./scripts/linux/run-project.sh`

Behavior mirrors the Windows launcher, but:

- uses `nohup` for port-forward processes
- stores PID and log files under `.run-state/linux`
- checks `docker`, `kubectl`, and `curl`

### Linux validation

`./scripts/linux/validate-project.sh`

Checks the same runtime conditions as the Windows validation script.

## 17. Frontend and Backend Operational Notes

### Health and status

- The frontend app displays an API health banner from `healthCheck()`.
- The backend health endpoint is used by Kubernetes probes and by the frontend status banner.
- The frontend Nginx container also exposes `/health` for container-level checks.

### Authentication storage

- The frontend stores `access_token`, `refresh_token`, and `user` in `localStorage`.
- `useFavorites()` uses the access token presence to decide whether to query favorites.
- Axios refresh logic uses `/auth/refresh/` automatically after 401 responses.

### Recommendation invalidation

- Adding or removing a favorite invalidates recommendation cache entries for that user.
- This ensures recommendations reflect profile changes quickly.

### Search behavior

- Simple search bar: debounce around 500ms
- Advanced search autocomplete: debounce around 300ms
- Advanced search supports title/keyword search and filters for genre, year, rating
- Search results are paginated and can be filtered via Elasticsearch-backed query parameters

## 18. Technical Constraints and Choices

- The project intentionally uses a single Django backend instead of splitting backend responsibilities into multiple microservices.
- Redis is used as a cache, not as the source of truth.
- Elasticsearch is used for advanced search and autocomplete, not as the main database.
- PostgreSQL remains the canonical system of record.
- Kubernetes workloads are split between stateless deployments and stateful sets to match the persistence model.
- HPA is only applied to stateless workloads (`backend`, `frontend`).
- The cluster requires metrics-server for autoscaling visibility and behavior.
- NetworkPolicies implement a default-deny posture, which is stricter than the minimum subject requirement.

## 19. Evidence Files

Useful source files for technical verification:

- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/movies/models.py`
- `backend/movies/views.py`
- `backend/movies/search.py`
- `backend/management/commands/import_movies.py`
- `backend/movies/management/commands/index_movies.py`
- `frontend/src/App.jsx`
- `frontend/src/services/api.js`
- `frontend/src/pages/Search.jsx`
- `frontend/src/pages/Favorites.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/VerifyEmail.jsx`
- `frontend/src/components/AdvancedSearch.jsx`
- `frontend/src/components/MovieModal.jsx`
- `frontend/src/components/MovieCard.jsx`
- `frontend/nginx.conf`
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/Dockerfile.dev`
- `k8s/base/*.yaml`
- `k8s/overlays/local/*.yaml`
- `.github/workflows/ci-cd.yml`
- `scripts/start-project.bat`
- `scripts/validate-project.bat`
- `scripts/linux/run-project.sh`
- `scripts/linux/validate-project.sh`

## 20. Short Technical Summary

The project is a Dockerized React + Django system with PostgreSQL persistence, Redis caching, Elasticsearch search, Kubernetes orchestration, JWT authentication, HPA-based autoscaling, network isolation, backup automation, and CI/CD validation. The canonical traffic path in Kubernetes is:

`movie.local` -> Ingress -> `frontend` or `backend` service -> application pod -> PostgreSQL / Redis / Elasticsearch as required.
