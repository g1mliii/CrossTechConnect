/**
 * API endpoints for device category schema management
 */

import { NextRequest, NextResponse } from 'next/server';
import { schemaRegistry } from '@/lib/schema/registry';
import { templateManager } from '@/lib/schema/templates';
// Removed Prisma dependency

/**
 * GET /api/schemas - Get all schemas or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    await schemaRegistry.initialize();
    
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const deprecated = searchParams.get('deprecated');
    const template = searchParams.get('template');

    // If requesting templates
    if (template === 'true') {
      const templates = templateManager.getAllTemplates();
      return NextResponse.json({
        success: true,
        data: templates
      });
    }

    // Filter parameters
    const filter: any = {};
    if (parentId !== null) {
      filter.parentId = parentId || undefined;
    }
    if (deprecated !== null) {
      filter.deprecated = deprecated === 'true';
    }

    const schemas = schemaRegistry.getAllSchemas(filter);

    return NextResponse.json({
      success: true,
      data: schemas,
      count: schemas.length
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
    await schemaRegistry.initialize();
    
    const body = await request.json();
    const { templateId, customizations, schema } = body;

    let newSchema;

    if (templateId) {
      // Create from template
      const template = templateManager.getTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      newSchema = await schemaRegistry.createCategoryFromTemplate(template, customizations);
    } else if (schema) {
      // Create from full schema definition
      await schemaRegistry.registerSchema(schema);
      newSchema = schema;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either templateId or schema must be provided' },
        { status: 400 }
      );
    }

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