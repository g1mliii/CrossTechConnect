/**
 * Fetch wrapper with client-side caching and deduplication
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class FetchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly TTL = 60000; // 60 seconds

  async fetch(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = `${url}:${JSON.stringify(options || {})}`;
    
    // Check if there's a pending request for this URL
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log('[Cache] Deduplicating request:', url);
      return pending;
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log('[Cache] Using cached data:', url);
      return cached.data;
    }

    // Make the request
    console.log('[Cache] Making fresh request:', url);
    const promise = fetch(url, options)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        
        // Store in cache
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        // Remove from pending
        this.pendingRequests.delete(cacheKey);
        
        return data;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store as pending
    this.pendingRequests.set(cacheKey, promise);

    return promise;
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  invalidate(urlPattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const fetchCache = new FetchCache();

/**
 * Fetch with automatic caching and deduplication
 */
export async function fetchWithCache(url: string, options?: RequestInit): Promise<any> {
  return fetchCache.fetch(url, options);
}

/**
 * Clear all cached data
 */
export function clearFetchCache() {
  fetchCache.clear();
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateFetchCache(urlPattern: string) {
  fetchCache.invalidate(urlPattern);
}
