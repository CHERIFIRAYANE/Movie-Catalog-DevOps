@echo off
setlocal

cd /d "%~dp0"
call scripts\start-project.bat
set SCRIPT_EXIT=%ERRORLEVEL%

endlocal
exit /b %SCRIPT_EXIT%
