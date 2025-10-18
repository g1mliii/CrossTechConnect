/**
 * API endpoints for device categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/categories - Get all device categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeDeviceCount = searchParams.get('includeDeviceCount') === 'true';

    // Check cache first (5 minute TTL)
    const { cache, createCacheKey } = await import('@/lib/cache');
    const cacheKey = createCacheKey('categories', {
      parentId: parentId || 'all',
      includeDeviceCount: includeDeviceCount.toString()
    });
    const cachedData = cache.get<{ data: any[]; count: number }>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        count: cachedData.count,
        cached: true
      });
    }

    let query = supabase
      .from('device_categories')
      .select('*');

    if (parentId !== null) {
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
    }

    const { data: categories, error } = await query.order('name');

    if (error) {
      throw error;
    }

    // Get device counts if requested
    let categoriesWithStats = categories || [];

    if (includeDeviceCount) {
      // Use the efficient Postgres function to get all counts in one query
      const { data: deviceCounts } = await supabase
        .rpc('get_device_counts_by_category');

      // Map counts to categories
      const countMap = new Map(
        (deviceCounts || []).map((dc: any) => [dc.category_id, dc.count])
      );

      categoriesWithStats = categoriesWithStats.map(cat => ({
        ...cat,
        deviceCount: countMap.get(cat.id) || 0
      }));
    } else {
      categoriesWithStats = categoriesWithStats.map(cat => ({
        ...cat,
        deviceCount: 0
      }));
    }

    const result = {
      data: categoriesWithStats,
      count: categoriesWithStats.length
    };

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Create a new device category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parentId, attributes } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const { data: newCategory, error } = await supabase
      .from('device_categories')
      .insert({
        name,
        parent_id: parentId || null,
        attributes: attributes || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Invalidate caches since new category was created
    const { invalidateAnalyticsCache, cache, createCacheKey } = await import('@/lib/cache');
    invalidateAnalyticsCache();
    // Invalidate all category list caches
    cache.delete(createCacheKey('categories', { parentId: 'all', includeDeviceCount: 'true' }));
    cache.delete(createCacheKey('categories', { parentId: 'all', includeDeviceCount: 'false' }));

    return NextResponse.json({
      success: true,
      data: {
        ...newCategory,
        deviceCount: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}