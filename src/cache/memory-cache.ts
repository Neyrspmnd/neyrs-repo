export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[];
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.ttl);

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, { value, expiresAt });
    this.updateAccessOrder(key);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    this.updateAccessOrder(key);
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    oldestEntry: number | null;
  } {
    this.cleanExpired();

    let oldestEntry: number | null = null;
    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.expiresAt < oldestEntry) {
        oldestEntry = entry.expiresAt;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      oldestEntry,
    };
  }
}
