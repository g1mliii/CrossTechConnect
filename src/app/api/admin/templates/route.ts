/**
 * API endpoints for template management (import/export)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CategoryTemplate } from '@/lib/schema/types';
import { templateManager } from '@/lib/schema/templates';

/**
 * GET /api/admin/templates - Get all templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    let templates = templateManager.getAllTemplates();

    // Apply search and tag filters
    if (search || tags) {
      templates = templateManager.searchTemplates(search || '', tags);
    }

    // Get custom templates from Supabase
    const { data: customTemplates, error } = await supabaseAdmin
      .from('category_templates')
      .select('*')
      .order('popularity', { ascending: false });
    
    if (error) {
      console.error('Error fetching custom templates:', error);
    }

    const allTemplates = [
      ...templates,
      ...(customTemplates || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        baseSchema: t.base_schema as any,
        exampleDevices: t.example_devices,
        tags: t.tags,
        popularity: t.popularity
      }))
    ];

    return NextResponse.json({
      success: true,
      data: allTemplates,
      count: allTemplates.length
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
      return NextResponse.json({
        success: true,
        data: importedTemplate,
        message: 'Template imported successfully'
      }, { status: 201 });
    } else {
      // Create new template
      const newTemplate = await createTemplate(template);
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
  const { data: existing } = await supabaseAdmin
    .from('category_templates')
    .select('id')
    .eq('id', templateData.id)
    .single();

  if (existing) {
    throw new Error(`Template with ID ${templateData.id} already exists`);
  }

  // Create template in database
  const { data: template, error } = await supabaseAdmin
    .from('category_templates')
    .insert({
      id: templateData.id,
      name: templateData.name,
      description: templateData.description || '',
      base_schema: JSON.parse(JSON.stringify(templateData.baseSchema)),
      example_devices: templateData.exampleDevices || [],
      tags: templateData.tags || [],
      popularity: templateData.popularity || 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    baseSchema: template.base_schema as any,
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
  const { data: template, error } = await supabaseAdmin
    .from('category_templates')
    .insert({
      id: templateData.id || `template-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '',
      base_schema: JSON.parse(JSON.stringify(templateData.baseSchema)),
      example_devices: templateData.exampleDevices || [],
      tags: templateData.tags || [],
      popularity: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    baseSchema: template.base_schema as any,
    exampleDevices: template.example_devices,
    tags: template.tags,
    popularity: template.popularity
  };
}