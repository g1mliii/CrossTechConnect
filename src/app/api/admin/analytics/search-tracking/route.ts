/**
 * API endpoint for search tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cache, createCacheKey } from '@/lib/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/analytics/search-tracking - Track a search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, filters, resultsCount, categoryId } = body;

    const { data, error } = await supabase
      .from('search_tracking')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId || null,
        query,
        filters: filters || null,
        result_count: resultsCount || 0,
        category_id: categoryId || null,
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
    cache.delete(createCacheKey('search-tracking', { timeRange: '30d', categoryId: 'all' }));

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error tracking search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/analytics/search-tracking - Get search analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const categoryId = searchParams.get('categoryId');

    // Check cache first (3 minute TTL)
    const cacheKey = createCacheKey('search-tracking', { timeRange, categoryId: categoryId || 'all' });
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
      .from('search_tracking')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000); // Limit to 1000 most recent searches

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate statistics
    const totalSearches = data?.length || 0;
    const avgResultsCount = data && data.length > 0
      ? data.reduce((sum, s) => sum + (s.result_count || 0), 0) / data.length
      : 0;

    // Group by category
    const categoryStats = data?.reduce((acc: any, search: any) => {
      const catId = search.category_id || 'uncategorized';
      if (!acc[catId]) {
        acc[catId] = { count: 0, totalResults: 0 };
      }
      acc[catId].count++;
      acc[catId].totalResults += search.result_count || 0;
      return acc;
    }, {});

    // Top queries
    const queryStats = data?.reduce((acc: any, search: any) => {
      const q = search.query.toLowerCase();
      if (!acc[q]) {
        acc[q] = 0;
      }
      acc[q]++;
      return acc;
    }, {});

    const topQueries = Object.entries(queryStats || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const result = {
      totalSearches,
      avgResultsCount,
      categoryStats,
      topQueries,
      recentSearches: data?.slice(0, 20) || []
    };

    // Cache for 3 minutes
    cache.set(cacheKey, result, 180);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching search analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch search analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
