@echo off
cd /d "%~dp0"
echo Starting Prisma Studio Only...
powershell -ExecutionPolicy Bypass -File "scripts\start-admin.ps1" -StudioOnly
pause