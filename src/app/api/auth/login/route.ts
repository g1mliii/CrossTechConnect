import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateTokens, isValidEmail } from '@/lib/auth';
import { SessionManager } from '@/lib/redis';
import { withErrorHandling } from '@/lib/middleware';

interface LoginRequest {
  email: string;
  password: string;
}

async function loginHandler(req: NextRequest): Promise<NextResponse> {
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
    const body: LoginRequest = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address'
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        displayName: true,
        reputationScore: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect'
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect'
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Store session in Redis
    await SessionManager.storeSession(user.id, {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      reputationScore: user.reputationScore,
      loginTime: Date.now()
    });

    // Store refresh token hash in Redis
    const crypto = await import('crypto');
    const refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await SessionManager.storeRefreshToken(user.id, refreshTokenHash);

    // Update user's last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          reputationScore: user.reputationScore,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    throw error; // Let withErrorHandling handle it
  }
}

export const POST = withErrorHandling(loginHandler);