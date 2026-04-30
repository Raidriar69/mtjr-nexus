@echo off
cd /d "%~dp0"
title MTJR Nexus — Dev Server
color 0A

echo.
echo  ============================================
echo    MTJR Nexus — Starting Dev Server
echo  ============================================
echo.
echo  Press Ctrl+C to stop the server.
echo.

npm run dev

pause
