// API Route: /api/admin/extractions
// Get extraction queue

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get data with pagination
    let query = supabase
      .from('documentation_extractions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('review_status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching extractions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch extractions'
        },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('documentation_extractions')
      .select('id', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('review_status', status);
    }

    const { count } = await countQuery;

    // Transform snake_case to camelCase
    const transformedData = data.map(item => ({
      id: item.id,
      documentationId: item.documentation_id,
      deviceId: item.device_id,
      categoryId: item.category_id,
      schemaVersion: item.schema_version,
      extractedFields: item.extracted_fields,
      fieldConfidence: item.field_confidence,
      missingFields: item.missing_fields,
      validationErrors: item.validation_errors,
      aiModel: item.ai_model,
      processingTime: item.processing_time,
      reviewStatus: item.review_status,
      createdAt: item.created_at
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: count || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/extractions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch extractions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
