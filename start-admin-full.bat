@echo off
cd /d "%~dp0"
echo Starting Full Admin Panel (Next.js + Prisma Studio)...
powershell -ExecutionPolicy Bypass -File "scripts\start-admin.ps1"
pause