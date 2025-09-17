import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/redis';
import { withAuth, AuthenticatedRequest, withErrorHandling } from '@/lib/middleware';

async function logoutHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      },
      { status: 405 }
    );
  }

  try {
    const userId = req.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: 'User not authenticated',
          code: 'AUTH_REQUIRED',
          message: 'User must be authenticated to logout'
        },
        { status: 401 }
      );
    }

    // Delete session from Redis
    await SessionManager.deleteSession(userId);

    // Delete refresh token from Redis
    await SessionManager.deleteRefreshToken(userId);

    return NextResponse.json(
      {
        message: 'Logout successful'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    throw error; // Let withErrorHandling handle it
  }
}

export const POST = withErrorHandling(withAuth(logoutHandler));