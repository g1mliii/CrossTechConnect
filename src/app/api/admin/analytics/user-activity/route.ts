/**
 * API endpoint for user activity tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cache, createCacheKey } from '@/lib/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/analytics/user-activity - Track user activity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, activityType, entityType, entityId, metadata } = body;

    // Get IP and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId || null,
        action: activityType,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate relevant caches
    cache.delete(createCacheKey('analytics', { timeRange: '7d' }));
    cache.delete(createCacheKey('analytics', { timeRange: '30d' }));
    cache.delete(createCacheKey('analytics', { timeRange: '90d' }));
    cache.delete(createCacheKey('analytics', { timeRange: '1y' }));
    cache.delete(createCacheKey('user-activity', { timeRange: '30d', activityType: 'all', userId: 'all' }));

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error tracking user activity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track user activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/analytics/user-activity - Get user activity analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const activityType = searchParams.get('activityType');
    const userId = searchParams.get('userId');

    // Check cache first (3 minute TTL)
    const cacheKey = createCacheKey('user-activity', { 
      timeRange, 
      activityType: activityType || 'all',
      userId: userId || 'all'
    });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('user_activity')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000); // Limit to 1000 most recent activities

    if (activityType) {
      query = query.eq('action', activityType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate statistics
    const totalActivities = data?.length || 0;
    const uniqueUsers = new Set(data?.map(a => a.user_id).filter(Boolean)).size;

    // Group by activity type
    const activityTypeStats = data?.reduce((acc: any, activity: any) => {
      const type = activity.action;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    // Group by entity type
    const entityTypeStats = data?.reduce((acc: any, activity: any) => {
      const type = activity.entity_type || 'none';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    // Activity timeline (group by day)
    const timeline = data?.reduce((acc: any, activity: any) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    const result = {
      totalActivities,
      uniqueUsers,
      activityTypeStats,
      entityTypeStats,
      timeline,
      recentActivities: data?.slice(0, 50) || []
    };

    // Cache for 3 minutes
    cache.set(cacheKey, result, 180);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching user activity analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user activity analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
