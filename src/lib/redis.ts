import { createClient, RedisClientType } from 'redis';

// Redis client instance
let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh:';
  private static readonly SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days
  private static readonly REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 30; // 30 days

  /**
   * Store user session in Redis
   */
  static async storeSession(userId: string, sessionData: any): Promise<void> {
    try {
      const client = await getRedisClient();
      const sessionKey = `${this.SESSION_PREFIX}${userId}`;
      
      await client.setEx(
        sessionKey,
        this.SESSION_EXPIRY,
        JSON.stringify({
          ...sessionData,
          lastActivity: Date.now()
        })
      );
    } catch (error) {
      console.error('Error storing session:', error);
      throw new Error('Failed to store session');
    }
  }

  /**
   * Get user session from Redis
   */
  static async getSession(userId: string): Promise<any | null> {
    try {
      const client = await getRedisClient();
      const sessionKey = `${this.SESSION_PREFIX}${userId}`;
      
      const sessionData = await client.get(sessionKey);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData as string);
      
      // Update last activity
      await this.updateLastActivity(userId);
      
      return parsed;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Update last activity timestamp
   */
  static async updateLastActivity(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const sessionKey = `${this.SESSION_PREFIX}${userId}`;
      
      const sessionData = await client.get(sessionKey);
      if (sessionData) {
        const parsed = JSON.parse(sessionData as string);
        parsed.lastActivity = Date.now();
        
        await client.setEx(
          sessionKey,
          this.SESSION_EXPIRY,
          JSON.stringify(parsed)
        );
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  /**
   * Delete user session
   */
  static async deleteSession(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const sessionKey = `${this.SESSION_PREFIX}${userId}`;
      
      await client.del(sessionKey);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const tokenKey = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
      
      await client.setEx(tokenKey, this.REFRESH_TOKEN_EXPIRY, tokenHash);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const tokenKey = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
      
      const storedHash = await client.get(tokenKey);
      return storedHash === tokenHash;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return false;
    }
  }

  /**
   * Delete refresh token
   */
  static async deleteRefreshToken(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const tokenKey = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
      
      await client.del(tokenKey);
    } catch (error) {
      console.error('Error deleting refresh token:', error);
    }
  }

  /**
   * Clean up expired sessions (utility function)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const client = await getRedisClient();
      
      // Get all session keys
      const sessionKeys = await client.keys(`${this.SESSION_PREFIX}*`);
      
      for (const key of sessionKeys) {
        const ttl = await client.ttl(key);
        if (ttl <= 0) {
          await client.del(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}