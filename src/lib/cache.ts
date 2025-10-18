/**
 * Simple in-memory cache with TTL for admin panel
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Helper function to create cache keys
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

// Helper function to invalidate all analytics caches
export function invalidateAnalyticsCache(): void {
  cache.delete(createCacheKey('analytics', { timeRange: '7d' }));
  cache.delete(createCacheKey('analytics', { timeRange: '30d' }));
  cache.delete(createCacheKey('analytics', { timeRange: '90d' }));
  cache.delete(createCacheKey('analytics', { timeRange: '1y' }));
}

// Helper function to invalidate all caches (use sparingly)
export function invalidateAllCaches(): void {
  cache.clear();
}
