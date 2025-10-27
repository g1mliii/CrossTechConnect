/**
 * API endpoints for verification items management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/verification/items - Get verification items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const deviceId = searchParams.get('deviceId');
    const filter = searchParams.get('filter') || 'pending';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('verification_items')
      .select(`
        *,
        device:devices(
          id,
          name,
          brand,
          model,
          category:device_categories(id, name)
        ),
        votes:verification_votes(
          id,
          user_id,
          vote,
          suggested_value,
          comment,
          created_at,
          user:users(display_name, reputation_score)
        )
      `);

    // Apply filters
    if (categoryId) {
      query = query.eq('device.category_id', categoryId);
    }

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    switch (filter) {
      case 'pending':
        query = query.eq('status', 'pending');
        break;
      case 'high_confidence':
        query = query.gte('confidence_score', 0.8);
        break;
      case 'low_confidence':
        query = query.lt('confidence_score', 0.6);
        break;
      // 'all' - no additional filter
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'confidence':
        query = query.order('confidence_score', { ascending: false });
        break;
      case 'priority':
        // Priority based on confidence score (lower = higher priority) and creation date
        query = query.order('confidence_score', { ascending: true })
                    .order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data
    const items = data?.map(item => ({
      id: item.id,
      deviceId: item.device_id,
      fieldName: item.field_name,
      currentValue: item.current_value,
      proposedValue: item.proposed_value,
      sourceType: item.source_type,
      confidenceScore: item.confidence_score,
      status: item.status,
      createdAt: item.created_at,
      device: item.device,
      votes: item.votes?.map((vote: any) => ({
        id: vote.id,
        userId: vote.user_id,
        vote: vote.vote,
        suggestedValue: vote.suggested_value,
        comment: vote.comment,
        createdAt: vote.created_at,
        user: {
          displayName: vote.user?.display_name || 'Unknown User',
          reputationScore: vote.user?.reputation_score || 0
        }
      })) || []
    })) || [];

    return NextResponse.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error fetching verification items:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch verification items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verification/items - Create a new verification item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, fieldName, currentValue, proposedValue, sourceType, confidenceScore } = body;

    // Validate required fields
    if (!deviceId || !fieldName || proposedValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'deviceId, fieldName, and proposedValue are required' },
        { status: 400 }
      );
    }

    // Check if device exists
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .single();

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Create verification item
    const { data, error } = await supabase
      .from('verification_items')
      .insert({
        device_id: deviceId,
        field_name: fieldName,
        current_value: currentValue,
        proposed_value: proposedValue,
        source_type: sourceType || 'user_submission',
        confidence_score: confidenceScore || 0.5,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        deviceId: data.device_id,
        fieldName: data.field_name,
        currentValue: data.current_value,
        proposedValue: data.proposed_value,
        sourceType: data.source_type,
        confidenceScore: data.confidence_score,
        status: data.status,
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Error creating verification item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create verification item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}