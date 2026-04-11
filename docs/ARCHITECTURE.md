# Architecture & Technical Decisions

## Document Version
- **Last Updated**: April 11, 2026
- **Status**: In Progress (filled during development)

---

## 1. System Overview

The Movie Catalog application follows a **three-tier microservices architecture** with containerized components:

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│                   React + Vite Frontend                      │
│              (Browsers, HTTP/REST API calls)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │ CORS-enabled HTTP Requests      │
        │ (JSON payloads)                 │
        │
┌───────▼──────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│              Django REST Framework Backend                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Views (GET /api/movies/, POST /api/favorites/)      │   │
│  │  Serializers (JSON validation & transformation)      │   │
│  │  Filters (Search, Pagination, Caching)               │   │
│  │  Authentication (Token-based for favorites)          │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬─────────────────────────────────────┬────────────────────┘
     │                                     │
     │ ORM Queries                         │ Redis Reads/Writes
     │ (SQLAlchemy-like)                   │ (Key-value store)
     │
┌────▼─────────────────────┐   ┌──────────▼──────────────┐
│    DATA LAYER            │   │   CACHE LAYER          │
│  PostgreSQL Database     │   │   Redis (7-alpine)     │
│  ┌────────────────────┐  │   │                        │
│  │ Movies table       │  │   │ Cache TTLs:            │
│  │ Users table        │  │   │ - Movie list: 1h       │
│  │ Favorites table    │  │   │ - Movie detail: 24h    │
│  │ (Normalized)       │  │   │ - Search: 30m          │
│  │                    │  │   │ - Favorites: 1h        │
│  └────────────────────┘  │   └────────────────────────┘
└────────────────────────────┘
```

---

## 2. Technology Stack Justification

### Backend: Django REST Framework (DRF)

**Why Django?**
- ✅ **ORM (Object-Relational Mapping)**: Eliminates raw SQL; reduces bugs
- ✅ **Built-in Admin Panel**: Manage movies, users without custom UI
- ✅ **Security Defaults**: CSRF protection, SQL injection prevention, password hashing
- ✅ **Validation**: Serializers provide automatic request/response validation
- ✅ **Middleware**: Logging, CORS, authentication middleware included
- ✅ **Testing Framework**: Django.test integrates with database

**Alternatives Considered**:
- **Flask**: Minimal, flexible, but requires manual setup for validation, admin, auth → Adds ~2 weeks for solo dev
- **FastAPI**: Modern async/await, but overkill for CRUD operations; learning curve on async patterns

**Decision**: Django DRF reduces development time by 40% through batteries-included approach.

---

### Frontend: React + Vite

**Why React?**
- ✅ **Component Reusability**: MovieCard, SearchBar, Pagination shared across pages
- ✅ **State Management**: Hooks (useState, useEffect) sufficient for this scope
- ✅ **Ecosystem**: axios, react-router mature and stable
- ✅ **Developer Experience**: JSX intuitive, browser DevTools excellent

**Why Vite (not Create React App)?**
- ✅ **Build Speed**: 10-50x faster than webpack; HMR in <100ms
- ✅ **Docker-Friendly**: Smaller final bundle, faster image builds
- ✅ **Native ESM**: Modern build strategy, fewer dependencies
- ✅ **Minimal Config**: vite.config.js has ~20 lines vs. CRA's hidden webpack config

**Alternatives Considered**:
- **Vue/Angular**: Equivalent functionality; React ecosystem more familiar
- **SvelteKit**: Excellent performance; smaller community, less documentation

**Decision**: React + Vite balances ecosystem maturity with modern tooling.

---

### Database: PostgreSQL (not MongoDB)

**Why PostgreSQL?**

| Feature | Need | PostgreSQL | MongoDB |
|---------|------|-----------|---------|
| **Relational Data** | Movies ↔ Genres ↔ Ratings | ✅ Native | ⚠️ Document-based (less natural) |
| **ACID Transactions** | Ensure consistency (e.g., favorite add fails atomically) | ✅ Yes | ⚠️ Yes (but heavier semantics) |
| **Full-Text Search** | Search by title, overview | ✅ Native `ilike`, `FTS` | ⚠️ Requires Elasticsearch |
| **JSON Support** | Flexible fields (e.g., metadata) | ✅ JSONB type | ✅ Native |
| **Mature Ecosystem** | Proven at Netflix, Spotify, Airbnb | ✅ 25+ years | ⚠️ 15 years (younger) |
| **Free/Open-Source** | Budget constraint | ✅ Yes | ✅ Yes |

**Alternatives Considered**:
- **MySQL**: Works equally; PostgreSQL has better JSON support & ecosystem
- **SQLite**: Single-file; no multi-container scaling; acceptable for proof-of-concept only

**Decision**: PostgreSQL's native full-text search eliminates need for Elasticsearch; relational structure reduces application complexity.

---

### Cache: Redis (not Memcached)

**Why Redis?**

| Feature | Use Case | Redis | Memcached |
|---------|----------|-------|-----------|
| **Data Structures** | Need expiring key-value | ✅ Strings, lists, hashes, sets | ⚠️ Strings only |
| **Persistence** | Optional durability | ✅ RDB snapshots, AOF logs | ❌ In-memory only |
| **Pub/Sub** | Future WebSocket features | ✅ Built-in | ❌ Not available |
| **Transactions** | Atomic operations | ✅ MULTI/EXEC | ❌ Not available |
| **TTL Support** | Expiring cache entries | ✅ Automatic expiration | ✅ Yes |
| **Docker Image Size** | Container efficiency | ✅ 10MB (redis:7-alpine) | ✅ 8MB (memcached:alpine) |

**Caching Strategy**:
```python
# Example: Cache movie list page for 1 hour
cache_key = f"movies:page:{page_num}"
cached_data = redis.get(cache_key)
if not cached_data:
    movies = Movie.objects.filter(...).paginate(page_num)
    redis.setex(cache_key, 3600, serialize(movies))
    return movies
