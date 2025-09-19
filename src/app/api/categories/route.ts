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
      const deviceCounts = await Promise.all(
        categoriesWithStats.map(async (category) => {
          const { count } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          return {
            ...category,
            deviceCount: count || 0
          };
        })
      );
      categoriesWithStats = deviceCounts;
    } else {
      categoriesWithStats = categoriesWithStats.map(cat => ({
        ...cat,
        deviceCount: 0
      }));
    }

    return NextResponse.json({
      success: true,
      data: categoriesWithStats,
      count: categoriesWithStats.length
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