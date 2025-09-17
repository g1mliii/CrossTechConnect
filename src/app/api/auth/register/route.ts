import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateTokens, isValidEmail, isValidPassword } from '@/lib/auth';
import { SessionManager } from '@/lib/redis';
import { withErrorHandling } from '@/lib/middleware';

interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

async function registerHandler(req: NextRequest): Promise<NextResponse> {
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
    const body: RegisterRequest = await req.json();
    const { email, password, displayName } = body;

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

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid password',
          code: 'VALIDATION_ERROR',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          code: 'USER_EXISTS',
          message: 'An account with this email already exists'
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName?.trim() || null,
        reputationScore: 0
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        reputationScore: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Store session in Redis
    await SessionManager.storeSession(user.id, {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      reputationScore: user.reputationScore
    });

    // Store refresh token hash in Redis
    const crypto = await import('crypto');
    const refreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await SessionManager.storeRefreshToken(user.id, refreshTokenHash);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          reputationScore: user.reputationScore,
          createdAt: user.createdAt
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    throw error; // Let withErrorHandling handle it
  }
}

export const POST = withErrorHandling(registerHandler);