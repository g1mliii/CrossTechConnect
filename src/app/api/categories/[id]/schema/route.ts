/**
 * API endpoint for managing category schemas
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

// Helper to convert snake_case to camelCase for response
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * GET /api/categories/[id]/schema - Get the latest schema for a category
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    if (includeHistory) {
      // Get all schema versions for this category
      const { data: schemas, error } = await supabase
        .from('device_category_schemas')
        .select('*')
        .eq('category_id', params.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: schemas || []
      });
    }

    // Build query for single schema
    const { data: schemas, error } = await supabase
      .from('device_category_schemas')
      .select('*')
      .eq('category_id', params.id)
      .eq('deprecated', false)
      .order('created_at', { ascending: false })
      .limit(version ? 100 : 1);

    if (error) {
      throw error;
    }

    let filteredSchemas = schemas || [];
    if (version) {
      filteredSchemas = filteredSchemas.filter(s => s.version === version);
    }

    if (filteredSchemas.length === 0) {
      // Return success with null data instead of 404 - this is expected for categories without schemas
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No schema defined for this category yet'
      });
    }

    const schema = filteredSchemas[0];

    return NextResponse.json({
      success: true,
      data: schema
    });

  } catch (error) {
    console.error('Error fetching category schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories/[id]/schema - Create a new schema version for a category
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const body = await request.json();

    const {
      name,
      description,
      version,
      fields,
      requiredFields,
      inheritedFields,
      computedFields,
      validationRules,
      compatibilityRules,
      createdBy,
      parentId,
      templateId
    } = body;

    // Validate required fields
    if (!name || !version || !fields || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, version, fields, createdBy' },
        { status: 400 }
      );
    }

    // Check if version already exists
    const { data: existingSchema } = await supabase
      .from('device_category_schemas')
      .select('id')
      .eq('category_id', params.id)
      .eq('version', version)
      .single();

    if (existingSchema) {
      return NextResponse.json(
        { success: false, error: `Schema version ${version} already exists for this category` },
        { status: 409 }
      );
    }

    // Build schema data object
    let schemaFields = fields;
    let schemaRequiredFields = requiredFields || [];

    // If this is based on a template, fetch template data
    if (templateId) {
      const { data: template } = await supabase
        .from('category_templates')
        .select('base_schema')
        .eq('id', templateId)
        .single();

      if (template && template.base_schema) {
        // Merge template schema with provided data
        schemaFields = { ...(template.base_schema.fields || {}), ...fields };
        schemaRequiredFields = template.base_schema.requiredFields || requiredFields || [];
      }
    }

    const schemaData = {
      category_id: params.id,
      name,
      description: description || null,
      version,
      fields: schemaFields,
      required_fields: schemaRequiredFields,
      inherited_fields: inheritedFields || [],
      computed_fields: computedFields || null,
      validation_rules: validationRules || null,
      compatibility_rules: compatibilityRules || null,
      parent_id: parentId || null,
      created_by: createdBy,
      deprecated: false
    };

    // Create new schema
    const { data: newSchema, error } = await supabase
      .from('device_category_schemas')
      .insert(schemaData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: newSchema,
      message: 'Schema created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]/schema - Update an existing schema
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const body = await request.json();

    const {
      schemaId,
      name,
      description,
      fields,
      requiredFields,
      inheritedFields,
      computedFields,
      validationRules,
      compatibilityRules,
      deprecated,
      deprecationMessage
    } = body;

    if (!schemaId) {
      return NextResponse.json(
        { success: false, error: 'Schema ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (requiredFields !== undefined) updateData.required_fields = requiredFields;
    if (inheritedFields !== undefined) updateData.inherited_fields = inheritedFields;
    if (computedFields !== undefined) updateData.computed_fields = computedFields;
    if (validationRules !== undefined) updateData.validation_rules = validationRules;
    if (compatibilityRules !== undefined) updateData.compatibility_rules = compatibilityRules;
    if (deprecated !== undefined) updateData.deprecated = deprecated;
    if (deprecationMessage !== undefined) updateData.deprecation_message = deprecationMessage;

    // Update schema
    const { data: updatedSchema, error } = await supabase
      .from('device_category_schemas')
      .update(updateData)
      .eq('id', schemaId)
      .eq('category_id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedSchema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSchema,
      message: 'Schema updated successfully'
    });

  } catch (error) {
    console.error('Error updating category schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
