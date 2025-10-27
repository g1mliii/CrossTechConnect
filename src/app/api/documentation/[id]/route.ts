// API Route: /api/documentation/[id]
// Handles individual documentation operations

import { NextRequest, NextResponse } from 'next/server';
import { getDocumentationById } from '@/lib/services/documentation-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id } = params;

    const incrementView = request.nextUrl.searchParams.get('incrementView') !== 'false';

    const documentation = await getDocumentationById(id, incrementView);

    if (!documentation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Documentation not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documentation
    });
  } catch (error) {
    console.error('Error in GET /api/documentation/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
