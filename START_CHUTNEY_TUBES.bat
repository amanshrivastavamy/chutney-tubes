@echo off
title Chutney Tubes - Demand Test Server
echo ======================================================
echo   Starting Chutney Tubes Website...
echo   Please keep this window open while testing.
echo ======================================================
echo.

cd /d "%~dp0"

:: Wait 2 seconds, then open the browser automatically
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Run the server using the built-in node engine
if exist "C:\Users\Lenovo\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
    call "C:\Users\Lenovo\AppData\Roaming\Antigravity\bin\agy-node.cmd" dev-server.js
) else (
    node dev-server.js
)

pause
