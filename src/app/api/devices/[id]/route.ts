/**
 * API endpoints for individual device operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/devices/[id] - Get a single device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: device, error } = await supabase
      .from('devices')
      .select(`
        *,
        device_categories!inner(id, name),
        device_standards(
          id, port_count, notes, verified,
          standards(id, name, category, version)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: device
    });

  } catch (error) {
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/devices/[id] - Update a device
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      brand,
      model,
      categoryId,
      widthCm,
      heightCm,
      depthCm,
      weightKg,
      powerWatts,
      powerType,
      manualUrl,
      imageUrls,
      description,
      verified,
      confidenceScore,
      sourceUrl,
      extractionMethod
    } = body;

    if (!name || !brand || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Name, brand, and categoryId are required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('device_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const { data: updatedDevice, error } = await supabase
      .from('devices')
      .update({
        name,
        brand,
        model,
        category_id: categoryId,
        width_cm: widthCm ? parseFloat(widthCm) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        depth_cm: depthCm ? parseFloat(depthCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        power_watts: powerWatts ? parseInt(powerWatts) : null,
        power_type: powerType,
        manual_url: manualUrl,
        image_urls: imageUrls || [],
        description,
        verified: verified || false,
        confidence_score: confidenceScore ? parseFloat(confidenceScore) : 0.0,
        source_url: sourceUrl,
        extraction_method: extractionMethod
      })
      .eq('id', id)
      .select(`
        *,
        device_categories!inner(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!updatedDevice) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDevice
    });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices/[id] - Delete a device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
