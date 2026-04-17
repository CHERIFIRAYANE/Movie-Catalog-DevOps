@echo off
setlocal

cd /d "%~dp0\.."

set HAS_ERROR=0

echo [1/5] Checking pod readiness...
kubectl get pods -n movie-catalog

echo.
echo [2/5] Checking ingress and services...
kubectl get ingress,svc -n movie-catalog

echo.
echo [3/5] Checking API health through backend tunnel...
curl -fsS http://localhost:8000/api/health/
if errorlevel 1 (
  echo ERROR: Backend tunnel is not reachable at http://localhost:8000.
  set HAS_ERROR=1
)

echo.
echo [4/5] Checking frontend root through frontend tunnel...
curl -fsS http://localhost:18080/ | findstr /R /I "<title>.*</title>"
if errorlevel 1 (
  echo ERROR: Frontend tunnel is not reachable at http://localhost:18080.
  set HAS_ERROR=1
)

echo.
echo [5/5] Checking movie count in DB...
kubectl exec -n movie-catalog deploy/backend -- python manage.py shell -c "from movies.models import Movie; print(Movie.objects.count())"
if errorlevel 1 (
  echo ERROR: Unable to query movie count from backend pod.
  set HAS_ERROR=1
)

echo.
if "%HAS_ERROR%"=="1" (
  echo Validation finished with errors.
  endlocal
  exit /b 1
)

echo Validation finished successfully.

endlocal
exit /b 0
