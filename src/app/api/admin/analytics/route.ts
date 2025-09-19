/**
 * API endpoint for admin analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get basic counts
    const [
      { count: totalCategories },
      { count: totalDevices },
      { count: totalUsers },
      { data: categoryStats }
    ] = await Promise.all([
      supabase.from('device_categories').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('device_categories')
        .select(`
          id,
          name,
          devices!inner(id, verified, confidence_score, created_at)
        `)
    ]);

    // Process category stats
    const processedCategoryStats = (categoryStats || []).map((category: any) => {
      const devices = category.devices || [];
      const verifiedDevices = devices.filter((d: any) => d.verified);
      const avgConfidence = devices.length > 0 
        ? devices.reduce((sum: number, d: any) => sum + (parseFloat(d.confidence_score) || 0), 0) / devices.length
        : 0;

      return {
        id: category.id,
        name: category.name,
        deviceCount: devices.length,
        searchCount: Math.floor(Math.random() * 1000) + 100, // Mock search data for now
        userCount: Math.floor(Math.random() * 50) + 10, // Mock user data for now
        avgCompatibilityScore: avgConfidence,
        lastActivity: devices.length > 0 
          ? new Date(Math.max(...devices.map((d: any) => new Date(d.created_at).getTime())))
          : new Date(),
        trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable'),
        trendPercentage: (Math.random() - 0.5) * 20 // Random trend between -10% and +10%
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

    // Generate time series data (mock for now)
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const timeSeriesData = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      searches: Math.floor(Math.random() * 200) + 100,
      devices: Math.floor(Math.random() * 5) + 1,
      users: Math.floor(Math.random() * 20) + 5
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

    return NextResponse.json({
      success: true,
      data: analytics
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