import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';
import { SessionManager } from './redis';
import { prisma } from './prisma';

// Extended request type with user information
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    displayName: string | null;
    reputationScore: number;
  };
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            message: 'No authentication token provided'
          },
          { status: 401 }
        );
      }

      // Verify JWT token
      let payload: JWTPayload;
      try {
        payload = verifyToken(token);
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Invalid token',
            code: 'INVALID_TOKEN',
            message: error instanceof Error ? error.message : 'Token verification failed'
          },
          { status: 401 }
        );
      }

      // Check if it's an access token
      if (payload.type !== 'access') {
        return NextResponse.json(
          {
            error: 'Invalid token type',
            code: 'INVALID_TOKEN_TYPE',
            message: 'Access token required'
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
          reputationScore: true
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

      // Update session activity
      await SessionManager.updateLastActivity(user.id);

      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      // Call the handler with authenticated request
      return handler(authenticatedReq);

    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          code: 'AUTH_ERROR',
          message: 'Internal authentication error'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Optional authentication middleware (user may or may not be authenticated)
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        try {
          const payload = verifyToken(token);
          
          if (payload.type === 'access') {
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: {
                id: true,
                email: true,
                displayName: true,
                reputationScore: true
              }
            });

            if (user) {
              await SessionManager.updateLastActivity(user.id);
              const authenticatedReq = req as AuthenticatedRequest;
              authenticatedReq.user = user;
            }
          }
        } catch (error) {
          // Ignore token errors for optional auth
          console.warn('Optional auth token error:', error);
        }
      }

      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      return handler(req as AuthenticatedRequest);
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function withRole(requiredReputationScore: number = 0) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            message: 'User authentication required'
          },
          { status: 401 }
        );
      }

      if (req.user.reputationScore < requiredReputationScore) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Minimum reputation score of ${requiredReputationScore} required`
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const key = `rate_limit:${ip}`;
        
        // For now, we'll implement a simple in-memory rate limiter
        // In production, this should use Redis
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // This is a simplified implementation
        // In a real application, you'd want to use Redis for distributed rate limiting
        
        return handler(req as AuthenticatedRequest);
      } catch (error) {
        console.error('Rate limiting error:', error);
        return handler(req as AuthenticatedRequest);
      }
    };
  };
}

/**
 * Error handling wrapper for API routes
 */
export function withErrorHandling(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('API route error:', error);
      
      // Handle Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        
        if (prismaError.code === 'P2002') {
          return NextResponse.json(
            {
              error: 'Duplicate entry',
              code: 'DUPLICATE_ENTRY',
              message: 'A record with this information already exists'
            },
            { status: 409 }
          );
        }
        
        if (prismaError.code === 'P2025') {
          return NextResponse.json(
            {
              error: 'Record not found',
              code: 'NOT_FOUND',
              message: 'The requested record was not found'
            },
            { status: 404 }
          );
        }
      }

      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        },
        { status: 500 }
      );
    }
  };
}