return deserialize(cached_data)
```

**Alternatives Considered**:
- **Database-Level Caching**: PostgreSQL query plan caching; insufficient for high-traffic scenarios
- **Elasticsearch**: Full-featured search engine; overkill for 5k movies with PostgreSQL `ILIKE`

**Decision**: Redis simple key-value model perfect for demonstrating caching patterns without operational complexity.

---

### Containerization: Docker

**Why Docker?**

| Requirement | meets? | Reason |
|-----------|--------|--------|
| **Reproducibility** | ✅ | Same image runs identically on laptop, CI/CD, Kubernetes |
| **Isolation** | ✅ | Services don't interfere (backend Python deps ≠ frontend Node deps) |
| **Kubernetes-Ready** | ✅ | K8s expects OCI-compliant container images |
| **Industry Standard** | ✅ | 90%+ of projects; forces to learn transferable skills |

**Multi-Stage Builds**:
```dockerfile
# Frontend example
FROM node:20-alpine AS build
COPY . /app
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Result: 50MB (build artifacts), not 300MB (node_modules)
```

**Alternatives Considered**:
- **Podman**: Drop-in Docker replacement; less ecosystem support
- **LXC**: Lower-level containers; steeper learning curve

**Decision**: Docker ecosystem strongest; required for K8s deployment.

---

### Orchestration: Kubernetes

**Why Kubernetes (not Docker Swarm)?**

| Feature | K8s | Swarm |
|---------|-----|-------|
| **Self-Healing** | Restarts failed pods | Restart if marked | |
| **Load Balancing** | Service abstraction (round-robin) | Basic | |
| **Rolling Updates** | Zero-downtime deploys | Requires scripting | |
| **ConfigMaps/Secrets** | Native config separation | External .env files | |
| **Scaling** | Horizontal scaling (`replicas: 3`) | `docker service scale` | |
| **Industry Adoption** | ~95% of enterprises | ~5% | |
| **Learning Value** | High (production-grade) | Low (simplified) | |

**Decision**: Kubernetes required by spec; learning it has real-world applicability.

**K8s Resource Types Used**:
- **Deployment**: Frontend (2 replicas), Backend (2 replicas) - Stateless services
- **StatefulSet**: PostgreSQL (1 replica) - Requires ordered startup, stable identity
- **Service**: ClusterIP (internal), LoadBalancer (external frontend)
- **ConfigMap**: Non-sensitive config (DB host, API endpoints)
- **Secret**: Sensitive data (DB password, API keys) - base64 encoded

---

## 3. Data Model

### ER Diagram (Logical)

```
┌─────────────────┐           ┌─────────────────┐
│     movies      │           │     users       │
├─────────────────┤           ├─────────────────┤
│ id (PK)         │           │ id (PK)         │
│ title           │           │ username        │
│ release_date    │           │ email           │
│ genres (array)  │           │ created_at      │
│ vote_average    │           └─────────────────┘
│ overview        │                    △
│ poster_url      │                    │
│ budget          │                    │ 1
│ revenue         │                    │
│ created_at      │                    │
└─────────────────┘                    │
         △                              │
         │                              │
         │ N                            │
         │                              │
         └──────────┬───────────────────┘
                    │
                ┌───┴───────┐
                │ favorites │
                ├───────────┤
                │ id (PK)   │
                │ user_id (FK)
                │ movie_id (FK)
                │ created_at│
                └───────────┘
