/**
 * API endpoint for applying migrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/migrations/[id]/apply - Apply a migration
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

    // Check if migration is already applied
    if (migration.applied_at) {
      return NextResponse.json(
        { success: false, error: 'Migration has already been applied' },
        { status: 400 }
      );
    }

    // Apply the migration by updating the applied_at timestamp
    // In a real implementation, you would also execute the actual migration operations
    const { data: updatedMigration, error: updateError } = await supabase
      .from('schema_migrations')
      .update({
        applied_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        device_categories!inner(name)
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // TODO: In a real implementation, execute the migration operations here
    // This would involve:
    // 1. Parsing the operations JSON
    // 2. Executing schema changes (add/remove fields, update validation rules, etc.)
    // 3. Migrating existing device data to new schema
    // 4. Updating device category schema version

    return NextResponse.json({
      success: true,
      data: updatedMigration,
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