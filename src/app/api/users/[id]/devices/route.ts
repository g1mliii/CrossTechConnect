/**
 * API endpoints for user device library management
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
 * GET /api/users/[id]/devices - Get user's device library
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: userId } = params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('user_devices')
      .select(`
        id,
        nickname,
        notes,
        purchase_date,
        added_at,
        device:devices(
          id,
          name,
          brand,
          model,
          width_cm,
          height_cm,
          depth_cm,
          weight_kg,
          power_watts,
          image_urls,
          verified,
          confidence_score,
          category:device_categories(id, name)
        ),
        specifications:device_specifications(
          specifications,
          confidence_scores
        )
      `)
      .eq('user_id', userId);

    if (categoryId) {
      query = query.eq('device.category_id', categoryId);
    }

    query = query
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data
    const userDevices = data?.map((item: any) => {
      const device = Array.isArray(item.device) ? item.device[0] : item.device;
      const category = Array.isArray(device?.category) ? device.category[0] : device?.category;
      const specs = Array.isArray(item.specifications) ? item.specifications[0] : item.specifications;
      
      return {
        id: item.id,
        nickname: item.nickname,
        notes: item.notes,
        purchaseDate: item.purchase_date,
        addedAt: item.added_at,
        device: device ? {
          id: device.id,
          name: device.name,
          brand: device.brand,
          model: device.model,
          widthCm: device.width_cm,
          heightCm: device.height_cm,
          depthCm: device.depth_cm,
          weightKg: device.weight_kg,
          powerWatts: device.power_watts,
          imageUrls: device.image_urls || [],
          verified: device.verified,
          confidenceScore: device.confidence_score,
          category: category || { id: '', name: '' }
        } : null,
        specifications: specs?.specifications || {}
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: userDevices
    });

  } catch (error) {
    console.error('Error fetching user devices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user devices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/devices - Add device to user's library
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: userId } = params;
    const body = await request.json();
    const { deviceId, nickname, notes, purchaseDate } = body;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'deviceId is required' },
        { status: 400 }
      );
    }

    // Check if device exists
    const { data: deviceExists } = await supabase
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .single();

    if (!deviceExists) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Check if user already has this device
    const { data: existingUserDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    if (existingUserDevice) {
      return NextResponse.json(
        { success: false, error: 'Device already in user library' },
        { status: 400 }
      );
    }

    // Add device to user library
    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_id: deviceId,
        nickname,
        notes,
        purchase_date: purchaseDate
      })
      .select(`
        id,
        nickname,
        notes,
        purchase_date,
        added_at,
        device:devices(
          id,
          name,
          brand,
          model,
          width_cm,
          height_cm,
          depth_cm,
          weight_kg,
          power_watts,
          image_urls,
          verified,
          confidence_score,
          category:device_categories(id, name)
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    const deviceData = Array.isArray(data.device) ? data.device[0] : data.device;
    const categoryData = Array.isArray(deviceData?.category) ? deviceData.category[0] : deviceData?.category;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        nickname: data.nickname,
        notes: data.notes,
        purchaseDate: data.purchase_date,
        addedAt: data.added_at,
        device: deviceData ? {
          id: deviceData.id,
          name: deviceData.name,
          brand: deviceData.brand,
          model: deviceData.model,
          widthCm: deviceData.width_cm,
          heightCm: deviceData.height_cm,
          depthCm: deviceData.depth_cm,
          weightKg: deviceData.weight_kg,
          powerWatts: deviceData.power_watts,
          imageUrls: deviceData.image_urls || [],
          verified: deviceData.verified,
          confidenceScore: deviceData.confidence_score,
          category: categoryData || { id: '', name: '' }
        } : null
      }
    });

  } catch (error) {
    console.error('Error adding device to user library:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add device to user library',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}