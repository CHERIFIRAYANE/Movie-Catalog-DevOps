# Setup Guide

## Prerequisites

### System Requirements

- **OS**: Windows, macOS, or Linux
- **Docker**: Version 20.10+ with Docker Compose
- **Python**: 3.11+ (for local backend development)
- **Node.js**: 20+ (for local frontend development)
- **Kubernetes**: Docker Desktop Kubernetes enabled (built-in)
- **Git**: For version control

### Verify Installation

```bash
# Check Docker
docker --version
docker-compose --version

# Check Kubernetes
kubectl version --client

# Check Python (optional for local dev)
python --version

# Check Node (optional for local dev)
node --version
npm --version
```

---

## 1. Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/your-username/movie-catalog.git
cd movie-catalog

# Verify structure
ls -la
# Should show: backend/, frontend/, k8s/, docs/, docker-compose.yml, README.md, etc.
```

---

## 2. Configure Environment

### Create `.env` File

```bash
# Copy from example
cp .env.example .env

# Edit .env with your values (if needed)
# For local dev, defaults are usually fine
cat .env
```

### Default Values (for local dev)

```
DATABASE_NAME=movie_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
REDIS_URL=redis://redis:6379/0
```

---

## 3. Start Services (Docker Compose)

### Option A: Start All Services

```bash
# Build images and start containers
docker-compose up --build

# Wait for output:
# - backend: "Quit the server with CONTROL-C"
# - db: "ready to accept connections"
# - redis: "Ready to accept connections"
# - frontend: "ready in ### ms"
```

### Option B: Start in Background

```bash
# Start services in background (-d = detach)
docker-compose up -d --build

# Check status
docker-compose ps
# Expected:
# NAME              STATUS
# movie_backend     Up (healthy)
# movie_db          Up (healthy)
# movie_redis       Up
# movie_frontend    Up
```

### Verify All Services Running

```bash
# Check health individual services
docker-compose health

# Check logs
docker-compose logs backend    # Django logs
docker-compose logs db         # PostgreSQL logs
docker-compose logs redis      # Redis logs
docker-compose logs frontend   # React logs
```

---

## 4. Initialize Database

### Run Migrations

```bash
# First time setup: apply Django migrations
docker-compose exec backend python manage.py migrate

# Output should show:
# Running migrations:
#   Operations to perform:
#   No migrations to apply.
```

### Import Kaggle Dataset

```bash
# Download Kaggle movies CSV first
# (See DATA_IMPORT.md for detailed instructions)

# Import movies into database
docker-compose exec backend python manage.py import_movies

# Wait for:
# "Successfully imported X movies from CSV"

# Verify import
docker-compose exec backend python manage.py shell
# >>> from movies.models import Movie
# >>> Movie.objects.count()
# 5000
# >>> exit()
```

---

## 5. Access Applications

### Frontend (React)

- **URL**: http://localhost:3000
- **Expected**: Movie catalog grid loads
- **Note**: Frontend connects to backend at http://backend:8000/api

### Backend API

- **URL**: http://localhost:8000/api/
- **Test**: http://localhost:8000/api/movies/
- **Response**: JSON list of paginated movies

### Django Admin Panel

- **URL**: http://localhost:8000/admin/
- **Username**: `admin`
- **Password**: `admin123`
- **Purpose**: Manage movies, users via web UI

### Postgres Database

```bash
# Connect to database directly
docker-compose exec db psql -U postgres -d movie_db

# List tables
\dt

# Query movies count
SELECT COUNT(*) FROM movies_movie;

# Exit
\q
```

### Redis Cache

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check cached keys
KEYS *

# Get cache size
DBSIZE

# Exit
EXIT
```

---

## 6. Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Last 50 lines
docker-compose logs --tail 50 backend
```

### Execute Commands in Container

```bash
# Backend shell
docker-compose exec backend bash
# Then can run: python manage.py, pip list, etc.

# Frontend shell
docker-compose exec frontend bash
# Then can run: npm, node, etc.

# Database shell
docker-compose exec db psql -U postgres -d movie_db

# Python Django shell
docker-compose exec backend python manage.py shell
```

### Rebuild Services

```bash
# Rebuild images (if Dockerfile changed)
docker-compose build --no-cache

# Then restart
docker-compose up
```

### Stop Services

```bash
# Stop but keep volumes (data persists)
docker-compose stop

# Stop and remove containers (data in volumes persists)
docker-compose down

# Stop and remove everything including volumes (⚠️ data lost)
docker-compose down -v
```

---

## 7. Deploy to Kubernetes

### Enable Kubernetes

**Docker Desktop**:

1. Click Docker icon → Preferences/Settings
2. Go to "Kubernetes" tab
3. Check "Enable Kubernetes"
4. Wait 2-3 minutes for startup

### Verify Kubernetes

```bash
# Check connection
kubectl cluster-info

# Expected:
# Kubernetes master is running at https://...
# CoreDNS is running at https://...

