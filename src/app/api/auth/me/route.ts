import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest, withErrorHandling } from '@/lib/middleware';

async function profileHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json(
      { 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
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
          message: 'User must be authenticated to access profile'
        },
        { status: 401 }
      );
    }

    // Get detailed user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        reputationScore: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userDevices: true,
            createdDevices: true,
            verificationVotes: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          reputationScore: user.reputationScore,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats: {
            deviceCount: user._count.userDevices,
            devicesCreated: user._count.createdDevices,
            verificationsSubmitted: user._count.verificationVotes
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error; // Let withErrorHandling handle it
  }
}

export const GET = withErrorHandling(withAuth(profileHandler));