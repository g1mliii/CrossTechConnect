/**
 * API endpoints for device category schema management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/schemas - Get all schemas or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const deprecated = searchParams.get('deprecated');
    const template = searchParams.get('template');

    // If requesting templates
    if (template === 'true') {
      const templates = await prisma.categoryTemplate.findMany({
        orderBy: { popularity: 'desc' }
      });
      return NextResponse.json({
        success: true,
        data: templates
      });
    }

    // Build filter for device category schemas
    const where: any = {};
    if (parentId !== null) {
      where.parentId = parentId || null;
    }
    if (deprecated !== null) {
      where.deprecated = deprecated === 'true';
    }

    const schemas = await prisma.deviceCategorySchema.findMany({
      where,
      include: {
        category: true,
        parent: true,
        children: true,
        creator: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
  } finally {
    await prisma.$disconnect();
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
      const template = await prisma.categoryTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      // Create schema from template with customizations
      newSchema = await prisma.deviceCategorySchema.create({
        data: {
          categoryId: customizations.categoryId,
          version: customizations.version || '1.0',
          name: customizations.name || template.name,
          description: customizations.description || template.description,
          fields: { 
            ...(typeof template.baseSchema === 'object' ? template.baseSchema : {}), 
            ...(customizations.fields || {}) 
          },
          requiredFields: customizations.requiredFields || [],
          inheritedFields: customizations.inheritedFields || [],
          createdBy: customizations.createdBy // Should come from auth
        },
        include: {
          category: true,
          creator: {
            select: { id: true, displayName: true, email: true }
          }
        }
      });
    } else if (schema) {
      // Create from full schema definition
      newSchema = await prisma.deviceCategorySchema.create({
        data: schema,
        include: {
          category: true,
          creator: {
            select: { id: true, displayName: true, email: true }
          }
        }
      });
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
  } finally {
    await prisma.$disconnect();
  }
}