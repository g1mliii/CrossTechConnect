/**
 * API endpoint for template export
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/templates/[id]/export - Export template as JSON
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

    // Format template for export
    const exportData = {
      id: template.id,
      name: template.name,
      description: template.description,
      baseSchema: template.base_schema,
      exampleDevices: template.example_devices,
      tags: template.tags,
      popularity: template.popularity,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="template-${template.name.replace(/[^a-zA-Z0-9]/g, '-')}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}