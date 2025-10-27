import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Mock environment variables (fallback if .env.local not loaded)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

// Mock Redis client
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    setEx: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    ttl: vi.fn(),
    quit: vi.fn(),
  }),
  SessionManager: {
    storeSession: vi.fn(),
    getSession: vi.fn(),
    updateLastActivity: vi.fn(),
    deleteSession: vi.fn(),
    storeRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    cleanupExpiredSessions: vi.fn(),
  },
  closeRedisConnection: vi.fn(),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));