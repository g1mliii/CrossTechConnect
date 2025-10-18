/**
 * API endpoint for exporting category schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/categories/[id]/schema/export - Export schema as JSON
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    // Get schema
    const { data: schemas, error: schemaError } = await supabase
      .from('device_category_schemas')
      .select('*')
      .eq('category_id', params.id)
      .order('created_at', { ascending: false })
      .limit(version ? 100 : 1);

    if (schemaError) {
      throw schemaError;
    }

    let filteredSchemas = schemas || [];
    if (version) {
      filteredSchemas = filteredSchemas.filter(s => s.version === version);
    }

    if (filteredSchemas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No schema found for this category' },
        { status: 404 }
      );
    }

    const schema = filteredSchemas[0];

    // Get category info
    const { data: category } = await supabase
      .from('device_categories')
      .select('id, name, parent_id')
      .eq('id', params.id)
      .single();

    // Format for export
    const exportData = {
      id: schema.id,
      categoryId: schema.category_id,
      categoryName: category?.name || 'Unknown',
      name: schema.name,
      description: schema.description,
      version: schema.version,
      fields: schema.fields,
      requiredFields: schema.required_fields,
      inheritedFields: schema.inherited_fields,
      computedFields: schema.computed_fields,
      validationRules: schema.validation_rules,
      compatibilityRules: schema.compatibility_rules,
      exportedAt: new Date().toISOString()
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="schema-${category?.name || schema.category_id}-v${schema.version}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
