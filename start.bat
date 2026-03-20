@echo off
echo Morning Dashboard 시작 중...

cd /d "%~dp0backend"
start "Backend" cmd /k "npm install && npm run dev"

timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm install && npm run dev"

timeout /t 3 /nobreak >nul

start http://localhost:5173
