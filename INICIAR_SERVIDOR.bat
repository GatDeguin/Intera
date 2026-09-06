@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node no esta instalado. No hace falta para la version portable.
 echo Abri INTERA.html directamente con doble clic.
 pause
 exit /b 1
)
start "" "http://127.0.0.1:4173"
node tools/server.mjs
pause
