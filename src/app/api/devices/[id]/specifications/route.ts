/**
 * API endpoint for device specifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/devices/[id]/specifications - Get device specifications
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    
    const { data: specification, error } = await supabase
      .from('device_specifications')
      .select(`
        *,
        category:device_categories!device_specifications_category_id_fkey(id, name),
        schema:device_category_schemas!fk_device_specifications_schema(id, version, name, fields, required_fields)
      `)
      .eq('device_id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { 
            success: false, 
            error: 'No specifications found for this device'
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: specification
    });

  } catch (error) {
    console.error('Error fetching device specifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch device specifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/devices/[id]/specifications - Update device specifications
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { categoryId, schemaVersion, specifications, confidenceScores, sources } = body;

    // Validate required fields
    if (!categoryId || !schemaVersion || !specifications) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: categoryId, schemaVersion, specifications'
        },
        { status: 400 }
      );
    }

    // Check if specification exists
    const { data: existing } = await supabase
      .from('device_specifications')
      .select('id')
      .eq('device_id', params.id)
      .single();

    let specification;

    if (existing) {
      // Update existing specification
      const { data, error } = await supabase
        .from('device_specifications')
        .update({
          category_id: categoryId,
          schema_version: schemaVersion,
          specifications,
          confidence_scores: confidenceScores || null,
          sources: sources || null,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', params.id)
        .select(`
          *,
          category:device_categories!device_specifications_category_id_fkey(id, name),
          schema:device_category_schemas!fk_device_specifications_schema(id, version, name, fields)
        `)
        .single();

      if (error) throw error;
      specification = data;
    } else {
      // Create new specification
      const { data, error } = await supabase
        .from('device_specifications')
        .insert({
          device_id: params.id,
          category_id: categoryId,
          schema_version: schemaVersion,
          specifications,
          confidence_scores: confidenceScores || null,
          sources: sources || null
        })
        .select(`
          *,
          category:device_categories!device_specifications_category_id_fkey(id, name),
          schema:device_category_schemas!fk_device_specifications_schema(id, version, name, fields)
        `)
        .single();

      if (error) throw error;
      specification = data;
    }

    return NextResponse.json({
      success: true,
      data: specification
    });

  } catch (error) {
    console.error('Error updating device specifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update device specifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices/[id]/specifications - Create device specifications
 */
export async function POST(request: NextRequest, context: RouteParams) {
  return PUT(request, context);
}
