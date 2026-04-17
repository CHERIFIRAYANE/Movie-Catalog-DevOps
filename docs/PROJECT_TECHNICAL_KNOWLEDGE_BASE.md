# Project Technical Knowledge Base (For AI Report Generation)

## 1) Purpose of This File

This document is a source-of-truth briefing for another AI model to generate a high-quality, detailed project report.
It consolidates architecture, technical choices, implementation evidence, deployment flow, and evaluation alignment.

Use this file as the primary context and verify claims against referenced source files.

---

## 2) Official Assignment Constraints (Extracted from Project PDF)

Source: `projet_containerisation.pdf` (assignment brief).

### Mandatory expectations

- Build a web app with:
  - movie catalog display
  - search bar
  - clear front-end / back-end / database architecture
  - HTTP API exposure and consumption
  - containerization and deployability
- Use at least one database (SQL and/or NoSQL).
- Containerize front-end, back-end, database with Docker.
- Deploy with Kubernetes using at least:
  - Pods
  - Services
  - Ingress
  - ConfigMaps
  - Secrets
- Reflect on scaling.
- Provide Git repository and CI/CD pipeline.

### Deliverables

- Source code archive
- README with launch instructions
- Ideally one-command launch script
- Project report in PDF
- 5-minute presentation video

### Evaluation criteria

- Architectural coherence
- Technical choice quality
- Tool mastery (API, DB, Docker, Kubernetes)
- Ability to justify choices
- Documentation/report clarity
- Demo quality

---

## 3) Project Identity and Scope

- Project name: Movie Catalog Web Application
- Team: Rayane CHERIFI, SEBA Abdelwahab
- Main goal: deliver a realistic, deployable data-oriented web app with strong DevOps practices

### Core functionality scope

- Browse movies
- Search movies (basic + advanced)
- Movie details
- Favorites management
- User authentication (JWT + email verification flow)

---

## 4) Repository and Structure (High-Level)

Top-level important paths:

- `backend/` Django REST API
- `frontend/` React + Vite app
- `k8s/base/` Kubernetes base manifests
- `k8s/overlays/local/` Local kustomize overlay (includes local secret)
- `scripts/` launcher/validation/stop scripts
- `.github/workflows/ci-cd.yml` CI/CD pipeline
- `docker-compose.yml` local dev orchestration
- `tmdb_5000_movies.csv` dataset file used for bootstrap image

Entry scripts:

- `run-project.bat` (wrapper)
- `validate-project.bat` (wrapper)
- `stop-project.bat` (wrapper)
- Real implementation in `scripts/start-project.bat`, `scripts/validate-project.bat`, `scripts/stop-project.bat`
- Linux equivalents in `scripts/linux/*.sh`
- macOS equivalents in `scripts/macos/*.sh`

---

## 5) Architecture Summary

### 5.1 Logical architecture

- Front-end: React SPA (served by Nginx in production image)
- Back-end: Django REST API (Gunicorn)
- Data stores:
  - PostgreSQL for relational persistence
  - Redis for cache/session-like acceleration
  - Elasticsearch for advanced search and autocomplete
- Ingress routes:
  - `/` -> frontend service
  - `/api` -> backend service

### 5.2 Runtime topology in Kubernetes

Namespace: `movie-catalog`

Workloads:

- Frontend: Deployment, replicas=2
- Backend: Deployment, replicas=2
- PostgreSQL: StatefulSet, replicas=1, PVC 10Gi
- Elasticsearch: StatefulSet, replicas=1, PVC 15Gi
- Redis: Deployment, replicas=1
- Jobs:
  - `backend-migrate` (schema migration)
  - `movies-bootstrap` (import + indexing)
- Reliability resources:
  - PodDisruptionBudget for frontend and backend
  - CronJob for PostgreSQL backup every 6 hours

Network and config:

- Ingress (nginx class, host `movie.local`)
- ConfigMap: `app-config`
- Secret: `app-secrets`
- NetworkPolicies with default deny + explicit allowed flows
- ServiceAccounts (`backend-sa`, `frontend-sa`, `data-sa`) with automount token disabled
- RBAC role grants backend read access to ConfigMaps/Secrets