```

### Schema Normalization

**First Normal Form (1NF)**: All attributes atomic
- ❌ NOT: `movies.directors VARCHAR = "Spielberg; Kubrick"`
- ✅ YES: `genres TEXT ARRAY = ['Action', 'Drama']` (array storage)

**Second Normal Form (2NF)**: Non-key attributes fully depend on primary key
- ✅ `movies.title` depends only on `movies.id`
- ✅ `favorites` doesn't store duplicate movie data; uses foreign key

**Third Normal Form (3NF)**: No transitive dependencies
- ✅ `movies.director_id` doesn't exist (would create transitive dependency)
- ✅ Director info could be added later without redesign

**Justification**: Normalized schema reduces data duplication; updates to movie details propagate everywhere automatically.

---

## 4. API Design

### REST Principles Applied

| Principle | Implementation |
|-----------|---|
| **Stateless** | Each request contains all needed info; server doesn't store client state |
| **Resource-Based** | `/api/movies/` (resource), not `/api/getMovies()` (action) |
| **Standard Methods** | GET (read), POST (create), DELETE (remove); no PATCH for scope |
| **HTTP Status Codes** | 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error) |
| **JSON Content-Type** | `Content-Type: application/json` for all requests/responses |

### Endpoint Reference

```
GET    /api/health/
       Response: {"status": "ok"}
       Purpose: Kubernetes liveness probe

GET    /api/movies/
       Query Params: ?page=1&limit=20&search=inception
       Response: {"count": 5000, "next": "...", "results": [...]}
       Cached: 1 hour in Redis
       Purpose: Browse paginated movie catalog

GET    /api/movies/{id}/
       Path: /api/movies/550/
       Response: {"id": 550, "title": "Fight Club", ...}
       Cached: 24 hours in Redis
       Purpose: Movie detail page

POST   /api/favorites/
       Body: {"movie_id": 550}
       Response: {"id": 1, "movie_id": 550, "user_id": 1, "created_at": "..."}
       Auth: Token required (session cookie)
       Purpose: Add movie to favorites

DELETE /api/favorites/{id}/
       Response: 204 No Content
       Auth: Token required
       Purpose: Remove from favorites

GET    /api/favorites/
       Response: [{"id": 1, "movie_id": 550, ...}, ...]
       Auth: Token required
       Purpose: List user's favorite movies
```

---

## 5. Caching Strategy

### Cache Invalidation Patterns

**Time-Based Expiration (TTL)**:
- Most cache entries have `EXPIRE` commands
- Simple, no coordination needed
- Trade-off: Slight staleness (acceptable for movie catalog)

```python
# Backend code example
cache.set(f"movie:{id}", serialize(movie), timeout=86400)  # 24 hours
```

**Event-Based Invalidation**:
- When admin imports new CSV: `cache.clear()` or pattern delete
- When user adds favorite: invalidate user's favorites list

```python
# On successful import
cache.delete_pattern("movies:page:*")
cache.delete_pattern("search:*")
```

### TTL Values

| Cache Key | TTL | Rationale |
|-----------|-----|-----------|
| `movies:page:{n}` | 3600s (1h) | Popular queries; frequent access |
| `movie:{id}` | 86400s (24h) | Detail rarely changes; good miss cost |
| `search:{query}` | 1800s (30m) | Search results can be stale; query patterns vary |
| `favorites:{user_id}` | 3600s (1h) | User can refresh manually if needed |

---

## 6. Security Considerations

### Authentication & Authorization

**Current Scope (Simple)**:
- ✅ Session-based identification (not full OAuth)
- ✅ GET endpoints (movies, search) public
- ✅ POST/DELETE (favorites) require session token
- ✅ Django middleware: CSRF token validation

**Future (Out of Scope)**:
- ❌ User signup/login page
- ❌ JWT with refresh tokens
- ❌ Role-based access (admin vs. user)

### Data Protection

| Layer | Mechanism |
|-------|-----------|
| **Transport** | HTTPS (enforced in production K8s manifests; dev uses HTTP) |
| **Database** | PostgreSQL user password (strong, in Secrets) |
| **Secrets** | K8s Secrets (base64 encoded; encrypted at rest if configured) |
| **API** | Environment variables; no hardcoded keys |

### SQL Injection Prevention

```python
# ❌ VULNERABLE
query = f"SELECT * FROM movies WHERE title = '{user_input}'"

