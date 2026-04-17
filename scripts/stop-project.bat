@echo off
setlocal

cd /d "%~dp0\.."

echo Stopping port-forward terminals...
taskkill /FI "WINDOWTITLE eq movie-frontend-portforward" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq movie-backend-portforward" /T /F >nul 2>nul

echo Deleting Kubernetes resources...
kubectl delete -k k8s/overlays/local --ignore-not-found=true

echo Done.

endlocal
exit /b 0
