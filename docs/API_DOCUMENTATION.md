# API Documentation

## Base URL

**Development**: `http://localhost:8000/api`  
**Production**: `https://api.example.com/api` (when deployed)

## Response Format

All responses are JSON with consistent structure:

```json
// Success response
{
  "status": "success",
  "data": { /* endpoint-specific */ },
  "timestamp": "2026-04-11T12:34:56Z"
}

// Error response
{
  "status": "error",
  "error": {
    "code": "MOVIE_NOT_FOUND",
    "message": "Movie with ID 999 not found"
  },
  "timestamp": "2026-04-11T12:34:56Z"
}
```

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request succeeded | GET /api/movies/ |
| 201 | Created - Resource created | POST /api/favorites/ |
| 204 | No Content - Success, no body | DELETE /api/favorites/1/ |
| 400 | Bad Request - Invalid params | Missing required fields |
| 404 | Not Found - Resource doesn't exist | GET /api/movies/99999/ |
| 500 | Server Error - Internal error | Database connection failure |

---

## Endpoints

### 1. Health Check

**Endpoint**: `GET /api/health/`

**Purpose**: Kubernetes liveness probe (check if service is running)

**Authentication**: None

**Parameters**: None

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

**cURL Example**:
```bash
curl http://localhost:8000/api/health/
```

---

### 2. List Movies

**Endpoint**: `GET /api/movies/`

**Purpose**: Retrieve paginated list of all movies with optional search

**Authentication**: None (public read)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (starts at 1) |
| `limit` | integer | No | 20 | Results per page (1-100) |
| `search` | string | No | - | Search by title or overview (case-insensitive) |

**Response (200 OK)**:
```json
{
  "count": 5000,
  "next": "http://localhost:8000/api/movies/?page=2",
  "previous": null,
  "results": [
    {
      "id": 550,
      "title": "Fight Club",
      "release_date": "1999-10-15",
      "vote_average": 8.8,
      "overview": "An insomniac office worker...",
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "genres": ["Drama", "Thriller"],
      "budget": 63000000,
      "revenue": 100853753
    },
    ...
  ]
}
```

**cURL Examples**:

```bash
# Get first page (default 20 movies)
curl "http://localhost:8000/api/movies/"

# Get page 2
curl "http://localhost:8000/api/movies/?page=2"

# Search for "Inception"
curl "http://localhost:8000/api/movies/?search=inception"

# Search with pagination
curl "http://localhost:8000/api/movies/?search=action&page=1&limit=50"
```

**Caching**: Cached for **1 hour** in Redis

---

### 3. Get Movie Detail

**Endpoint**: `GET /api/movies/{id}/`

**Purpose**: Retrieve full details for a single movie

**Authentication**: None (public read)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Movie ID (primary key) |

**Response (200 OK)**:
```json
{
  "id": 550,
  "title": "Fight Club",
  "release_date": "1999-10-15",
  "vote_average": 8.8,
  "overview": "An insomniac office worker and a devil-may-care soap maker form an underground fight club...",
  "poster_url": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "genres": ["Drama", "Thriller"],
  "budget": 63000000,
  "revenue": 100853753,
  "created_at": "2026-04-11T10:30:00Z"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Not found",
  "detail": "Movie with ID 99999 does not exist"
}
```

**cURL Example**:
```bash
curl http://localhost:8000/api/movies/550/
```

**Caching**: Cached for **24 hours** in Redis

---

### 4. Add to Favorites

**Endpoint**: `POST /api/favorites/`

**Purpose**: Add a movie to the current user's favorite list

**Authentication**: Required (session token)

**Request Body**:
```json
{
  "movie_id": 550
}
```

**Validation**:
- `movie_id` must be an existing movie
- Duplicate favorites ignored (HTTP 409 Conflict or 201 if already exists)

**Response (201 Created)**:
```json
{
  "id": 42,
  "user_id": 1,
  "movie_id": 550,
  "movie_title": "Fight Club",
  "created_at": "2026-04-11T12:34:56Z"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Invalid request",
  "details": {
    "movie_id": ["This field is required."]
  }
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Movie not found",
  "detail": "Movie with ID 99999 does not exist"
}
```

**cURL Example**:
```bash
# Assuming user has session token: abc123xyz
curl -X POST http://localhost:8000/api/favorites/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=abc123xyz" \
  -d '{"movie_id": 550}'
```

