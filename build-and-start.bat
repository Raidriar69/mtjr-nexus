@echo off
cd /d "%~dp0"
title MTJR Nexus — Production Build
color 0B

echo.
echo  ============================================
echo    MTJR Nexus — Production Build + Start
echo  ============================================
echo.
echo  Step 1: Building...
echo.

call npm run build

if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Build failed. Fix the errors above and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================
echo    Build complete. Starting server...
echo  ============================================
echo.
echo  Press Ctrl+C to stop the server.
echo.

npm start

pause
