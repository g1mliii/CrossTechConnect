// API Route: /api/admin/moderation/stats
// Get moderation statistics

import { NextRequest, NextResponse } from 'next/server';
import { getModerationStats } from '@/lib/services/content-moderation-service';

export async function GET(request: NextRequest) {
  try {
    const stats = await getModerationStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/admin/moderation/stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch moderation stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
