@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Instala Node.js LTS 22.13 o superior desde nodejs.org.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22 || a===22 && b>=13 ? 0 : 1)"
if errorlevel 1 (
  echo Se requiere Node.js 22.13 o superior.
  pause
  exit /b 1
)
node tools/setup.mjs
if errorlevel 1 goto failed
node --env-file-if-exists=.env tools/start-local.mjs
:failed
pause
