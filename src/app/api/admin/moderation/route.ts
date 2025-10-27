// API Route: /api/admin/moderation
// Get moderation queue

import { NextRequest, NextResponse } from 'next/server';
import { getModerationQueue } from '@/lib/services/content-moderation-service';
import type { ModerationStatus } from '@/types/documentation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ModerationStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const queue = await getModerationQueue(status || undefined, limit);

    // Get total count
    let countQuery = supabase
      .from('content_moderation_queue')
      .select('id', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: queue,
      total: count || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/moderation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch moderation queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
