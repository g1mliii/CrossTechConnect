#!/usr/bin/env pwsh
# Admin Panel with options
# Usage: .\scripts\start-admin.ps1 [-StudioOnly] [-WebOnly]

param(
    [switch]$StudioOnly,
    [switch]$WebOnly
)

Write-Host "🛠️  Admin Panel Startup" -ForegroundColor Cyan

if ($StudioOnly) {
    Write-Host "📊 Starting Prisma Studio only..." -ForegroundColor Yellow
    Write-Host "Database GUI: http://localhost:5555" -ForegroundColor Blue
    npm run db:studio
} elseif ($WebOnly) {
    Write-Host "🌐 Starting Next.js Admin Panel only..." -ForegroundColor Yellow
    Write-Host "Admin Panel: http://localhost:3000/admin" -ForegroundColor Blue
    Write-Host "⚡ Generating Prisma client..." -ForegroundColor Yellow
    npm run db:generate
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host "🚀 Starting both Admin Panel and Prisma Studio..." -ForegroundColor Yellow
    Write-Host "Admin Panel: http://localhost:3000/admin" -ForegroundColor Blue
    Write-Host "Prisma Studio: http://localhost:5555" -ForegroundColor Blue
    Write-Host ""
    
    # Generate Prisma client
    Write-Host "⚡ Generating Prisma client..." -ForegroundColor Yellow
    npm run db:generate
    
    # Start Prisma Studio in background
    Write-Host "📊 Starting Prisma Studio in background..." -ForegroundColor Yellow
    $studioJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run db:studio
    }
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Prisma Studio running at http://localhost:5555" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
    Write-Host "💡 Press Ctrl+C to stop both services" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        npm run dev
    } finally {
        if ($studioJob) {
            Write-Host "Stopping Prisma Studio..." -ForegroundColor Yellow
            Stop-Job $studioJob -ErrorAction SilentlyContinue
            Remove-Job $studioJob -ErrorAction SilentlyContinue
        }
    }
}