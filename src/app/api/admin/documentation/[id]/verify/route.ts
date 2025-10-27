// API Route: /api/admin/documentation/[id]/verify
// Verify documentation

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

    const { error } = await supabase
      .from('device_documentation')
      .update({ verified: true })
      .eq('id', id);

    if (error) {
      console.error('Error verifying documentation:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify documentation'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documentation verified successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/documentation/[id]/verify:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
