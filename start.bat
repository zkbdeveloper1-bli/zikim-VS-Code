@echo off
cd /d "%~dp0"
start "" http://localhost:8000
where python >nul 2>nul && (python -m http.server 8000) || (py -m http.server 8000)