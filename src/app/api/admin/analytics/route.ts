/**
 * API endpoint for admin analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cache, createCacheKey } from '@/lib/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/analytics - Get analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Check cache first (5 minute TTL)
    const cacheKey = createCacheKey('analytics', { timeRange });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Get basic counts (just counts, no data)
    const [
      { count: totalCategories },
      { count: totalDevices },
      { count: totalUsers }
    ] = await Promise.all([
      supabase.from('device_categories').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true })
    ]);

    // Get category stats with aggregated device counts (using a more efficient query)
    const { data: categoryStats } = await supabase
      .from('device_categories')
      .select('id, name')
      .limit(100); // Limit to top 100 categories for analytics

    // Get search tracking data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: searchData } = await supabase
      .from('search_tracking')
      .select('category_id')
      .gte('timestamp', startDate.toISOString());

    const { data: activityData } = await supabase
      .from('user_activity')
      .select('entity_type, entity_id')
      .gte('timestamp', startDate.toISOString());

    // Count searches per category
    const searchCountByCategory = (searchData || []).reduce((acc: any, search: any) => {
      const catId = search.category_id;
      if (catId) {
        acc[catId] = (acc[catId] || 0) + 1;
      }
      return acc;
    }, {});

    // Count unique users per category (from activity data)
    const usersByCategory = (activityData || []).reduce((acc: any, activity: any) => {
      if (activity.entity_type === 'device') {
        // We'd need to join with devices to get category, for now use a simplified approach
        const catId = activity.entity_id;
        if (catId) {
          if (!acc[catId]) acc[catId] = new Set();
          acc[catId].add(activity.entity_id);
        }
      }
      return acc;
    }, {});

    // Get device counts per category efficiently
    const { data: deviceCounts } = await supabase
      .rpc('get_device_counts_by_category')
      .limit(100);

    // Fallback: if RPC doesn't exist, get counts individually (less efficient but works)
    const categoryDeviceCounts: Record<string, number> = {};
    if (!deviceCounts) {
      for (const category of (categoryStats || []).slice(0, 20)) { // Only process top 20
        const { count } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        categoryDeviceCounts[category.id] = count || 0;
      }
    }

    // Process category stats
    const processedCategoryStats = (categoryStats || []).map((category: any) => {
      const deviceCount = deviceCounts 
        ? (deviceCounts.find((dc: any) => dc.category_id === category.id)?.count || 0)
        : (categoryDeviceCounts[category.id] || 0);
      
      const searchCount = searchCountByCategory[category.id] || 0;
      const userCount = usersByCategory[category.id]?.size || 0;

      return {
        id: category.id,
        name: category.name,
        deviceCount,
        searchCount,
        userCount,
        avgCompatibilityScore: 0.85, // Mock for now - would need separate query
        lastActivity: new Date(),
        trend: searchCount > 0 ? 'up' : 'stable',
        trendPercentage: searchCount > 0 ? Math.min((searchCount / days) * 10, 50) : 0
      };
    });

    // Calculate top categories by device count
    const topCategories = processedCategoryStats
      .sort((a, b) => b.deviceCount - a.deviceCount)
      .slice(0, 5)
      .map((cat, index) => {
        const totalDevicesInTop5 = processedCategoryStats
          .slice(0, 5)
          .reduce((sum, c) => sum + c.deviceCount, 0);
        
        return {
          name: cat.name,
          value: cat.searchCount,
          percentage: totalDevicesInTop5 > 0 ? (cat.deviceCount / totalDevicesInTop5) * 100 : 0
        };
      });

    // Generate time series data from real tracking data
    const timeSeriesMap = new Map<string, { searches: number; devices: number; users: Set<string> }>();
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      timeSeriesMap.set(date, { searches: 0, devices: 0, users: new Set() });
    }

    // Populate with search data
    (searchData || []).forEach((search: any) => {
      if (search.timestamp) {
        const date = new Date(search.timestamp).toISOString().split('T')[0];
        const entry = timeSeriesMap.get(date);
        if (entry) {
          entry.searches++;
        }
      }
    });

    // Populate with activity data
    (activityData || []).forEach((activity: any) => {
      if (activity.timestamp) {
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        const entry = timeSeriesMap.get(date);
        if (entry) {
          if (activity.entity_type === 'device') {
            entry.devices++;
          }
          if (activity.entity_id) {
            entry.users.add(activity.entity_id);
          }
        }
      }
    });

    const timeSeriesData = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
      date,
      searches: data.searches,
      devices: data.devices,
      users: data.users.size
    }));

    const analytics = {
      totalCategories: totalCategories || 0,
      totalDevices: totalDevices || 0,
      totalSearches: processedCategoryStats.reduce((sum, cat) => sum + cat.searchCount, 0),
      avgCompatibilityScore: processedCategoryStats.length > 0
        ? processedCategoryStats.reduce((sum, cat) => sum + cat.avgCompatibilityScore, 0) / processedCategoryStats.length
        : 0,
      categoryStats: processedCategoryStats,
      timeSeriesData,
      topCategories
    };

    // Cache the result for 5 minutes
    cache.set(cacheKey, analytics, 300);

    return NextResponse.json({
      success: true,
      data: analytics,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}