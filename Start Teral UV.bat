@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo        Teral UV Packaged Launcher
echo ========================================
echo.

if not exist "TeralUVLauncher.exe" (
    echo [error] TeralUVLauncher.exe was not found in:
    echo         %cd%
    echo.
    echo Make sure this batch file is next to the packaged executable.
    echo.
    pause
    exit /b 1
)

if not exist "static" (
    echo [error] The static folder was not found in:
    echo         %cd%\static
    echo.
    echo The packaged launcher expects the static assets to be beside the EXE.
    echo.
    pause
    exit /b 1
)

echo [info] Starting Teral UV...
echo [info] Frontend should open at http://127.0.0.1:8080/
echo [info] Press Ctrl+C in the launcher window to stop the servers.
echo.

start "" "TeralUVLauncher.exe" --open
if errorlevel 1 (
    echo.
    echo [error] Failed to launch TeralUVLauncher.exe
    echo.
    pause
    exit /b 1
)

endlocal
