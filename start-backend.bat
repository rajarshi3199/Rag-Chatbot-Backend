@echo off
REM Kill any process using port 5000
echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000...
    taskkill /PID %%a /F >nul 2>&1
)

REM Wait a moment for port to be released
timeout /t 2 /nobreak >nul

REM Start the backend server
echo Starting backend server...
npm run dev
