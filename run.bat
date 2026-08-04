@echo off
echo Starting StudyMate Application...

echo.
echo Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker engine is not running. Please start Docker and try again.
    pause
    exit /b
)

echo.
echo [1/3] Starting PostgreSQL database...
docker-compose up -d

echo.
echo [2/3] Starting API Server in background...
start /B "" cmd /c "cd api && npm run dev > ../api.log 2>&1"

echo.
echo [3/3] Starting Web App in background...
start /B "" cmd /c "cd web && npm run dev > ../web.log 2>&1"

echo.
echo Done! The servers are running in the background.
echo - API logs: api.log
echo - Web logs: web.log
echo Note: To stop them, run the 'stop.bat' script.
pause