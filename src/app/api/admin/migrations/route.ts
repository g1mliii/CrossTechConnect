/**
 * API endpoints for schema migration management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { MigrationManager } from '@/lib/schema/migration-manager';
import { handlePrismaError } from '@/lib/database';

/**
 * GET /api/admin/migrations - Get all migrations with status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status'); // pending, applied, failed

    const whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Mock for now since table doesn't exist yet
    const migrations: any[] = []; // await prisma.schemaMigration.findMany({
    //   where: whereClause,
    //   include: {
    //     category: {
    //       select: {
    //         name: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // });

    // Filter by status if provided
    const filteredMigrations = status 
      ? migrations.filter((m: any) => {
          if (status === 'applied') return m.appliedAt !== null;
          if (status === 'pending') return m.appliedAt === null;
          return true;
        })
      : migrations;

    return NextResponse.json({
      success: true,
      data: filteredMigrations,
      count: filteredMigrations.length
    });

  } catch (error) {
    console.error('Error fetching migrations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch migrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/migrations - Create and optionally apply a migration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, fromVersion, toVersion, operations, autoApply = false } = body;

    const migrationManager = new MigrationManager();
    
    // Create the migration
    const migration = await migrationManager.createMigration({
      categoryId,
      fromVersion,
      toVersion,
      operations
    });

    // Apply immediately if requested
    if (autoApply) {
      await migrationManager.applyMigration(migration.id);
    }

    return NextResponse.json({
      success: true,
      data: migration,
      message: autoApply ? 'Migration created and applied' : 'Migration created'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating migration:', error);
    handlePrismaError(error);
  }
}