# ✅ SAFE (Django ORM)
movies = Movie.objects.filter(title__icontains=user_input)
```

---

## 7. Performance Considerations

### Database Indexing

```python
# Important indexes automatically created by Django:
class Movie(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    # Index on title: O(log n) search instead of O(n) table scan
```

### Query Optimization

```python
# ❌ N+1 Query Problem (5000 queries)
for movie in Movie.objects.all():
    print(movie.genres)  # Separate query for each movie

# ✅ OPTIMIZED (2 queries)
movies = Movie.objects.prefetch_related('genres')  # Batch fetch
for movie in movies:
    print(movie.genres)  # No additional queries
```

### Caching ROI

**Example: Paginated Movie List**
- Database query cost: ~100ms (sort, paginate)
- Redis get cost: ~1ms
- **ROI**: 100x faster for cache hits; justified for 1-hour TTL

---

## 8. Deployment Architecture

### Local Development (docker-compose)

```
┌─────────────────────────────────────────┐
│     Docker Compose (Host Network)       │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐│
│  │Front │  │Back  │  │  DB  │  │Redis ││
│  │:3000 │  │:8000 │  │:5432 │  │:6379 ││
│  │      │──│      │──│      │  │      ││
│  └──────┘  └──────┘  └──────┘  └──────┘│
│                                          │
└─────────────────────────────────────────┘
```

### Production (Kubernetes)

```
┌──────────────────────────────────────────┐
│       Kubernetes Cluster (Docker Desktop) │
│                                            │
│  Namespace: default                       │
│  ┌──────────────────────────────────────┐│
│  │  Deployment: frontend (replicas: 2) ││
│  │  - Pod 1: frontend                   ││
│  │  - Pod 2: frontend                   ││
│  └──────────────────────────────────────┘│
│  │  Service: frontend-service (LoadBalancer)
│  │  ↓ (Route traffic to frontend pods)   │
│  │                                        │
│  ┌──────────────────────────────────────┐│
│  │  Deployment: backend (replicas: 2)  ││
│  │  - Pod 1: backend                    ││
│  │  - Pod 2: backend                    ││
│  └──────────────────────────────────────┘│
│  │  Service: backend-service (ClusterIP) │
│  │  ↓ (Internal DNS: backend-service)    │
│  │                                        │
│  ┌──────────────────────────────────────┐│
│  │  StatefulSet: db (replicas: 1)      ││
│  │  - Pod: postgres-0                   ││
│  │  PersistentVolumeClaim: pg-data (10Gi)
│  └──────────────────────────────────────┘│
│  │  Service: db-service (ClusterIP)      │
│  │                                        │
│  ┌──────────────────────────────────────┐│
│  │  Deployment: redis (replicas: 1)    ││
│  │  - Pod: redis-0                      ││
│  └──────────────────────────────────────┘│
│  │  Service: redis-service (ClusterIP)   │
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

## 9. Scaling Considerations

### Horizontal Scaling (Add Replicas)

**Current**: 2 frontend, 2 backend replicas

If throughput increases (e.g., 1M requests/day):
- ✅ Add frontend replicas (stateless, fast)
- ✅ Add backend replicas (stateless API)
- ⚠️ Database becomes bottleneck → Requires read replicas, connection pooling

**Not Scaled**:
- PostgreSQL: 1 primary (single point of write)
- Redis: 1 instance

### Vertical Scaling (Increase Resources)

```yaml
# K8s resource limits per pod
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## 10. Monitoring & Observability (Future)

Not in scope, but recommended for production:

- **Logs**: Centralized logging (ELK stack, Datadog)
- **Metrics**: Prometheus (latency, cache hit rate, QPS)
- **Tracing**: Jaeger (request flow across services)
- **Alerts**: PagerDuty (critical errors)

---

## 11. Summary of Architectural Decisions

| Decision | Choice | Why | Trade-off |
|----------|--------|-----|-----------|
| API Framework | Django DRF | ORM + validation | Heavier than Flask |
| Frontend | React + Vite | Ecosystem + speed | Facebook ecosystem dependency |
| Database | PostgreSQL | ACID + FTS | More complex than SQLite |
| Cache | Redis | Pub/Sub ready | More complex than Memcached |
| Deployment | Kubernetes | Industry standard | Steeper learning curve |
| Data Source | Kaggle CSV | Deterministic | No real-time updates |

**Overall Philosophy**: Balance **learning value** (justifies Kubernetes, DRF, PostgreSQL) with **practical delivery** (3-container simplicity, no Elasticsearch, no user auth).

---

## Document Evolution

- **v1.0** (April 11): Initial architecture definitions
- (More versions added as project progresses)
