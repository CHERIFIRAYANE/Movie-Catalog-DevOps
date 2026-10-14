
# Movie Catalog Platform

A full-stack movie discovery application built with **React, Django REST Framework, PostgreSQL, Redis, and Elasticsearch**, containerized with Docker and deployed on Kubernetes.

This project combines full-stack application development with cloud-native deployment practices, infrastructure automation, application health monitoring, horizontal autoscaling, and CI/CD validation.

Application web de catalogue de films développée avec React et Django REST Framework, utilisant PostgreSQL, Redis et Elasticsearch, conteneurisée avec Docker et déployée sur Kubernetes.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Infrastructure and DevOps](#infrastructure-and-devops)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Windows](#windows)
  - [Linux](#linux)
  - [macOS](#macos)
  - [Alternative: Docker Compose](#alternative-docker-compose)
- [Validation and Health Checks](#validation-and-health-checks)
- [Autoscaling](#autoscaling)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Author](#author)
- [License](#license)

---

## Overview

Movie Catalog Platform is a containerized web application designed to demonstrate the integration of a modern web stack with Kubernetes-based deployment and operational practices.

The application provides movie browsing, advanced search, favorites management, authentication, and recommendations. Its infrastructure separates application workloads from persistent data services and supports automated deployment validation.

### Engineering Highlights

- Full-stack application with a React frontend and Django REST API.
- PostgreSQL for persistent relational data.
- Redis for application caching.
- Elasticsearch for full-text search and autocomplete.
- Docker images for frontend and backend services.
- Kubernetes deployments, services, ingress routing, and persistent workloads.
- Horizontal Pod Autoscaling for stateless application workloads.
- Health checks, resource requests and limits, and rolling-update strategies.
- Kubernetes network policies, service accounts, and RBAC configuration.
- Automated database backup scheduling.
- GitHub Actions workflows for testing, validation, and container builds.
- Platform-specific scripts for launching and validating the application.

## Key Features

### Application

- Browse a dataset containing more than 5,000 movies.
- Search movies by title and overview.
- Filter results by genre, release year, and rating.
- Autocomplete search suggestions.
- Paginated movie listings.
- Movie detail views with metadata and ratings.
- User registration, login, and JWT authentication.
- Email verification workflow.
- Add and remove favorite movies.
- Personalized recommendations based on favorite genres and movie ratings.
- Dark and light themes.

### Backend and Data

- RESTful API implemented with Django REST Framework.
- PostgreSQL-backed persistent storage.
- Redis-based caching with cache invalidation.
- Elasticsearch indexing and advanced search.
- Environment-driven application configuration.
- API health endpoint for database and cache connectivity checks.

### Infrastructure

- Dockerized frontend and backend.
- Docker Compose configuration for local development.
- Kubernetes manifests organized with Kustomize.
- Ingress routing for frontend and backend traffic.
- Persistent storage for database and search workloads.
- Startup, readiness, and liveness probes.
- Horizontal Pod Autoscaling for stateless workloads.
- Kubernetes network policies and service-account configuration.
- Scheduled PostgreSQL backup jobs.
- Automated deployment and validation scripts.

---

## Architecture

### Application Architecture

The application separates the user interface, REST API, persistence, caching, and search responsibilities.

```text
                         User / Browser
                               |
                               v
                      Kubernetes Ingress
                         NGINX Ingress
                               |
                    +----------+----------+
                    |                     |
                    v                     v
             Frontend Service       Backend Service
                    |                     |
                    v                     v
             React + Nginx         Django REST API
                                          |
                         +----------------+----------------+
                         |                |                |
                         v                v                v
                    PostgreSQL          Redis        Elasticsearch
                    Persistent          Cache         Search Index
                      Data
```

The frontend communicates with the backend through HTTP API requests. The backend uses PostgreSQL as the primary source of truth, Redis for caching, and Elasticsearch for advanced search and autocomplete.

### Kubernetes Architecture

The Kubernetes configuration separates stateless application workloads from stateful services.

| Component | Kubernetes Resource | Responsibility |
|---|---|---|
| Frontend | Deployment + Service | Serves the React application |
| Backend | Deployment + Service | Exposes the Django REST API |
| PostgreSQL | StatefulSet + Service | Persistent relational storage |
| Redis | Deployment + Service | Application caching |
| Elasticsearch | StatefulSet + Service | Search indexing and queries |
| Database migration | Job | Applies database migrations |
| Data bootstrap | Job | Imports and indexes movie data |
| Database backup | CronJob | Schedules PostgreSQL backups |
| Autoscaling | HorizontalPodAutoscaler | Scales stateless workloads |
| External routing | Ingress | Routes HTTP traffic |

The primary Kubernetes namespace is `movie-catalog`.

---

## Technology Stack

| Component | Technology | Role |
|---|---|---|
| Frontend | React 18, Vite 5 | User interface and frontend build |
| Backend | Django, Django REST Framework | REST API and application logic |
| Authentication | Simple JWT | Access and refresh tokens |
| Database | PostgreSQL 15 | Persistent relational storage |
| Cache | Redis 7 | Application caching |
| Search | Elasticsearch 8.11 | Full-text search and autocomplete |
| HTTP Client | Axios | Frontend API communication |
| Web Server | NGINX | Frontend serving and reverse proxy |
| Containerization | Docker | Reproducible application images |
| Local Development | Docker Compose | Multi-service local environment |
| Orchestration | Kubernetes | Deployment and workload management |
| Kubernetes Packaging | Kustomize | Manifest composition and overlays |
| CI/CD | GitHub Actions | Testing, validation, and image builds |
| Backend Runtime | Python 3.11 | Django application runtime |
| Frontend Runtime | Node.js 20 | Frontend build environment |

Exact dependency versions are maintained in the backend and frontend dependency files and the container image definitions.

---

## Infrastructure and DevOps

### Containerization

The frontend and backend have separate Dockerfiles.

The frontend uses a build stage to produce static assets and NGINX to serve the production application. The backend uses a multi-stage build to separate dependency compilation from its runtime image.

Docker Compose provides an alternative environment for local development.

### Kubernetes Deployment

The Kubernetes configuration includes:

- Separate frontend and backend Deployments.
- Services for internal application communication.
- Stateful workloads and persistent volume claims.
- Ingress routing for frontend and API traffic.
- Database migration and data-bootstrap Jobs.
- ConfigMaps for non-sensitive runtime configuration.
- Environment-specific Kustomize overlays.
- Resource requests and limits.
- Startup, readiness, and liveness probes.
- Rolling-update deployment strategies.
- PodDisruptionBudgets for frontend and backend availability.

### Reliability and Operations

Application health is exposed through:

```text
GET /api/health/
```

The backend health endpoint checks database and cache connectivity. Kubernetes probes use the health endpoint to help determine application readiness and health.

The frontend NGINX container also exposes:

```text
/health
```

The project includes validation scripts that check deployed resources, workload readiness, health endpoints, and autoscaler configuration.

### Security Configuration

The Kubernetes manifests include several security-oriented controls:

- Non-root application container execution.
- Dedicated service accounts.
- Disabled automatic service-account token mounting where configured.
- Role-based access control (RBAC).
- Network policies with default-deny rules and explicit traffic allowances.
- Environment-driven configuration for sensitive application settings.
- Secure-cookie and HTTPS-related settings controlled through configuration.

These controls are part of the deployment configuration. Their effective protection depends on the cluster configuration, runtime settings, and correct management of secrets.

### CI/CD

The GitHub Actions workflow is defined in:

```text
.github/workflows/ci-cd.yml
```

The documented workflow includes:

- Backend dependency installation and Django checks.
- Backend syntax compilation and automated tests.
- Frontend dependency installation, tests, and production build.
- Kubernetes manifest rendering and validation.
- Docker image builds for the frontend and backend.
- A manually triggered image-publishing workflow.

Image publishing requires the appropriate registry credentials and configuration.

---

## Getting Started

Choose the launch method that matches your operating system.

The launcher and validation scripts are intended for the Kubernetes deployment used for project evaluation.

### Prerequisites

- Git
- Docker installed and running
- `kubectl` available in your PATH
- A running local Kubernetes cluster
- NGINX Ingress Controller
- Metrics Server for Horizontal Pod Autoscaling checks

Additional requirements:

**Windows**
- Docker Desktop with Kubernetes enabled.

**Linux**
- Minikube is recommended.
- Docker and the required Kubernetes components must be configured.

**macOS**
- Minikube is recommended.
- Docker and the required Kubernetes components must be configured.

Ensure the cluster has sufficient CPU and memory for PostgreSQL, Redis, Elasticsearch, the frontend, and the backend.

### Windows

Launch the project:

```cmd
run-project.bat
```

Validate the deployment:

```cmd
validate-project.bat
```

Open the application:

- Frontend: http://localhost:18080
- Backend health: http://localhost:8000/api/health/

Stop the project:

```cmd
stop-project.bat
```

### Linux

For a Minikube-based setup, configure the Docker environment in each shell before running the launcher when required by the local image-build workflow:

```bash
eval "$(minikube docker-env)"
```

Launch the project:

```bash
./scripts/linux/run-project.sh
```

Validate the deployment:

```bash
./scripts/linux/validate-project.sh
```

Stop the project:

```bash
./scripts/linux/stop-project.sh
```

### macOS

For a Minikube-based setup, configure the Docker environment in each shell before running the launcher when required by the local image-build workflow:

```bash
eval "$(minikube docker-env)"
```

Launch the project:

```bash
./scripts/macos/run-project.sh
```

Validate the deployment:

```bash
./scripts/macos/validate-project.sh
```

Stop the project:

```bash
./scripts/macos/stop-project.sh
```

Check that the macOS scripts are present in the repository before using this section.

### Evaluation Path

Use the platform-specific launcher and validation scripts for the deployment demonstration and project evaluation.

Docker Compose is retained as an alternative for local development.

---

## Alternative: Docker Compose

Docker Compose can be used to start the application services locally without following the Kubernetes deployment path.

Start the services:

```bash
docker-compose up --build
```

Import the movie dataset:

```bash
docker-compose exec backend python manage.py import_movies
```

Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Backend health: http://localhost:8000/api/health/

Stop the services:

```bash
docker-compose down
```

The movie import command supports options such as `--csv` and `--clear`. Consult the data-import documentation before clearing or reimporting data.

---

## Validation and Health Checks

The project provides scripts for validating the Kubernetes deployment on supported platforms.

The documented validation workflow checks:

- Pod readiness.
- Kubernetes Ingress and Service resources.
- Horizontal Pod Autoscaler resources.
- Backend health endpoint.
- Frontend HTTP response.
- Imported movie data.
- Autoscaler configuration.

### Manual Checks

Check the application namespace:

```bash
kubectl get all -n movie-catalog
```

Check pod status:

```bash
kubectl get pods -n movie-catalog
```

Check services and ingress:

```bash
kubectl get services,ingress -n movie-catalog
```

Check recent application logs:

```bash
kubectl logs deployment/backend -n movie-catalog
kubectl logs deployment/frontend -n movie-catalog
```

Check the backend health endpoint:

```bash
curl http://localhost:8000/api/health/
```

Expected healthy response:

```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

The exact response depends on the running application and its dependencies.

---

## Autoscaling

Horizontal Pod Autoscalers are configured for the stateless frontend and backend workloads.

The documented configuration includes:

| Workload | Minimum Replicas | Maximum Replicas | Scaling Metrics |
|---|---:|---:|---|
| Backend | 2 | 5 | CPU and memory utilization |
| Frontend | 2 | 4 | CPU utilization |

The backend configuration targets 70% CPU and 80% memory utilization. The frontend configuration targets 75% CPU utilization.

Autoscaling requires Kubernetes resource metrics to be available through Metrics Server.

Inspect the autoscalers:

```bash
kubectl get hpa -n movie-catalog
```

Inspect backend scaling:

```bash
kubectl describe hpa backend-hpa -n movie-catalog
```

Inspect frontend scaling:

```bash
kubectl describe hpa frontend-hpa -n movie-catalog
```

Inspect resource usage when supported:

```bash
kubectl top pods -n movie-catalog
```

The existence of HPA resources does not by itself demonstrate that scaling has occurred. Validate scaling behavior in a running cluster under suitable resource conditions.

---

## Project Structure

```text
.
├── backend/
│   ├── config/
│   ├── movies/
│   ├── management/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── nginx.conf
├── k8s/
│   ├── base/
│   ├── overlays/
│   └── bootstrap/
├── scripts/
│   ├── linux/
│   └── macos/
├── docs/
│   ├── PROJECT_TECHNICAL_DETAILS.md
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── SETUP.md
│   └── DATA_IMPORT.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
└── README.md
```

The tree highlights the main application, infrastructure, automation, and documentation directories. Individual files may vary as the project evolves.

---

## Documentation

For a deeper understanding of the implementation, consult the following documents:

- [Technical Details](docs/PROJECT_TECHNICAL_DETAILS.md) — Runtime topology, configuration, services, deployment, and operational behavior.
- [Architecture and Decisions](docs/ARCHITECTURE.md) — Architecture overview and design decisions.
- [API Documentation](docs/API_DOCUMENTATION.md) — Available API endpoints and behavior.
- [Setup Guide](docs/SETUP.md) — Environment setup and execution instructions.
- [Data Import](docs/DATA_IMPORT.md) — Movie dataset import and indexing.

---

## Troubleshooting

### Check Service Logs

For Docker Compose:

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
docker-compose logs redis
docker-compose logs elasticsearch
```

For Kubernetes:

```bash
kubectl logs deployment/backend -n movie-catalog
kubectl logs deployment/frontend -n movie-catalog
kubectl get pods -n movie-catalog
kubectl get events -n movie-catalog --sort-by=.metadata.creationTimestamp
```

### Common Issues

**Pods remain pending**

Check cluster resources, pod events, and persistent volume availability.

**Backend health check fails**

Verify PostgreSQL and Redis connectivity, runtime environment variables, and backend logs.

**Search is unavailable**

Check Elasticsearch pod readiness, service connectivity, and whether the movie index has been created and populated.

**Autoscaling metrics are unavailable**

Verify that Metrics Server is installed and that the Kubernetes resource metrics API is responding.

**Frontend cannot reach the backend**

Check Ingress rules, service endpoints, NGINX configuration, and the frontend API base URL.

**Movie catalog is empty**

Check the database state and the status of the movie bootstrap Job. Consult the data-import documentation before running import commands manually.

---

## Future Improvements

Potential extensions to the project include:

- Prometheus and Grafana for metrics collection and visualization.
- Centralized log aggregation.
- Automated end-to-end tests covering the complete deployed application.
- Automated security and dependency scanning in CI.
- A managed Kubernetes deployment environment.
- More comprehensive backup restoration testing.
- Documented load testing and autoscaling experiments.
- A public demo environment with an automated deployment pipeline.

These are potential improvements, not claims about existing functionality.

---

## Author

**Rayane CHERIFI**

---

## License

Educational project intended for learning and demonstration purposes.

If you intend to distribute the project publicly, consider adding an explicit open-source license and reviewing the licensing terms of included datasets and third-party dependencies.
