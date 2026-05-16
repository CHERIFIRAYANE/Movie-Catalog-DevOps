@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo [1/8] Checking prerequisites...
where docker >nul 2>nul || (echo ERROR: docker not found in PATH & exit /b 1)
where kubectl >nul 2>nul || (echo ERROR: kubectl not found in PATH & exit /b 1)

kubectl cluster-info >nul 2>nul || (echo ERROR: Kubernetes cluster not reachable. Enable Docker Desktop Kubernetes first. & exit /b 1)

echo [2/8] Ensuring ingress-nginx is installed...
kubectl get ns ingress-nginx >nul 2>nul
if errorlevel 1 (
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/cloud/deploy.yaml || exit /b 1
)

kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx --timeout=300s || exit /b 1

echo [3/8] Building backend image...
docker build -f backend\Dockerfile -t projetconteneurisationweb-backend:latest backend || exit /b 1

echo [4/8] Building frontend image...
docker build -f frontend\Dockerfile -t projetconteneurisationweb-frontend:prod frontend || exit /b 1

echo [5/8] Building dataset seed image...
docker build -f k8s\bootstrap\Dockerfile -t projetconteneurisationweb-dataset:latest . || exit /b 1

echo [6/8] Applying Kubernetes manifests...
kubectl get ns movie-catalog >nul 2>nul
if not errorlevel 1 (
  kubectl delete job backend-migrate movies-bootstrap -n movie-catalog --ignore-not-found=true >nul 2>nul
)
kubectl apply -k k8s/overlays/local || exit /b 1

echo [6.1/8] Restarting app deployments to load latest local images...
kubectl rollout restart deployment/backend -n movie-catalog || exit /b 1
kubectl rollout restart deployment/frontend -n movie-catalog || exit /b 1

echo [7/8] Waiting for workloads...
kubectl rollout status statefulset/postgres -n movie-catalog --timeout=300s || exit /b 1
kubectl rollout status statefulset/elasticsearch -n movie-catalog --timeout=420s || exit /b 1
kubectl rollout status deployment/redis -n movie-catalog --timeout=300s || exit /b 1
kubectl rollout status deployment/backend -n movie-catalog --timeout=300s || exit /b 1
kubectl rollout status deployment/frontend -n movie-catalog --timeout=300s || exit /b 1

echo Workloads are ready. Waiting for post-deploy jobs (can take 1-5 minutes)...

call :wait_for_job backend-migrate 60
if errorlevel 1 (
  echo WARNING: backend-migrate job is not in Complete state - continuing.
)

call :wait_for_job movies-bootstrap 120
if errorlevel 1 (
  echo WARNING: movies-bootstrap job is not in Complete state. Retrying once after workloads are ready...
  kubectl delete job/movies-bootstrap -n movie-catalog --ignore-not-found=true >nul 2>nul
  kubectl apply -k k8s/overlays/local >nul 2>nul || exit /b 1
  call :wait_for_job movies-bootstrap 300
  if errorlevel 1 (
    echo ERROR: movies-bootstrap job failed again. Check: kubectl logs -n movie-catalog job/movies-bootstrap
    exit /b 1
  )
)

echo [8/8] Starting local access tunnels...
start "movie-frontend-portforward" cmd /k "kubectl port-forward -n movie-catalog svc/frontend 18080:80"
start "movie-backend-portforward" cmd /k "kubectl port-forward -n movie-catalog svc/backend 8000:8000"

timeout /t 5 >nul

echo.
echo Project is up.
echo Frontend: http://localhost:18080
echo Backend health: http://localhost:8000/api/health/
echo.
echo Run validate-project.bat for a full health check.
echo Run stop-project.bat to stop and clean resources.

endlocal
exit /b 0

:wait_for_job
set "JOB_NAME=%~1"
set /a JOB_TIMEOUT=%~2
set /a ELAPSED=0

echo Waiting for job %JOB_NAME% (timeout %JOB_TIMEOUT%s)...

:wait_for_job_loop
set "SUCCEEDED="
set "FAILED="
for /f "delims=" %%S in ('kubectl get job %JOB_NAME% -n movie-catalog -o jsonpath^="{.status.succeeded}" 2^>nul') do set "SUCCEEDED=%%S"
for /f "delims=" %%F in ('kubectl get job %JOB_NAME% -n movie-catalog -o jsonpath^="{.status.failed}" 2^>nul') do set "FAILED=%%F"

if "!SUCCEEDED!"=="1" (
  echo [OK] %JOB_NAME% completed in !ELAPSED!s.
  exit /b 0
)

if !ELAPSED! GEQ !JOB_TIMEOUT! (
  echo [TIMEOUT] %JOB_NAME% did not complete after !JOB_TIMEOUT!s.
  exit /b 1
)

if "!FAILED!"=="" set "FAILED=0"
echo   ...%JOB_NAME% still running (elapsed !ELAPSED!s, failed attempts !FAILED!).
timeout /t 5 /nobreak >nul
set /a ELAPSED+=5
goto :wait_for_job_loop
