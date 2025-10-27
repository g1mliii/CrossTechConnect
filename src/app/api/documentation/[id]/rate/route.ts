// API Route: /api/documentation/[id]/rate
// Handles documentation rating

import { NextRequest, NextResponse } from 'next/server';
import { rateDocumentation } from '@/lib/services/documentation-service';

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

    const { userId, rating, comment } = body;

    // Validation
    if (!userId || !rating) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, rating'
        },
        { status: 400 }
      );
    }

    if (rating !== 'helpful' && rating !== 'not_helpful') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rating value. Must be "helpful" or "not_helpful"'
        },
        { status: 400 }
      );
    }

    const success = await rateDocumentation(id, userId, rating, comment);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to rate documentation'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/documentation/[id]/rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rate documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
