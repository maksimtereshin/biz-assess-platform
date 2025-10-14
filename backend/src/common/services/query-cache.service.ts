import { Injectable } from '@nestjs/common';

/**
 * Query Cache Service for optimizing database queries
 * Implements in-memory caching for frequently accessed data
 *
 * Task 3.5: Performance Optimizations for Analytics and Data Aggregation
 */
@Injectable()
export class QueryCacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly defaultTtl = 60000; // 1 minute default TTL

  /**
   * Get cached data if available and not expired
   * @param key Cache key
   * @returns Cached data or undefined
   */
  get<T>(key: string): T | undefined {
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      // Expired, remove from cache
      this.cache.delete(key);
      return undefined;
    }

    return cached.data as T;
  }

  /**
   * Store data in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 1 minute)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  /**
   * Execute a function and cache its result
   * @param key Cache key
   * @param fn Function to execute if cache miss
   * @param ttl Time to live in milliseconds
   * @returns Cached or freshly computed data
   */
  async getOrCompute<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const data = await fn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern Pattern to match (supports * wildcard)
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): {
    size: number;
    entries: string[];
    memoryUsage: number;
  } {
    const entries = Array.from(this.cache.keys());

    // Rough memory estimate
    let memoryUsage = 0;
    for (const [key, value] of this.cache.entries()) {
      memoryUsage += key.length * 2; // String size (UTF-16)
      memoryUsage += JSON.stringify(value.data).length * 2;
    }

    return {
      size: this.cache.size,
      entries,
      memoryUsage,
    };
  }

  /**
   * Clean up expired entries (garbage collection)
   * Should be called periodically
   */
  cleanupExpired(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
