/**
 * API endpoints for compatibility rules management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CompatibilityRule {
  id?: string;
  name: string;
  description: string;
  sourceCategoryId: string;
  targetCategoryId: string;
  sourceField: string;
  targetField: string;
  condition: string;
  compatibilityType: 'full' | 'partial' | 'none';
  message: string;
  limitations: string[];
  recommendations: string[];
}

/**
 * GET /api/compatibility/rules - Get all compatibility rules with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const sourceCategory = searchParams.get('sourceCategory');
    const targetCategory = searchParams.get('targetCategory');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('category_compatibility_rules')
      .select(`
        *,
        source_category:device_categories!source_category_id(id, name),
        target_category:device_categories!target_category_id(id, name)
      `, { count: 'exact' });

    if (categoryId) {
      query = query.or(`source_category_id.eq.${categoryId},target_category_id.eq.${categoryId}`);
    }

    if (sourceCategory) {
      query = query.eq('source_category_id', sourceCategory);
    }

    if (targetCategory) {
      query = query.eq('target_category_id', targetCategory);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform the data to match our interface
    const rules = data?.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      sourceCategoryId: rule.source_category_id,
      targetCategoryId: rule.target_category_id,
      sourceField: rule.source_field,
      targetField: rule.target_field,
      condition: rule.condition,
      compatibilityType: rule.compatibility_type,
      message: rule.message,
      limitations: rule.limitations || [],
      recommendations: rule.recommendations || [],
      sourceCategory: rule.source_category,
      targetCategory: rule.target_category,
      createdAt: rule.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: rules,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching compatibility rules:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch compatibility rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compatibility/rules - Create a new compatibility rule
 */
export async function POST(request: NextRequest) {
  try {
    const body: CompatibilityRule = await request.json();

    // Validate required fields
    const requiredFields = [
      'name', 'sourceCategoryId', 'targetCategoryId', 
      'sourceField', 'targetField', 'condition', 'message'
    ];
    
    for (const field of requiredFields) {
      if (!body[field as keyof CompatibilityRule]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate compatibility type
    if (!['full', 'partial', 'none'].includes(body.compatibilityType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid compatibility type' },
        { status: 400 }
      );
    }

    // Check if categories exist
    const { data: sourceCategory } = await supabase
      .from('device_categories')
      .select('id')
      .eq('id', body.sourceCategoryId)
      .single();

    const { data: targetCategory } = await supabase
      .from('device_categories')
      .select('id')
      .eq('id', body.targetCategoryId)
      .single();

    if (!sourceCategory || !targetCategory) {
      return NextResponse.json(
        { success: false, error: 'One or both categories do not exist' },
        { status: 400 }
      );
    }

    // Create the rule
    const { data, error } = await supabase
      .from('category_compatibility_rules')
      .insert({
        name: body.name,
        description: body.description,
        source_category_id: body.sourceCategoryId,
        target_category_id: body.targetCategoryId,
        source_field: body.sourceField,
        target_field: body.targetField,
        condition: body.condition,
        compatibility_type: body.compatibilityType,
        message: body.message,
        limitations: body.limitations || [],
        recommendations: body.recommendations || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating compatibility rule:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create compatibility rule',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        sourceCategoryId: data.source_category_id,
        targetCategoryId: data.target_category_id,
        sourceField: data.source_field,
        targetField: data.target_field,
        condition: data.condition,
        compatibilityType: data.compatibility_type,
        message: data.message,
        limitations: data.limitations || [],
        recommendations: data.recommendations || [],
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Error creating compatibility rule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create compatibility rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/compatibility/rules - Update an existing compatibility rule
 */
export async function PUT(request: NextRequest) {
  try {
    const body: CompatibilityRule = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required for updates' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'name', 'sourceCategoryId', 'targetCategoryId', 
      'sourceField', 'targetField', 'condition', 'message'
    ];
    
    for (const field of requiredFields) {
      if (!body[field as keyof CompatibilityRule]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Update the rule
    const { data, error } = await supabase
      .from('category_compatibility_rules')
      .update({
        name: body.name,
        description: body.description,
        source_category_id: body.sourceCategoryId,
        target_category_id: body.targetCategoryId,
        source_field: body.sourceField,
        target_field: body.targetField,
        condition: body.condition,
        compatibility_type: body.compatibilityType,
        message: body.message,
        limitations: body.limitations || [],
        recommendations: body.recommendations || []
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating compatibility rule:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update compatibility rule',
          details: error.message
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Compatibility rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        sourceCategoryId: data.source_category_id,
        targetCategoryId: data.target_category_id,
        sourceField: data.source_field,
        targetField: data.target_field,
        condition: data.condition,
        compatibilityType: data.compatibility_type,
        message: data.message,
        limitations: data.limitations || [],
        recommendations: data.recommendations || [],
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Error updating compatibility rule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update compatibility rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}