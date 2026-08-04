@echo off
echo Stopping StudyMate Application...

echo.
echo Stopping Node.js servers...
taskkill /F /IM node.exe >nul 2>&1
echo %errorlevel%
if %errorlevel% equ 0 (
    echo Successfully stopped Node.js processes.
) else (
    echo No Node.js processes found running.
)

echo.
echo Stopping PostgreSQL database...
docker-compose down

echo.
echo StudyMate stopped.
pause
