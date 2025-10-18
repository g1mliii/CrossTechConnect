/**
 * API endpoints for individual schema management
 */

import { NextRequest, NextResponse } from 'next/server';
import { schemaRegistry } from '@/lib/schema/registry';
import { handlePrismaError } from '@/lib/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/schemas/[id] - Get a specific schema
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await schemaRegistry.initialize();
    const resolvedParams = await params;
    
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    
    const schema = schemaRegistry.getSchema(resolvedParams.id, version || undefined);
    
    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schema
    });

  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schemas/[id] - Update a schema (creates new version)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await schemaRegistry.initialize();
    const resolvedParams = await params;
    
    const body = await request.json();
    const { updates, migrationOperations = [] } = body;

    const updatedSchema = await schemaRegistry.updateSchema(
      resolvedParams.id,
      updates,
      migrationOperations
    );

    return NextResponse.json({
      success: true,
      data: updatedSchema
    });

  } catch (error) {
    console.error('Error updating schema:', error);
    handlePrismaError(error);
  }
}

/**
 * DELETE /api/schemas/[id] - Mark schema as deprecated
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await schemaRegistry.initialize();
    const resolvedParams = await params;
    
    const body = await request.json();
    const { deprecationMessage } = body;

    const updatedSchema = await schemaRegistry.updateSchema(resolvedParams.id, {
      deprecated: true,
      deprecationMessage: deprecationMessage || 'Schema has been deprecated'
    });

    return NextResponse.json({
      success: true,
      data: updatedSchema,
      message: 'Schema marked as deprecated'
    });

  } catch (error) {
    console.error('Error deprecating schema:', error);
    handlePrismaError(error);
  }
}