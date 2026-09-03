@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo INTERA no encontro Node.js en este equipo.
  echo Instala Node.js 22 o superior y luego ejecuta nuevamente INICIAR_INTERA.bat.
  echo.
  pause
  exit /b 1
)

echo Iniciando INTERA en http://127.0.0.1:4173 ...
start "INTERA - servidor local" cmd /k "node tools\server.mjs"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173"
exit /b 0
