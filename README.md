# Movie Catalog Web Application

A containerized web application for browsing, searching, and saving favorite movies. Built with Django REST Framework, React, PostgreSQL, and Redis.

## 🎯 Project Overview

This is a semester project demonstrating professional web application development:

- **Architecture**: Microservices with containerized components
- **Frontend**: React single-page application
- **Backend**: RESTful API with Django
- **Database**: PostgreSQL with Redis caching
- **Deployment**: Kubernetes orchestration

## 📋 Tech Stack

| Component            | Technology            | Version    |
| -------------------- | --------------------- | ---------- |
| **Backend**          | Django REST Framework | 3.14+      |
| **Frontend**         | React + Vite          | 18.x / 5.x |
| **Database**         | PostgreSQL            | 15         |
| **Cache**            | Redis                 | 7          |
| **Containerization** | Docker                | latest     |
| **Orchestration**    | Kubernetes            | 1.26+      |
| **CI/CD**            | GitHub Actions        | -          |

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git
- (Optional) Python 3.11+, Node.js 20+ for local dev

### 1️⃣ Local Development (Docker Compose)

```bash
# Clone and navigate
git clone <your-repo-url>
cd movie-catalog

# Start all services
docker-compose up --build

# In another terminal, import the movie dataset (first time only)
docker-compose exec backend python manage.py import_movies

# Access the application
- Frontend:    http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
```

### 2️⃣ Kubernetes Deployment

```bash
# Deploy to Docker Desktop Kubernetes
kubectl apply -f k8s/

# Forward frontend to localhost
kubectl port-forward svc/frontend-service 8080:80

# Access at http://localhost:8080
```

### 3️⃣ Stop Services

```bash
# Docker Compose
docker-compose down

# Kubernetes
kubectl delete -f k8s/
```

## 📁 Project Structure

```
movie-catalog/
├── backend/                    # Django REST API
│   ├── config/                 # Django configuration
│   ├── movies/                 # Movies app (models, views, serializers)
│   ├── management/commands/    # Custom Django commands
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container image
│
├── frontend/                   # React Vite app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json           # Node dependencies
│   ├── vite.config.js
│   └── Dockerfile             # Frontend container image
│
├── k8s/                        # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── db-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── services.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # Design decisions & justifications
│   ├── API_DOCUMENTATION.md   # API endpoint reference
│   ├── SETUP.md               # Detailed setup guide
│   └── DATA_IMPORT.md         # Dataset import instructions
│
├── docker-compose.yml         # Local development orchestration
├── .gitignore
├── .env.example               # Environment template
└── README.md                  # This file
```

## ✨ Features

- ✅ **Browse Catalog**: 5,000+ movies from TMDB dataset
- ✅ **Search**: Full-text search by title and overview
- ✅ **Pagination**: 20 movies per page, navigate results efficiently
- ✅ **Favorites**: Save and manage favorite movies (session-based)
- ✅ **Caching**: Redis caching for performance optimization
- ✅ **Containerization**: Docker images for all services
- ✅ **Orchestration**: Kubernetes manifests for production-ready deployment
- ✅ **CI/CD**: GitHub Actions automated build & deploy pipeline
- ✅ **Documentation**: Comprehensive technical documentation

## 📚 Documentation

- **[Architecture & Decisions](docs/ARCHITECTURE.md)** - Why each technology choice?
- **[API Endpoints](docs/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Setup Guide](docs/SETUP.md)** - Detailed setup and troubleshooting
- **[Data Import](docs/DATA_IMPORT.md)** - How the Kaggle dataset is loaded

## 🔧 Development Workflow

### Backend Development

```bash
# Shell into backend container
docker-compose exec backend bash

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Access Django shell
python manage.py shell

# Run tests
python manage.py test
```

### Frontend Development

```bash
# Shell into frontend container
docker-compose exec frontend bash

# Install dependencies
npm install

# Hot reload development
npm run dev
```

## 📊 Data Source

- **Source**: Kaggle TMDB Movies Dataset (~5,000 movies)
- **Fields**: Title, Release Date, Genres, Rating, Overview, Poster URL
- **Import Method**: CSV import into PostgreSQL via management command
- **Why**: Deterministic, offline data source ideal for testing & demo

## 🏗️ Architecture Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                    (http://localhost:3000)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ (CORS-enabled API calls)
┌──────────────────────────▼──────────────────────────────────┐
│                 Backend (Django REST API)                    │
│                   (http://localhost:8000)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Endpoints (Pagination, Search, Favorites)       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼───┐  ┌───────▼────┐   ┌────▼────┐
       │  DB    │  │   Redis    │   │  Cache  │
       │(PgSQL) │  │  (Movies)  │   │         │
       └────────┘  └────────────┘   └─────────┘
```

## 📅 Timeline

- **Started**: April 11, 2026
- **Deadline**: May 17, 2026
- **Planned Duration**: 25-30 days
- **Buffer**: 7-12 days for testing & refinement

## 🧪 Testing

```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests (when implemented)
docker-compose exec frontend npm run test
```

## 🐛 Troubleshooting

### Services won't start?

```bash
# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild images
docker-compose build --no-cache
```

### Database connection error?

```bash
# Ensure DB is healthy
docker-compose exec db psql -U postgres -c "SELECT 1"

# Run migrations
docker-compose exec backend python manage.py migrate
```

### Port already in use?

```bash
# Change ports in docker-compose.yml or kill existing process
# Then restart: docker-compose up
```

## 📝 License

Educational project - Use for learning purposes

## 👤 Author

Solo implementation - April 2026

---

**For questions or issues, refer to [docs/SETUP.md](docs/SETUP.md) or the detailed documentation.**
