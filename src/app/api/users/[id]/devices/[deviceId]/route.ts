/**
 * API endpoints for individual user device management
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
    deviceId: string;
  }>;
}

/**
 * GET /api/users/[id]/devices/[deviceId] - Get specific user device
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: userId, deviceId } = params;

    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .eq('id', deviceId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'User device not found' },
        { status: 404 }
      );
    }

    const device = Array.isArray(data.device) ? data.device[0] : data.device;
    const category = Array.isArray(device?.category) ? device.category[0] : device?.category;
    const specs = Array.isArray(data.specifications) ? data.specifications[0] : data.specifications;

    const userDevice = {
      id: data.id,
      nickname: data.nickname,
      notes: data.notes,
      purchaseDate: data.purchase_date,
      addedAt: data.added_at,
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

    return NextResponse.json({
      success: true,
      data: userDevice
    });

  } catch (error) {
    console.error('Error fetching user device:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]/devices/[deviceId] - Update user device
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: userId, deviceId } = params;
    const body = await request.json();
    const { nickname, notes, purchaseDate } = body;

    // Check if user device exists
    const { data: existingUserDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('id', deviceId)
      .single();

    if (!existingUserDevice) {
      return NextResponse.json(
        { success: false, error: 'User device not found' },
        { status: 404 }
      );
    }

    // Update user device
    const { data, error } = await supabase
      .from('user_devices')
      .update({
        nickname,
        notes,
        purchase_date: purchaseDate
      })
      .eq('user_id', userId)
      .eq('id', deviceId)
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

    const device = Array.isArray(data.device) ? data.device[0] : data.device;
    const category = Array.isArray(device?.category) ? device.category[0] : device?.category;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        nickname: data.nickname,
        notes: data.notes,
        purchaseDate: data.purchase_date,
        addedAt: data.added_at,
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
        } : null
      }
    });

  } catch (error) {
    console.error('Error updating user device:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/devices/[deviceId] - Remove device from user library
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: userId, deviceId } = params;

    // Check if user device exists
    const { data: existingUserDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('id', deviceId)
      .single();

    if (!existingUserDevice) {
      return NextResponse.json(
        { success: false, error: 'User device not found' },
        { status: 404 }
      );
    }

    // Delete user device
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('user_id', userId)
      .eq('id', deviceId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Device removed from library'
    });

  } catch (error) {
    console.error('Error removing user device:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove user device',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}