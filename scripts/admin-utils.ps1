#!/usr/bin/env pwsh
# Admin utilities for Device Compatibility Platform
# Usage: .\scripts\admin-utils.ps1 [command]

param(
    [Parameter(Position=0)]
    [ValidateSet("studio", "seed", "verify", "audit", "advisor", "test", "reset", "help")]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "🛠️  Device Compatibility Platform - Admin Utilities" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\admin-utils.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  studio   - Open Prisma Studio (database GUI)" -ForegroundColor Blue
    Write-Host "  seed     - Seed database with test data" -ForegroundColor Blue
    Write-Host "  verify   - Verify database indexes and structure" -ForegroundColor Blue
    Write-Host "  audit    - Run security audit" -ForegroundColor Blue
    Write-Host "  advisor  - Get Supabase advisor recommendations" -ForegroundColor Blue
    Write-Host "  test     - Test database connection" -ForegroundColor Blue
    Write-Host "  reset    - Reset database (WARNING: destroys data)" -ForegroundColor Red
    Write-Host "  help     - Show this help message" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\admin-utils.ps1 studio" -ForegroundColor Gray
    Write-Host "  .\scripts\admin-utils.ps1 seed" -ForegroundColor Gray
}

function Ensure-Database {
    # Check if using Supabase or local Docker
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        if ($envContent -match "supabase\.co") {
            Write-Host "☁️  Using Supabase hosted database..." -ForegroundColor Yellow
        } else {
            # Using local Docker PostgreSQL
            $dockerRunning = docker ps -q --filter "name=postgres" 2>$null
            if (-not $dockerRunning) {
                Write-Host "📦 Starting local database..." -ForegroundColor Yellow
                npm run docker:dev | Out-Null
                Start-Sleep -Seconds 3
            }
        }
    }
    
    # Generate Prisma client
    npm run db:generate | Out-Null
}

try {
    switch ($Command) {
        "studio" {
            Write-Host "📊 Starting Prisma Studio..." -ForegroundColor Green
            Ensure-Database
            Write-Host "Opening Prisma Studio at http://localhost:5555" -ForegroundColor Blue
            npm run db:studio
        }
        
        "seed" {
            Write-Host "🌱 Seeding database with test data..." -ForegroundColor Green
            Ensure-Database
            npm run db:seed
            Write-Host "✅ Database seeded successfully" -ForegroundColor Green
        }
        
        "verify" {
            Write-Host "🔍 Verifying database structure..." -ForegroundColor Green
            Ensure-Database
            npm run db:verify
            Write-Host "✅ Database verification complete" -ForegroundColor Green
        }
        
        "audit" {
            Write-Host "🔒 Running security audit..." -ForegroundColor Green
            npm run security:audit
            Write-Host "✅ Security audit complete" -ForegroundColor Green
        }
        
        "advisor" {
            Write-Host "💡 Getting Supabase advisor recommendations..." -ForegroundColor Green
            npm run advisor:summary
            Write-Host "✅ Advisor summary complete" -ForegroundColor Green
        }
        
        "test" {
            Write-Host "🧪 Testing database connection..." -ForegroundColor Green
            Ensure-Database
            npm run db:test
            Write-Host "✅ Database connection test complete" -ForegroundColor Green
        }
        
        "reset" {
            Write-Host "⚠️  WARNING: This will destroy all data!" -ForegroundColor Red
            $confirm = Read-Host "Type 'RESET' to confirm database reset"
            if ($confirm -eq "RESET") {
                Write-Host "🗑️ Resetting database..." -ForegroundColor Yellow
                Ensure-Database
                npm run db:push -- --force-reset
                Write-Host "✅ Database reset complete" -ForegroundColor Green
            } else {
                Write-Host "❌ Reset cancelled" -ForegroundColor Yellow
            }
        }
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
            Show-Help
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}