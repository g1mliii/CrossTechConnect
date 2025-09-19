/**
 * API endpoints for devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/devices - Get all devices with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('devices')
      .select(`
        *,
        device_categories!inner(id, name),
        device_standards(
          id, port_count, notes, verified,
          standards(id, name, category, version)
        )
      `);
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (verified !== null) {
      query = query.eq('verified', verified === 'true');
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    const [devicesResult, countResult] = await Promise.all([
      query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq(categoryId ? 'category_id' : 'id', categoryId || 'dummy')
        .eq(verified !== null ? 'verified' : 'id', verified === 'true' ? true : 'dummy')
    ]);

    if (devicesResult.error) {
      throw devicesResult.error;
    }

    const devices = devicesResult.data || [];
    const totalCount = countResult.count || 0;

    return NextResponse.json({
      success: true,
      data: devices,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch devices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices - Create a new device
 */
export async function POST(request: NextRequest) {
  try {
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
      extractionMethod,
      createdById
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

    const { data: newDevice, error } = await supabase
      .from('devices')
      .insert({
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
        extraction_method: extractionMethod,
        created_by: createdById
      })
      .select(`
        *,
        device_categories!inner(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: newDevice
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}