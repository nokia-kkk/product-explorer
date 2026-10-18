@echo off
setlocal
cd /d "%~dp0"

echo === MiniApp: production mode ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo         Install Node 20 or newer from https://nodejs.org
  goto :fail
)

if not exist "node_modules" (
  echo Installing dependencies ^(first run only, may take a few minutes^)...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    echo         If the error mentions better-sqlite3 or Visual Studio,
    echo         see the note in RUNNING.md.
    goto :fail
  )
)

if not exist "data\app.db" (
  echo No database found - importing product data...
  call npm run import
  if errorlevel 1 goto :fail
)

echo Building the client and server...
call npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Build failed.
  goto :fail
)

echo.
echo   App and API:  http://localhost:3000
echo.
echo   Press Ctrl+C to stop.
echo.

set NODE_ENV=production
call npm start

echo.
echo Server stopped.
pause
exit /b 0

:fail
echo.
pause
exit /b 1