**Cache Invalidation**: Clears user's favorite list cache on success

---

### 5. Remove from Favorites

**Endpoint**: `DELETE /api/favorites/{id}/`

**Purpose**: Remove a movie from user's favorites

**Authentication**: Required (session token)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Favorite record ID (not movie ID) |

**Response (204 No Content)**:
```
(Empty body, HTTP 204)
```

**Response (404 Not Found)**:
```json
{
  "error": "Not found",
  "detail": "Favorite with ID 42 not found"
}
```

**Response (403 Forbidden)** (If favorite belongs to different user):
```json
{
  "error": "Permission denied",
  "detail": "You can only delete your own favorites"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:8000/api/favorites/42/ \
  -H "Cookie: sessionid=abc123xyz"
```

**Cache Invalidation**: Clears user's favorite list cache on success

---

### 6. List User Favorites

**Endpoint**: `GET /api/favorites/`

**Purpose**: Retrieve all movies favorited by the current user

**Authentication**: Required (session token)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Results per page |

**Response (200 OK)**:
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 42,
      "movie_id": 550,
      "movie": {
        "id": 550,
        "title": "Fight Club",
        "poster_url": "https://...",
        "vote_average": 8.8
      },
      "created_at": "2026-04-11T12:34:56Z"
    },
    {
      "id": 41,
      "movie_id": 278,
      "movie": {
        "id": 278,
        "title": "The Shawshank Redemption",
        "poster_url": "https://...",
        "vote_average": 9.3
      },
      "created_at": "2026-04-11T11:20:00Z"
    }
  ]
}
```

**Response (401 Unauthorized)** (If not authenticated):
```json
{
  "error": "Authentication required",
  "detail": "You must be logged in to access this endpoint"
}
```

**cURL Example**:
```bash
curl http://localhost:8000/api/favorites/ \
  -H "Cookie: sessionid=abc123xyz"
```

**Caching**: Cached for **1 hour** in Redis per user

---

## Error Handling

### Common Error Scenarios

**Movie Not Found**
```
GET /api/movies/99999/
Response: 404 Not Found
```

**Invalid Search**
```
GET /api/movies/?search=<invalid>&page=abc
Response: 400 Bad Request
{
  "error": "Invalid query parameters",
  "details": {
    "page": ["Ensure this value is a valid integer."]
  }
}
```

**Unauthorized Access**
```
POST /api/favorites/
Response: 401 Unauthorized
(If session token missing or invalid)
```

---

## Rate Limiting (Future)

Not implemented in current scope, but recommended for production:
- Limit: 100 requests/minute per IP
- Header: `X-RateLimit-Remaining: 75`

---

## Pagination Examples

### Example 1: Browse First 20 Movies
```bash
curl "http://localhost:8000/api/movies/?page=1&limit=20"
```

### Example 2: Search + Paginate
```bash
curl "http://localhost:8000/api/movies/?search=inception&page=1&limit=10"
```

### Example 3: Follow "next" Link
```bash
# Get page 1
curl "http://localhost:8000/api/movies/?page=1"

# Response includes:
// "next": "http://localhost:8000/api/movies/?page=2"

# Follow link for page 2
curl "http://localhost:8000/api/movies/?page=2"
```

---

## Testing API Endpoints

### Using Postman/Insomnia

1. Create requests for each endpoint
2. Set environment variable: `base_url = http://localhost:8000/api`
3. Use `{{base_url}}/movies/` in request URLs

### Using cURL (CLI)

```bash
# 1. Test health check
curl http://localhost:8000/api/health/

# 2. List movies
curl "http://localhost:8000/api/movies/"

# 3. Get movie detail
curl http://localhost:8000/api/movies/550/

# 4. Search movies
curl "http://localhost:8000/api/movies/?search=inception"

# 5. Add to favorites
curl -X POST http://localhost:8000/api/favorites/ \
  -H "Content-Type: application/json" \
  -d '{"movie_id": 550}'

# 6. List favorites
curl http://localhost:8000/api/favorites/

# 7. Remove favorite
curl -X DELETE http://localhost:8000/api/favorites/1/
```

---

## API Evolution Log

- **v1.0** (April 11, 2026): Initial design with 6 core endpoints
- (Future versions documented here as API changes)