# Check nodes
kubectl get nodes
```

### Deploy Application

```bash
# Apply all K8s manifests
kubectl apply -f k8s/

# Check deployments
kubectl get deployments
# Expected: backend, frontend with READY 2/2

# Check pods
kubectl get pods
# Expected: 2 backend pods, 2 frontend pods, 1 db pod, 1 redis pod

# Check services
kubectl get svc
```

### Access Application (K8s)

```bash
# Port-forward frontend service
kubectl port-forward svc/frontend-service 8080:80

# In browser: http://localhost:8080

# Keep terminal open. To stop, press CTRL+C
```

### View Logs (K8s)

```bash
# Recent logs from backend pod
kubectl logs deployment/backend-deployment --tail 50

# Follow logs in real-time
kubectl logs -f deployment/backend-deployment

# Logs from specific pod
kubectl logs backend-deployment-abc123-xyz
```

### Scale Replicas (K8s)

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend-deployment --replicas=3

# Check status
kubectl get pods
```

### Cleanup Kubernetes

```bash
# Delete all resources
kubectl delete -f k8s/

# Verify deletion
kubectl get pods
# Expected: No resources found
```

---

## 8. Local Backend Development

### Without Docker (Optional)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000

# Access at http://localhost:8000
```

---

## 9. Local Frontend Development

### Without Docker (Optional)

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

---

## 10. Troubleshooting

### Docker Issues

**Port Already in Use**

```bash
# Find process on port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "8000:8000" to "8001:8000"
```

**Database Connection Error**

```bash
# Check database is healthy
docker-compose exec db pg_isready

# Check credentials in .env
cat .env | grep DATABASE

# Restart database
docker-compose restart db
```

**Frontend Can't Connect to Backend**

```bash
# Check backend is running
curl http://localhost:8000/api/health/

# Check frontend environment
docker-compose exec frontend cat /app/.env

# Ensure VITE_API_URL is correct
# Should be: http://backend:8000/api (inside container)
# Or: http://localhost:8000/api (from localhost browser)
```

### Kubernetes Issues

**Pods Stuck in "ContainerCreating"**

```bash
# Describe pod for error details
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name>
```

**Service Not Accessible**

```bash
# Verify service exists
kubectl get svc

# Check service endpoints
kubectl get endpoints frontend-service

# Test DNS resolution inside pod
kubectl exec <pod-name> -- nslookup frontend-service
```

### Database Issues

**Tables Not Created**

```bash
# Check migrations
docker-compose exec backend python manage.py showmigrations

# Apply migrations manually
docker-compose exec backend python manage.py migrate
```

**Import Fails**

```bash
# Verify CSV file exists and is readable
docker-compose exec backend ls -la /app/

# Check import script for errors
docker-compose exec backend python manage.py shell
>>> from movies.management.commands.import_movies import Command
>>> cmd = Command()
>>> cmd.handle()
```

---

## 11. Testing

### Run Backend Tests

```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run specific app tests
docker-compose exec backend python manage.py test movies

# Run with verbose output
docker-compose exec backend python manage.py test -v 2
```

### Run Frontend Tests

```bash
# Run Jest tests
docker-compose exec frontend npm run test

# Run E2E tests (if implemented)
docker-compose exec frontend npm run test:e2e
```

### API Endpoint Testing

```bash
# Health check
curl http://localhost:8000/api/health/

# List movies
curl http://localhost:8000/api/movies/

# Search movies
curl "http://localhost:8000/api/movies/?search=inception"

# Get movie detail
curl http://localhost:8000/api/movies/550/
```

---

## 12. Performance Monitoring

### Check Container Resource Usage

```bash
# Real-time CPU/memory usage
docker stats

# Example output:
# CONTAINER       CPU %     MEM USAGE / LIMIT
# movie_backend   2.5%      128 MiB / 512 MiB
# movie_frontend  1.2%      156 MiB / 512 MiB
# movie_db        1.8%      256 MiB / 1 GiB
# movie_redis     0.3%      32 MiB / 256 MiB
```

### Check API Response Times

```bash
# Measure request latency
time curl http://localhost:8000/api/movies/

# Time it a few times to check caching effects
# First request: slow (no cache)
# Second request: fast (cached in Redis)
```

---

## 13. CI/CD Setup (GitHub Actions)

See `.github/workflows/ci-cd.yml` for:

- Automated testing on push
- Docker image building
- Kubernetes deployment

---

## Next Steps

1. ✅ Verify all services running: `docker-compose ps`
2. ✅ Check API health: `curl http://localhost:8000/api/health/`
3. ✅ Open frontend: http://localhost:3000
4. ✅ Browse documentation: [ARCHITECTURE.md](ARCHITECTURE.md)
5. ✅ Read API docs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## Support

For issues or questions:

1. Check [Troubleshooting](#10-troubleshooting) section
2. Review logs: `docker-compose logs`
3. Read project docs in `/docs/`

**Last Updated**: April 11, 2026
