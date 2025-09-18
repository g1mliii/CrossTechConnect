#!/usr/bin/env pwsh
# Quick admin panel startup
# Usage: .\scripts\admin.ps1

Write-Host "🛠️  Starting Admin Panel..." -ForegroundColor Cyan

# Generate Prisma client (always needed)
Write-Host "⚡ Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "📱 Admin Panel will be at: http://localhost:3000/admin" -ForegroundColor Blue
Write-Host "💡 Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start Next.js development server
npm run dev