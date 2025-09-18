@echo off
cd /d "%~dp0"
echo Starting Admin Panel...
powershell -ExecutionPolicy Bypass -File "scripts\admin.ps1"
pause