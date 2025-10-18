/**
 * API endpoint for validating device specifications against schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { schemaRegistry } from '@/lib/schema/registry';
import { SchemaValidator } from '@/lib/schema/validator';
import { DeviceSpecification } from '@/lib/schema/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/schemas/[id]/validate - Validate device specification against schema
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await schemaRegistry.initialize();
    const resolvedParams = await params;
    
    const body = await request.json();
    const { specification, version } = body;

    // Get the schema
    const schema = schemaRegistry.getSchema(resolvedParams.id, version);
    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found' },
        { status: 404 }
      );
    }

    // Validate the specification
    const validator = new SchemaValidator();
    const validationResult = validator.validateSpecification(specification, schema);

    return NextResponse.json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        fieldErrors: validationResult.fieldErrors,
        schema: {
          id: schema.id,
          name: schema.name,
          version: schema.version
        }
      }
    });

  } catch (error) {
    console.error('Error validating specification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate specification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}