#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

has_error=0

echo "[1/5] Checking pod readiness..."
kubectl get pods -n movie-catalog

echo
echo "[2/5] Checking ingress and services..."
kubectl get ingress,svc -n movie-catalog

echo
echo "[3/5] Checking API health through backend tunnel..."
if ! curl -fsS http://localhost:8000/api/health/; then
  echo "ERROR: Backend tunnel is not reachable at http://localhost:8000."
  has_error=1
fi

echo
echo "[4/5] Checking frontend root through frontend tunnel..."
frontend_html="$(curl -fsS http://localhost:18080/ 2>/dev/null || true)"
if [[ -z "$frontend_html" ]]; then
  echo "ERROR: Frontend tunnel is not reachable at http://localhost:18080."
  has_error=1
else
  title="$(printf '%s' "$frontend_html" | grep -Eio '<title>[^<]+</title>' | head -n1 || true)"
  if [[ -z "$title" ]]; then
    echo "ERROR: Frontend response did not contain a page title."
    has_error=1
  else
    echo "$title"
  fi
fi

echo
echo "[5/5] Checking movie count in DB..."
if ! kubectl exec -n movie-catalog deploy/backend -- python manage.py shell -c "from movies.models import Movie; print(Movie.objects.count())"; then
  echo "ERROR: Unable to query movie count from backend pod."
  has_error=1
fi

echo
if [[ "$has_error" -eq 1 ]]; then
  echo "Validation finished with errors."
  exit 1
fi

echo "Validation finished successfully."
