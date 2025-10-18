/**
 * API endpoint for saved searches
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/saved-searches - Get user's saved searches
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // For now, return empty array since we don't have a saved_searches table yet
    // This would be implemented when user authentication is fully set up
    return NextResponse.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saved searches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-searches - Save a search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, query, filters } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'userId and name are required' },
        { status: 400 }
      );
    }

    // For now, return success without saving to database
    // This would be implemented when user authentication is fully set up
    // and a saved_searches table is created
    
    return NextResponse.json({
      success: true,
      data: {
        id: Date.now().toString(),
        userId,
        name,
        query,
        filters,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved-searches/[id] - Delete a saved search
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    // For now, return success without deleting from database
    // This would be implemented when user authentication is fully set up
    
    return NextResponse.json({
      success: true,
      message: 'Search deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete saved search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
