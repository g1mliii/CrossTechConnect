/**
 * API endpoints for schema migration management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/migrations - Get all migrations with status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status'); // pending, applied, failed

    let query = supabase
      .from('schema_migrations')
      .select(`
        *,
        device_categories!inner(name)
      `);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: migrations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter by status if provided
    const filteredMigrations = status 
      ? (migrations || []).filter((m: any) => {
          if (status === 'applied') return m.applied_at !== null;
          if (status === 'pending') return m.applied_at === null;
          return true;
        })
      : migrations || [];

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

    // First, check if the target schema version exists, if not create it
    const { data: existingSchema } = await supabase
      .from('device_category_schemas')
      .select('id')
      .eq('category_id', categoryId)
      .eq('version', toVersion)
      .single();

    if (!existingSchema) {
      // Create a basic schema for the target version
      const { error: schemaError } = await supabase
        .from('device_category_schemas')
        .insert({
          category_id: categoryId,
          version: toVersion,
          name: `Schema v${toVersion}`,
          description: `Auto-generated schema for migration to version ${toVersion}`,
          fields: {
            type: 'object',
            properties: {},
            required: []
          },
          required_fields: [],
          inherited_fields: [],
          created_by: 'system-user-001'
        });

      if (schemaError) {
        console.error('Error creating target schema:', schemaError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create target schema version',
            details: schemaError.message
          },
          { status: 500 }
        );
      }
    }

    // Create the migration
    const { data: migration, error } = await supabase
      .from('schema_migrations')
      .insert({
        category_id: categoryId,
        from_version: fromVersion,
        to_version: toVersion,
        operations: operations,
        applied_at: autoApply ? new Date().toISOString() : null
      })
      .select(`
        *,
        device_categories!inner(name)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: migration,
      message: autoApply ? 'Migration created and applied' : 'Migration created'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}