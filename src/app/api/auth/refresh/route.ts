import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, generateTokens, JWTPayload } from '@/lib/auth';
import { SessionManager } from '@/lib/redis';
import { withErrorHandling } from '@/lib/middleware';

interface RefreshRequest {
  refreshToken: string;
}

async function refreshHandler(req: NextRequest): Promise<NextResponse> {
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
    const body: RefreshRequest = await req.json();
    const { refreshToken } = body;

    // Validate required fields
    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Missing refresh token',
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        },
        { status: 400 }
      );
    }

    // Verify refresh token
    let payload: JWTPayload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid refresh token',
          code: 'INVALID_TOKEN',
          message: error instanceof Error ? error.message : 'Token verification failed'
        },
        { status: 401 }
      );
    }

    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      return NextResponse.json(
        {
          error: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE',
          message: 'Refresh token required'
        },
        { status: 401 }
      );
    }

    // Verify refresh token in Redis
    const crypto = await import('crypto');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const isValidRefreshToken = await SessionManager.verifyRefreshToken(payload.userId, refreshTokenHash);

    if (!isValidRefreshToken) {
      return NextResponse.json(
        {
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is not valid or has been revoked'
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        reputationScore: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'User associated with token does not exist'
        },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newTokens = generateTokens(user);

    // Update session in Redis
    await SessionManager.storeSession(user.id, {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      reputationScore: user.reputationScore,
      refreshTime: Date.now()
    });

    // Store new refresh token hash and remove old one
    await SessionManager.deleteRefreshToken(user.id);
    const newRefreshTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');
    await SessionManager.storeRefreshToken(user.id, newRefreshTokenHash);

    return NextResponse.json(
      {
        message: 'Tokens refreshed successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          reputationScore: user.reputationScore,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token refresh error:', error);
    throw error; // Let withErrorHandling handle it
  }
}

export const POST = withErrorHandling(refreshHandler);