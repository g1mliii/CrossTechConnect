/**
 * API endpoints for device compatibility checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { compatibilityEngine } from '@/lib/schema/compatibility';
import { handlePrismaError } from '@/lib/database';

/**
 * POST /api/compatibility - Check compatibility between two devices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceDeviceId, targetDeviceId, context } = body;

    if (!sourceDeviceId || !targetDeviceId) {
      return NextResponse.json(
        { success: false, error: 'Both sourceDeviceId and targetDeviceId are required' },
        { status: 400 }
      );
    }

    const compatibilityResult = await compatibilityEngine.checkCompatibility(
      sourceDeviceId,
      targetDeviceId,
      context
    );

    return NextResponse.json({
      success: true,
      data: compatibilityResult
    });

  } catch (error) {
    console.error('Error checking compatibility:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check compatibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/compatibility - Get cached compatibility results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceDeviceId = searchParams.get('sourceDeviceId');
    const targetDeviceId = searchParams.get('targetDeviceId');

    if (!sourceDeviceId || !targetDeviceId) {
      return NextResponse.json(
        { success: false, error: 'Both sourceDeviceId and targetDeviceId are required' },
        { status: 400 }
      );
    }

    // This would query the compatibility_results table for cached results
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      data: null,
      message: 'No cached compatibility result found'
    });

  } catch (error) {
    console.error('Error fetching compatibility results:', error);
    handlePrismaError(error);
  }
}