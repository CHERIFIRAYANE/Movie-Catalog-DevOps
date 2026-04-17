#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$REPO_ROOT/.run-state/macos"
mkdir -p "$STATE_DIR"

cd "$REPO_ROOT"

wait_for_job() {
  local job_name="$1"
  local timeout_sec="$2"
  local elapsed=0

  echo "Waiting for job ${job_name} (timeout ${timeout_sec}s)..."

  while true; do
    local succeeded failed
    succeeded="$(kubectl get job "$job_name" -n movie-catalog -o jsonpath='{.status.succeeded}' 2>/dev/null || true)"
    failed="$(kubectl get job "$job_name" -n movie-catalog -o jsonpath='{.status.failed}' 2>/dev/null || true)"

    if [[ "$succeeded" == "1" ]]; then
      echo "[OK] ${job_name} completed in ${elapsed}s."
      return 0
    fi

    if (( elapsed >= timeout_sec )); then
      echo "[TIMEOUT] ${job_name} did not complete after ${timeout_sec}s."
      return 1
    fi

    if [[ -z "$failed" ]]; then
      failed="0"
    fi

    echo "  ...${job_name} still running (elapsed ${elapsed}s, failed attempts ${failed})."
    sleep 5
    elapsed=$((elapsed + 5))
  done
}

echo "[1/8] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found in PATH"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "ERROR: kubectl not found in PATH"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl not found in PATH"; exit 1; }

kubectl cluster-info >/dev/null 2>&1 || {
  echo "ERROR: Kubernetes cluster not reachable. Start your local Kubernetes cluster first."
  exit 1
}

echo "[2/8] Ensuring ingress-nginx is installed..."
if ! kubectl get ns ingress-nginx >/dev/null 2>&1; then
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/cloud/deploy.yaml
fi

kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx --timeout=300s

echo "[3/8] Building backend image..."
docker build -f backend/Dockerfile -t projetconteneurisationweb-backend:latest backend

echo "[4/8] Building frontend image..."
docker build -f frontend/Dockerfile -t projetconteneurisationweb-frontend:prod frontend

echo "[5/8] Building dataset seed image..."
docker build -f k8s/bootstrap/Dockerfile -t projetconteneurisationweb-dataset:latest .

echo "[6/8] Applying Kubernetes manifests..."
if kubectl get ns movie-catalog >/dev/null 2>&1; then
  kubectl delete job backend-migrate movies-bootstrap -n movie-catalog --ignore-not-found=true >/dev/null 2>&1 || true
fi
kubectl apply -k k8s/overlays/local

echo "[7/8] Waiting for workloads..."
kubectl rollout status statefulset/postgres -n movie-catalog --timeout=300s
kubectl rollout status statefulset/elasticsearch -n movie-catalog --timeout=420s
kubectl rollout status deployment/redis -n movie-catalog --timeout=300s
kubectl rollout status deployment/backend -n movie-catalog --timeout=300s
kubectl rollout status deployment/frontend -n movie-catalog --timeout=300s

echo "Workloads are ready. Waiting for post-deploy jobs (can take 1-5 minutes)..."

if ! wait_for_job backend-migrate 60; then
  echo "WARNING: backend-migrate job is not in Complete state - continuing."
fi

if ! wait_for_job movies-bootstrap 120; then
  echo "WARNING: movies-bootstrap job is not in Complete state. Retrying once after workloads are ready..."
  kubectl delete job/movies-bootstrap -n movie-catalog --ignore-not-found=true >/dev/null 2>&1 || true
  kubectl apply -k k8s/overlays/local >/dev/null

  if ! wait_for_job movies-bootstrap 300; then
    echo "ERROR: movies-bootstrap job failed again. Check: kubectl logs -n movie-catalog job/movies-bootstrap"
    exit 1
  fi
fi

echo "[8/8] Starting local access tunnels..."
nohup kubectl port-forward -n movie-catalog svc/frontend 18080:80 >"$STATE_DIR/frontend-portforward.log" 2>&1 &
echo $! >"$STATE_DIR/frontend-portforward.pid"

nohup kubectl port-forward -n movie-catalog svc/backend 8000:8000 >"$STATE_DIR/backend-portforward.log" 2>&1 &
echo $! >"$STATE_DIR/backend-portforward.pid"

sleep 5

echo
echo "Project is up."
echo "Frontend: http://localhost:18080"
echo "Backend health: http://localhost:8000/api/health/"
echo
echo "Run scripts/macos/validate-project.sh for a full health check."
echo "Run scripts/macos/stop-project.sh to stop and clean resources."
