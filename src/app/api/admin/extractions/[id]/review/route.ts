// API Route: /api/admin/extractions/[id]/review
// Review extraction

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!['approved', 'rejected', 'needs_review'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status'
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('documentation_extractions')
      .update({
        review_status: status,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error reviewing extraction:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to review extraction'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Extraction reviewed successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/extractions/[id]/review:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to review extraction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
