/**
 * Intelligent Client-Side In-Memory Cache for Web API
 * 
 * Features:
 * - Sub-millisecond instant retrieval for cached GET requests
 * - Configurable TTL per resource (e.g. categories: 10m, businesses: 2m, stats: 1m)
 * - Automatic mutation-based invalidation (POST/PUT/PATCH/DELETE invalidate related queries)
 * - Transparent cache statistics and manual purge controls
 */

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface ClientCacheStats {
  hits: number;
  misses: number;
  hitRatio: string;
  size: number;
}

export class ClientCacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000,
    });
  }

  /**
   * Invalida claves que coincidan con un patrón comodín (ej: "*business*", "*stats*")
   */
  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): ClientCacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
      size: this.cache.size,
    };
  }

  /**
   * Invalida automáticamente sectores de caché según la URL de una mutación (POST/PUT/PATCH/DELETE)
   */
  handleMutation(url: string = ''): void {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('appointment') || cleanUrl.includes('busy-slot')) {
      this.invalidate('*appointment*');
      this.invalidate('*busy-slot*');
      this.invalidate('*stats*');
    }
    if (cleanUrl.includes('business') || cleanUrl.includes('categor')) {
      this.invalidate('*business*');
      this.invalidate('*categor*');
      this.invalidate('*stats*');
    }
    if (cleanUrl.includes('admin') || cleanUrl.includes('user')) {
      this.invalidate('*admin*');
      this.invalidate('*user*');
      this.invalidate('*stats*');
    }
    if (cleanUrl.includes('report')) {
      this.invalidate('*report*');
      this.invalidate('*stats*');
    }
  }
}

export const clientCache = new ClientCacheManager();
