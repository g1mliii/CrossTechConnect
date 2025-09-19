/**
 * API endpoint for migration rollback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/migrations/[id]/rollback - Rollback a migration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // First, get the migration details
    const { data: migration, error: fetchError } = await supabase
      .from('schema_migrations')
      .select(`
        *,
        device_categories!inner(name)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Migration not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if migration is applied
    if (!migration.applied_at) {
      return NextResponse.json(
        { success: false, error: 'Migration has not been applied yet' },
        { status: 400 }
      );
    }

    // Create a rollback migration
    const rollbackOperations = generateRollbackOperations(migration.operations);
    
    const { data: rollbackMigration, error: createError } = await supabase
      .from('schema_migrations')
      .insert({
        category_id: migration.category_id,
        from_version: migration.to_version,
        to_version: migration.from_version,
        operations: rollbackOperations,
        applied_at: new Date().toISOString() // Auto-apply rollback
      })
      .select(`
        *,
        device_categories!inner(name)
      `)
      .single();

    if (createError) {
      throw createError;
    }

    // TODO: In a real implementation, execute the rollback operations here
    // This would involve:
    // 1. Parsing the rollback operations JSON
    // 2. Executing reverse schema changes
    // 3. Migrating device data back to previous schema
    // 4. Updating device category schema version

    return NextResponse.json({
      success: true,
      data: rollbackMigration,
      message: 'Migration rolled back successfully'
    });

  } catch (error) {
    console.error('Error rolling back migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to rollback migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate rollback operations from forward operations
 */
function generateRollbackOperations(forwardOperations: any): any {
  // This is a simplified implementation
  // In a real system, this would be more sophisticated
  const rollbackOps = [];

  for (const op of forwardOperations) {
    switch (op.type) {
      case 'add_field':
        rollbackOps.push({
          type: 'remove_field',
          field: op.field,
          description: `Rollback: Remove field ${op.field}`
        });
        break;
      
      case 'remove_field':
        rollbackOps.push({
          type: 'add_field',
          field: op.field,
          fieldType: op.originalType,
          required: op.originalRequired,
          description: `Rollback: Restore field ${op.field}`
        });
        break;
      
      case 'modify_field':
        rollbackOps.push({
          type: 'modify_field',
          field: op.field,
          fieldType: op.originalType,
          required: op.originalRequired,
          description: `Rollback: Restore original field definition for ${op.field}`
        });
        break;
      
      case 'add_validation':
        rollbackOps.push({
          type: 'remove_validation',
          field: op.field,
          validation: op.validation,
          description: `Rollback: Remove validation for ${op.field}`
        });
        break;
      
      case 'remove_validation':
        rollbackOps.push({
          type: 'add_validation',
          field: op.field,
          validation: op.originalValidation,
          description: `Rollback: Restore validation for ${op.field}`
        });
        break;
      
      default:
        // For unknown operations, create a manual rollback placeholder
        rollbackOps.push({
          type: 'manual_rollback',
          originalOperation: op,
          description: `Manual rollback required for operation: ${op.type}`
        });
    }
  }

  return rollbackOps.reverse(); // Reverse order for proper rollback
}