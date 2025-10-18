/**
 * API endpoints for template management (import/export)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  baseSchema: any;
  exampleDevices: string[];
  tags: string[];
  popularity: number;
}

/**
 * GET /api/admin/templates - Get all templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Check cache first (10 minute TTL - templates change rarely)
    const { cache, createCacheKey } = await import('@/lib/cache');
    const cacheKey = createCacheKey('templates', { 
      search: search || 'none',
      tags: tags?.join(',') || 'none'
    });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    let query = supabase
      .from('category_templates')
      .select('*')
      .limit(100); // Limit to 100 templates

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply tag filter
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    const { data: templates, error } = await query.order('popularity', { ascending: false });

    if (error) {
      throw error;
    }

    const allTemplates = (templates || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      baseSchema: t.base_schema,
      exampleDevices: t.example_devices,
      tags: t.tags,
      popularity: t.popularity
    }));

    const result = {
      data: allTemplates,
      count: allTemplates.length
    };

    // Cache for 10 minutes (templates rarely change)
    cache.set(cacheKey, result, 600);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates - Create or import a template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, import: isImport = false } = body;

    if (isImport) {
      // Import template from JSON
      const importedTemplate = await importTemplate(template);
      
      // Invalidate template cache
      const { cache } = await import('@/lib/cache');
      cache.clear(); // Clear all template caches
      
      return NextResponse.json({
        success: true,
        data: importedTemplate,
        message: 'Template imported successfully'
      }, { status: 201 });
    } else {
      // Create new template
      const newTemplate = await createTemplate(template);
      
      // Invalidate template cache
      const { cache } = await import('@/lib/cache');
      cache.clear(); // Clear all template caches
      
      return NextResponse.json({
        success: true,
        data: newTemplate,
        message: 'Template created successfully'
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating/importing template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/import template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Import a template from JSON data
 */
async function importTemplate(templateData: any): Promise<CategoryTemplate> {
  // Validate template structure
  if (!templateData.id || !templateData.name || !templateData.baseSchema) {
    throw new Error('Invalid template format: missing required fields');
  }

  // Check if template already exists
  const { data: existing } = await supabase
    .from('category_templates')
    .select('id')
    .eq('id', templateData.id)
    .single();

  if (existing) {
    throw new Error(`Template with ID ${templateData.id} already exists`);
  }

  // Create template in database
  const { data: template, error } = await supabase
    .from('category_templates')
    .insert({
      id: templateData.id,
      name: templateData.name,
      description: templateData.description || '',
      base_schema: templateData.baseSchema,
      example_devices: templateData.exampleDevices || [],
      tags: templateData.tags || [],
      popularity: templateData.popularity || 0
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    baseSchema: template.base_schema,
    exampleDevices: template.example_devices,
    tags: template.tags,
    popularity: template.popularity
  };
}

/**
 * Create a new template
 */
async function createTemplate(templateData: Partial<CategoryTemplate>): Promise<CategoryTemplate> {
  if (!templateData.name || !templateData.baseSchema) {
    throw new Error('Template name and base schema are required');
  }

  // Create template in database
  const { data: template, error } = await supabase
    .from('category_templates')
    .insert({
      id: templateData.id || `template-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '',
      base_schema: templateData.baseSchema,
      example_devices: templateData.exampleDevices || [],
      tags: templateData.tags || [],
      popularity: 0
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    baseSchema: template.base_schema,
    exampleDevices: template.example_devices,
    tags: template.tags,
    popularity: template.popularity
  };
}