// API Route: /api/documentation/extract
// Handles schema-aware AI extraction from documents

import { NextRequest, NextResponse } from 'next/server';
import { extractSpecificationsFromDocument } from '@/lib/ai/schema-aware-extraction';
import type { ExtractionRequest } from '@/types/documentation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      documentUrl,
      deviceId,
      categoryId,
      schemaVersion,
      extractionMethod,
      aiModel
    } = body;

    // Validation
    if (!documentUrl || !deviceId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: documentUrl, deviceId, categoryId'
        },
        { status: 400 }
      );
    }

    const extractionRequest: ExtractionRequest = {
      documentUrl,
      deviceId,
      categoryId,
      schemaVersion: schemaVersion || 'latest',
      extractionMethod: extractionMethod || 'ai_pdf',
      aiModel
    };

    const result = await extractSpecificationsFromDocument(extractionRequest);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in POST /api/documentation/extract:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract specifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
