#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$REPO_ROOT/.run-state/macos"

cd "$REPO_ROOT"

stop_port_forward() {
  local pid_file="$1"
  local pattern="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$pid_file"
  fi

  pkill -f "$pattern" >/dev/null 2>&1 || true
}

echo "Stopping port-forward processes..."
stop_port_forward "$STATE_DIR/frontend-portforward.pid" "kubectl port-forward -n movie-catalog svc/frontend 18080:80"
stop_port_forward "$STATE_DIR/backend-portforward.pid" "kubectl port-forward -n movie-catalog svc/backend 8000:8000"

if ! kubectl cluster-info >/dev/null 2>&1; then
  echo "Kubernetes cluster not reachable, skipped resource deletion."
  echo "Done."
  exit 0
fi

echo "Deleting Kubernetes resources..."
kubectl delete -k k8s/overlays/local --ignore-not-found=true

echo "Done."
