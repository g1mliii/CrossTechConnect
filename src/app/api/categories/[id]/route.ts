/**
 * API endpoints for individual category operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/categories/[id] - Get a single category
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const { data: category, error } = await supabase
      .from('device_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get device count
    const { count } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        deviceCount: count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id] - Update a category
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { name, parentId, attributes } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const { data: updatedCategory, error } = await supabase
      .from('device_categories')
      .update({
        name,
        parent_id: parentId || null,
        attributes: attributes || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get device count
    const { count } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCategory,
        deviceCount: count || 0
      }
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id] - Delete a category
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Check if category has devices
    const { count } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${count} device(s). Please reassign or delete devices first.`
        },
        { status: 400 }
      );
    }

    // Check if category has children
    const { count: childCount } = await supabase
      .from('device_categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (childCount && childCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${childCount} subcategory(ies). Please delete subcategories first.`
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('device_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
