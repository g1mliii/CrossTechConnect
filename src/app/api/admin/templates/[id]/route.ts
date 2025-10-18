/**
 * API endpoints for individual template management
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
 * GET /api/admin/templates/[id] - Get a specific template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: template, error } = await supabase
      .from('category_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const formattedTemplate: CategoryTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      baseSchema: template.base_schema,
      exampleDevices: template.example_devices,
      tags: template.tags,
      popularity: template.popularity
    };

    return NextResponse.json({
      success: true,
      data: formattedTemplate
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates/[id] - Update a template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, baseSchema, exampleDevices, tags } = body;

    // Validate required fields
    if (!name || !baseSchema) {
      return NextResponse.json(
        { success: false, error: 'Template name and base schema are required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('category_templates')
      .update({
        name,
        description: description || '',
        base_schema: baseSchema,
        example_devices: exampleDevices || [],
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const formattedTemplate: CategoryTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      baseSchema: template.base_schema,
      exampleDevices: template.example_devices,
      tags: template.tags,
      popularity: template.popularity
    };

    // Invalidate template cache
    const { cache } = await import('@/lib/cache');
    cache.clear(); // Clear all template caches

    return NextResponse.json({
      success: true,
      data: formattedTemplate,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id] - Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('category_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Invalidate template cache
    const { cache } = await import('@/lib/cache');
    cache.clear(); // Clear all template caches

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}