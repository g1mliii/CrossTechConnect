// API Route: /api/documentation
// Handles documentation listing and creation

import { NextRequest, NextResponse } from 'next/server';
import {
  createDocumentation,
  searchDocumentation,
  getDocumentationCount
} from '@/lib/services/documentation-service';
import type { DocumentationSearchFilters } from '@/types/documentation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: DocumentationSearchFilters = {
      deviceId: searchParams.get('deviceId') || undefined,
      contentType: searchParams.get('contentType')?.split(',') as any,
      sourceType: searchParams.get('sourceType')?.split(',') as any,
      verified: searchParams.get('verified') === 'true' ? true : 
                searchParams.get('verified') === 'false' ? false : undefined,
      minConfidence: searchParams.get('minConfidence') 
        ? parseFloat(searchParams.get('minConfidence')!) 
        : undefined,
      tags: searchParams.get('tags')?.split(','),
      searchQuery: searchParams.get('q') || undefined
    };

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const documentation = await searchDocumentation(filters, limit, offset);

    // Get total count for pagination
    const total = await getDocumentationCount(filters);

    return NextResponse.json({
      success: true,
      data: documentation,
      count: documentation.length,
      total
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/documentation:', error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      deviceId,
      title,
      contentType,
      content,
      summary,
      sourceType,
      sourceUrl,
      originalFileUrl,
      extractionMethod,
      confidenceScore,
      createdById,
      tags
    } = body;

    // Validation
    if (!deviceId || !title || !contentType || !content || !sourceType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: deviceId, title, contentType, content, sourceType'
        },
        { status: 400 }
      );
    }

    const documentation = await createDocumentation({
      deviceId,
      title,
      contentType,
      content,
      summary,
      sourceType,
      sourceUrl,
      originalFileUrl,
      extractionMethod,
      confidenceScore,
      createdById,
      tags
    });

    if (!documentation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create documentation'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documentation
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
