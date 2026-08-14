@echo off
cd /d "%~dp0"
echo NatureSpectrumLibrary: http://localhost:8000
python -m http.server 8000 -d site
pause