---

## 6) Technology Stack and Concrete Justifications

### 6.1 Backend: Django + DRF

Why this is defensible:

- Rapid API development with robust conventions (ViewSets, serializers, pagination, filtering)
- Mature auth/security primitives
- ORM + migration tooling suitable for relational model
- Easy extension for health checks, cache integration, and command-based data pipelines

Evidence:

- `backend/config/urls.py`
- `backend/movies/views.py`
- `backend/movies/models.py`

### 6.2 Frontend: React + Vite

Why this is defensible:

- Componentized UI and reusable logic via hooks
- Efficient dev workflow and build output
- Strong ecosystem (routing, HTTP, animation)
- Clear API integration boundary (`frontend/src/services/api.js`)

Evidence:

- `frontend/src/App.jsx`
- `frontend/src/pages/Search.jsx`
- `frontend/src/pages/Favorites.jsx`
- `frontend/src/services/api.js`

### 6.3 Data layer: PostgreSQL + Redis + Elasticsearch

Why this is defensible:

- PostgreSQL handles structured relational data (movies, users, favorites)
- Redis reduces repeated database/API response cost via cache keys and TTL
- Elasticsearch supports richer full-text search, filtering, and autocomplete

Evidence:

- Model schema: `backend/movies/models.py`
- Cache behavior in views: `backend/movies/views.py`
- Search service and index mapping: `backend/movies/search.py`

### 6.4 Docker + Kubernetes

Why this is defensible:

- Docker ensures reproducible environments and image-based delivery
- Kubernetes provides orchestration, probes, rollouts, service discovery, and config separation
- Multi-OS scripts reduce setup friction for evaluators

Evidence:

- Dockerfiles: `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/Dockerfile.dev`, `k8s/bootstrap/Dockerfile`
- K8s manifests: `k8s/base/*.yaml`
- Launch scripts: `scripts/start-project.bat`, `scripts/linux/run-project.sh`, `scripts/macos/run-project.sh`

### 6.5 Dependency and version snapshot

Backend key packages (`backend/requirements.txt`):

- Django 4.2.11
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.1
- psycopg2-binary 2.9.9 / psycopg 3.1.14
- redis 5.0.1 / django-redis 5.4.0
- elasticsearch 8.11.0 / elasticsearch-dsl 8.11.0
- gunicorn 21.2.0

Frontend key packages (`frontend/package.json`):

- react 18.2.0
- react-router-dom 6.18.0
- vite 5.x
- axios 1.6.x
- framer-motion 12.x

Container/runtime images:

- Backend runtime: `python:3.11-slim`
- Frontend runtime: `nginx:alpine`
- Postgres: `postgres:15-alpine`
- Redis: `redis:7-alpine`
- Elasticsearch: `docker.elastic.co/elasticsearch/elasticsearch:8.11.0`

---

## 7) Data Model and Domain Implementation

### 7.1 Primary entities

### `Movie`

Key fields include:

- `title` (indexed)
- `release_date`
- `genres` (JSONField list)
- `vote_average`
- `overview`
- `poster_url`
- `budget`, `revenue`
- timestamps

Indexes:

- title
- release_date
- vote_average

### `Favorite`

- user <-> movie relation
- uniqueness constraint per `(user, movie)` to prevent duplicates

### Additional auth/profile models

- `EmailVerification` with token/code, expiry, resend tracking, delivery status
- `UserProfile` for optional user metadata/preferences

Evidence:

- `backend/movies/models.py`

---

## 8) API Surface (Implemented)

Main routes are configured in `backend/config/urls.py`.

### Core endpoints

- `GET /api/health/`
- `GET /api/movies/`
- `GET /api/movies/{id}/`
- `GET|POST|DELETE /api/favorites/...` (auth required)
- `GET /api/search/` (advanced search)
- `GET /api/autocomplete/`

### Authentication endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/verify-email/`
- `POST /api/auth/resend-verification/`
- `POST /api/auth/refresh/`
- `GET /api/auth/profile/`
- `POST /api/auth/profile/update/`

