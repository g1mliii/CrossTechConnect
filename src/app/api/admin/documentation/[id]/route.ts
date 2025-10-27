// API Route: /api/admin/documentation/[id]
// Delete documentation

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

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id } = params;

    const { error } = await supabase
      .from('device_documentation')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting documentation:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete documentation'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documentation deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/documentation/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
