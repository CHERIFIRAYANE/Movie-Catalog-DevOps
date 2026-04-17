# Movie Catalog Web Application

Containerized movie catalog app with Django REST, React, PostgreSQL, Redis, and Kubernetes.

Application web de catalogue de films conteneurisee avec Django REST, React, PostgreSQL, Redis et Kubernetes.

## Demo

### Windows

```cmd
run-project.bat
validate-project.bat
```

Open:

- Frontend: http://localhost:18080
- Backend health: http://localhost:8000/api/health/

Stop:

```cmd
stop-project.bat
```

### Linux

```bash
./scripts/linux/run-project.sh
./scripts/linux/validate-project.sh
```

Stop:

```bash
./scripts/linux/stop-project.sh
```

### macOS

```bash
./scripts/macos/run-project.sh
./scripts/macos/validate-project.sh
```

Stop:

```bash
./scripts/macos/stop-project.sh
```

## 🚀 Evaluation Path / Parcours D Evaluation

Use launcher scripts above for grading and final demo.

Utiliser les scripts de lancement ci-dessus pour la correction et la demo finale.

Docker Compose is kept as an alternative for local development only.

Docker Compose reste une alternative pour le developpement local uniquement.

## 📋 Prerequisites / Prerequis

- Git
- Docker installed and running
- kubectl in PATH
- Local Kubernetes cluster running

Windows path:

- Docker Desktop with Kubernetes enabled

Linux/macOS path:

- Minikube recommended
- Run this in each shell before launcher scripts:

```bash
eval "$(minikube docker-env)"
```

Optional local dev path:

- Docker Compose

## 📋 Tech Stack

| Component        | Technology                | Version    |
| ---------------- | ------------------------- | ---------- |
| Backend          | Django REST Framework     | 3.14+      |
| Frontend         | React + Vite              | 18.x / 5.x |
| Database         | PostgreSQL                | 15         |
| Cache            | Redis                     | 7          |
| Containerization | Docker                    | latest     |
| Orchestration    | Kubernetes                | 1.26+      |
| CI/CD            | GitHub Actions (optional) | -          |

## ✨ Features / Fonctionnalites

- Browse 5,000+ movies from TMDB dataset
- Full-text search by title and overview
- Pagination (20 movies/page)
- Favorites management
- Redis cache integration
- Dockerized services and Kubernetes manifests
- CI/CD ready structure

## 🏗️ Architecture

```
Frontend (React)
     |
Backend (Django REST API)
   / \
PostgreSQL   Redis (cache/state)
```

## 🛠️ Alternative Local Development (Docker Compose)

```bash
docker-compose up --build
docker-compose exec backend python manage.py import_movies
```

Access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/

Stop:

```bash
docker-compose down
```

## 📚 Documentation

- [Architecture & Decisions](docs/ARCHITECTURE.md)
- [API Endpoints](docs/API_DOCUMENTATION.md)
- [Setup Guide](docs/SETUP.md)
- [Data Import](docs/DATA_IMPORT.md)

## 🧪 Quick Troubleshooting

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## 👤 Authors

Rayane CHERIFI and SEBA Abdelwahab

## 📝 License

Educational project for learning purposes.