### API client behavior (frontend)

- Axios client with automatic JWT injection
- Automatic refresh-token flow on 401

Evidence:

- `backend/config/urls.py`
- `backend/movies/views.py`
- `frontend/src/services/api.js`

---

## 9) Search and Caching Details

### 9.1 Redis caching in movie endpoints

From `MovieViewSet`:

- List cache key pattern: `movies:page:{page}:search:{search}`
- List TTL: 3600s
- Detail cache key: `movie:{id}`
- Detail TTL: 86400s
- Favorite mutation invalidates per-user favorites cache key

### 9.2 Elasticsearch search service

Capabilities:

- Multi-criteria search (query, genres, year range, rating)
- Ranking strategy with weighted title and overview matching
- Aggregations for available genres/years
- Autocomplete endpoint
- Index health and clear/index utilities

Evidence:

- `backend/movies/views.py`
- `backend/movies/search.py`
- `backend/movies/management/commands/index_movies.py`

---

## 10) Dataset and Bootstrap Pipeline

Dataset file in repo root:

- `tmdb_5000_movies.csv`

### Import pipeline

- Django command parses CSV, sanitizes values, bulk inserts in batches
- In Kubernetes, bootstrap job performs:
  1. DB readiness polling
  2. conditional import when movie count is zero
  3. Elasticsearch indexing with retry loop
  4. non-zero failure when indexing cannot complete

### Technical nuance

- Import command currently sets poster URLs to Picsum placeholders using movie id as random seed
  rather than direct TMDB poster path.

Evidence:

- `backend/movies/management/commands/import_movies.py`
- `backend/movies/management/commands/index_movies.py`
- `k8s/base/bootstrap.yaml`

---

## 11) Deployment and Operations

### 11.1 Kubernetes launch flow (Windows script)

`scripts/start-project.bat` does:

1. prerequisite checks (docker, kubectl, cluster reachability)
2. ingress-nginx install/rollout check
3. build backend image
4. build frontend image
5. build dataset seed image
6. delete old jobs then apply manifests (`kubectl apply -k k8s/overlays/local`)
7. rollout waits for postgres, elasticsearch, redis, backend, frontend
8. job wait and retry logic for bootstrap
9. opens two port-forward terminal windows:
   - frontend `18080:80`
   - backend `8000:8000`

Validation script:

- `scripts/validate-project.bat` and Linux/macOS equivalents check:
  - pods
  - ingress/services
  - backend health endpoint
  - frontend title from root HTML
  - movie count via `python manage.py shell`

Stop script:

- kills port-forward sessions and deletes k8s overlay resources

Evidence:

- `scripts/start-project.bat`
- `scripts/validate-project.bat`
- `scripts/stop-project.bat`
- `scripts/linux/*.sh`
- `scripts/macos/*.sh`

### 11.2 Docker Compose local mode

`docker-compose.yml` defines:

- db (postgres 15-alpine)
- redis (appendonly)
- elasticsearch 8.11 single-node
- backend in dev mode (`runserver`)
- frontend in dev mode (`Dockerfile.dev`, Vite on 5173 exposed as 3000)

Evidence:

- `docker-compose.yml`
- `frontend/Dockerfile.dev`

---

## 12) CI/CD Pipeline (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`

Jobs:

- `backend-ci`
  - setup Python 3.11
  - install requirements
  - `python manage.py check --deploy --fail-level WARNING`
  - python compile/syntax check
- `frontend-ci`
  - setup Node 20
  - `npm ci`
  - `npm run build`
- `k8s-validate`
  - kubectl setup
  - `kubectl kustomize k8s/overlays/local`
  - ensure render output is non-empty
- `docker-build`
  - build backend and frontend images (no push)
- `publish-images`
  - manual trigger (`workflow_dispatch`) only
  - docker hub login + push images tagged by commit sha

---

## 13) Security and Reliability Posture

### Implemented strengths

