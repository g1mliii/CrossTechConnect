/**
 * API endpoints for device category schema management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/schemas - Get all schemas or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const deprecated = searchParams.get('deprecated');
    const template = searchParams.get('template');

    // Check cache first (5 minute TTL)
    const { cache, createCacheKey } = await import('@/lib/cache');
    const cacheKey = createCacheKey('schemas', { 
      parentId: parentId || 'all',
      deprecated: deprecated || 'all',
      template: template || 'false'
    });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    // If requesting templates
    if (template === 'true') {
      const { data: templates, error } = await supabase
        .from('category_templates')
        .select('*')
        .order('popularity', { ascending: false });

      if (error) throw error;

      const result = { data: templates || [] };
      cache.set(cacheKey, result, 300);

      return NextResponse.json({
        success: true,
        ...result,
        cached: false
      });
    }

    // Build query for device category schemas
    let query = supabase
      .from('device_category_schemas')
      .select(`
        *,
        category:device_categories!category_id(id, name),
        parent:device_category_schemas!parent_id(id, name, version),
        creator:users!created_by(id, display_name, email)
      `)
      .limit(200);

    if (parentId !== null) {
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
    }

    if (deprecated !== null) {
      query = query.eq('deprecated', deprecated === 'true');
    }

    const { data: schemas, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const result = {
      data: schemas || [],
      count: schemas?.length || 0
    };

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching schemas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schemas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schemas - Create a new schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, customizations, schema } = body;

    let newSchema;

    if (templateId) {
      // Create from template
      const { data: template, error: templateError } = await supabase
        .from('category_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      // Create schema from template with customizations
      const { data: createdSchema, error } = await supabase
        .from('device_category_schemas')
        .insert({
          category_id: customizations.categoryId,
          version: customizations.version || '1.0',
          name: customizations.name || template.name,
          description: customizations.description || template.description,
          fields: { 
            ...(typeof template.base_schema === 'object' ? template.base_schema : {}), 
            ...(customizations.fields || {}) 
          },
          required_fields: customizations.requiredFields || [],
          inherited_fields: customizations.inheritedFields || [],
          created_by: customizations.createdBy // Should come from auth
        })
        .select(`
          *,
          category:device_categories!category_id(id, name),
          creator:users!created_by(id, display_name, email)
        `)
        .single();

      if (error) throw error;
      newSchema = createdSchema;
    } else if (schema) {
      // Create from full schema definition
      const { data: createdSchema, error } = await supabase
        .from('device_category_schemas')
        .insert(schema)
        .select(`
          *,
          category:device_categories!category_id(id, name),
          creator:users!created_by(id, display_name, email)
        `)
        .single();

      if (error) throw error;
      newSchema = createdSchema;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either templateId or schema must be provided' },
        { status: 400 }
      );
    }

    // Invalidate schema cache
    const { cache } = await import('@/lib/cache');
    cache.clear(); // Clear all schema caches

    return NextResponse.json({
      success: true,
      data: newSchema
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}