// API Route: /api/admin/moderation/[id]
// Moderate content

import { NextRequest, NextResponse } from 'next/server';
import { moderateContent } from '@/lib/services/content-moderation-service';
import type { ModerationStatus } from '@/types/documentation';

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
    const { status, notes } = body;

    // TODO: Get actual moderator ID from session
    const moderatorId = 'admin-user-id';

    const success = await moderateContent(id, moderatorId, status as ModerationStatus, notes);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to moderate content'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content moderated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/moderation/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to moderate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
