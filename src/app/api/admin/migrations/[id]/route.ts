/**
 * API endpoints for individual migration management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/migrations/[id] - Get a specific migration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: migration, error } = await supabase
      .from('schema_migrations')
      .select(`
        *,
        device_categories!inner(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Migration not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: migration
    });

  } catch (error) {
    console.error('Error fetching migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/migrations/[id] - Delete a migration (only if not applied)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // First check if migration exists and is not applied
    const { data: migration, error: fetchError } = await supabase
      .from('schema_migrations')
      .select('applied_at')
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

    if (migration.applied_at) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete applied migration' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('schema_migrations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Migration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}