- Config and secret separation via ConfigMap/Secret
- Non-root backend container
- ServiceAccount tokens not auto-mounted
- NetworkPolicy default deny + explicit allowed traffic
- Readiness/liveness/startup probes for application components
- Rolling updates for frontend/backend
- PodDisruptionBudgets
- Scheduled PostgreSQL backups (CronJob)
- JWT auth with refresh flow

### Gaps/limitations to acknowledge in report

- Local/dev posture in some settings (e.g., local secret values)
- No full observability stack included (metrics dashboards)
- No automated end-to-end integration test in CI
- Image publishing is manual, not every push

---

## 14) Report Writing Guidance for Another AI

### 14.1 Required report intent

Generate a professional project report aligned with assignment constraints, emphasizing:

- architecture coherence
- technical justification grounded in implementation
- deployment reproducibility
- evidence-backed claims

### 14.2 Non-hallucination rules

- Do not claim features that are not present in source files.
- Treat source code as authority over README prose.
- For every major claim, cite at least one source path from this repo.

### 14.3 Recommended report structure

1. Context and objectives
2. Assignment compliance matrix
3. Architecture description + diagram
4. Technology choices and concrete tradeoffs
5. Data model and API design
6. Containerization and deployment pipeline
7. CI/CD and quality controls
8. Security/reliability controls
9. Limits and roadmap
10. Conclusion

### 14.4 Recommended evidence style

- For each section, add a short "evidence" block listing source files.
- Include quantifiable parameters where available:
  - replicas, probe paths/timeouts, PVC sizes
  - schedule of CronJob backups
  - endpoint list
  - cache TTLs

---

## 15) Evidence Index (Quick Lookup)

### Backend/API

- `backend/config/urls.py`
- `backend/config/settings.py`
- `backend/movies/views.py`
- `backend/movies/models.py`
- `backend/movies/search.py`
- `backend/movies/management/commands/import_movies.py`
- `backend/movies/management/commands/index_movies.py`

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/pages/Search.jsx`
- `frontend/src/pages/Favorites.jsx`
- `frontend/src/services/api.js`
- `frontend/nginx.conf`

### Containerization/Orchestration

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/Dockerfile.dev`
- `docker-compose.yml`
- `k8s/base/backend.yaml`
- `k8s/base/frontend.yaml`
- `k8s/base/postgres.yaml`
- `k8s/base/redis.yaml`
- `k8s/base/elasticsearch.yaml`
- `k8s/base/bootstrap.yaml`
- `k8s/base/ingress.yaml`
- `k8s/base/networkpolicy.yaml`
- `k8s/base/reliability.yaml`
- `k8s/base/serviceaccounts.yaml`
- `k8s/base/rbac.yaml`
- `k8s/base/configmap.yaml`
- `k8s/base/kustomization.yaml`
- `k8s/overlays/local/kustomization.yaml`

### Scripts and pipeline

- `run-project.bat`
- `validate-project.bat`
- `stop-project.bat`
- `scripts/start-project.bat`
- `scripts/validate-project.bat`
- `scripts/stop-project.bat`
- `scripts/linux/run-project.sh`
- `scripts/linux/validate-project.sh`
- `scripts/linux/stop-project.sh`
- `scripts/macos/run-project.sh`
- `scripts/macos/validate-project.sh`
- `scripts/macos/stop-project.sh`
- `.github/workflows/ci-cd.yml`

### Assignment and docs

- `projet_containerisation.pdf`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/API_DOCUMENTATION.md`
- `docs/SETUP.md`
- `docs/DATA_IMPORT.md`

---

## 16) Optional Prompt Template (Copy/Paste for Another AI)

Use this prompt with another model:

"Using PROJECT_TECHNICAL_KNOWLEDGE_BASE.md as the primary factual source, generate a detailed academic-quality project report (French) aligned with the assignment constraints in projet_containerisation.pdf. Include a compliance matrix, architecture explanation, concrete technology justifications, deployment and CI/CD analysis, security/reliability discussion, limitations, and roadmap. Every major claim must be evidence-backed using repository file references. Avoid hallucinations and avoid claiming unimplemented features."
