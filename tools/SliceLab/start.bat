@echo off
chcp 65001 >nul
title SliceLab - Image Element Splitter

cd /d "%~dp0"

echo ============================================
echo   SliceLab starting...
echo   Web:  http://localhost:5180
echo   API:  http://localhost:5181
echo ============================================
echo.

if not exist "node_modules" goto :install
goto :start

:install
echo [init] node_modules not found, installing dependencies...
call npm install
if errorlevel 1 goto :installfail
goto :start

:installfail
echo [error] npm install failed. Please check network or run "npm install" manually.
pause
exit /b 1

:start
if not exist "data" mkdir data
echo [start] Launching backend + frontend via concurrently...
call npm run dev:all
pause
