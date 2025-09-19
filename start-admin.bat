@echo off
cd /d "%~dp0"
echo Starting Admin Panel...

echo Generating Prisma client...
npm run db:generate

echo.
echo Starting Next.js development server...
echo Admin Panel will be available at: http://localhost:3000/admin
echo Press Ctrl+C to stop the server
echo.

npm run dev
pause