/**
 * API endpoint for exporting templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { templateManager } from '@/lib/schema/templates';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/templates/[id]/export - Export a template as JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    let template;

    // Try to get from built-in templates first
    template = templateManager.getTemplate(params.id);

    // If not found, try database - mock for now since table doesn't exist yet
    if (!template) {
      const dbTemplate = null; // await prisma.categoryTemplate.findUnique({
      //   where: { id: params.id }
      // });

      if (dbTemplate) {
        template = {
          id: (dbTemplate as any).id,
          name: (dbTemplate as any).name,
          description: (dbTemplate as any).description,
          baseSchema: (dbTemplate as any).baseSchema as any,
          exampleDevices: (dbTemplate as any).exampleDevices,
          tags: (dbTemplate as any).tags,
          popularity: (dbTemplate as any).popularity
        };
      }
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create export data with metadata
    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      metadata: {
        source: 'device-compatibility-platform',
        version: '1.0.0',
        description: 'Device category template export'
      }
    };

    // Return as downloadable JSON
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${template.id}-template.json"`
      }
    });

    return response;

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