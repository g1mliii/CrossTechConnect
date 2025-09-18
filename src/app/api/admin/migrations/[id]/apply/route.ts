/**
 * API endpoint for applying a specific migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { MigrationManager } from '@/lib/schema/migration-manager';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/migrations/[id]/apply - Apply a migration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const migrationManager = new MigrationManager();
    
    const result = await migrationManager.applyMigration(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Migration applied successfully'
    });

  } catch (error) {
    console.error('Error applying migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}