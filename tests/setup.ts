import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

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