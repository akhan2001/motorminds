// src/lib/integrations/motor-daas/cache.ts

import { CacheEntry, CacheConfig } from './types';

export class MotorDaasCache {
    private cache: Map<string, CacheEntry<unknown>>;
    private readonly config: CacheConfig;

    constructor(config?: Partial<CacheConfig>) {
        this.cache = new Map();
        this.config = {
            defaultTTL: config?.defaultTTL ?? 3600, // 1 hour default
            maxSize: config?.maxSize ?? 1000
        };
    }

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cached data with optional TTL
     */
    set<T>(key: string, data: T, ttl?: number): void {
        // Enforce max size by removing oldest entries
        if (this.cache.size >= this.config.maxSize) {
            this.evictOldest();
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.config.defaultTTL
        };

        this.cache.set(key, entry as CacheEntry<unknown>);
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete a cache entry
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; maxSize: number; hitRate?: number } {
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize
        };
    }

    /**
     * Remove expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl * 1000) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Generate cache key from endpoint and params
     */
    static generateKey(endpoint: string, params?: Record<string, unknown>): string {
        if (!params || Object.keys(params).length === 0) {
            return endpoint;
        }

        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${JSON.stringify(params[key])}`)
            .join('&');

        return `${endpoint}?${sortedParams}`;
    }

    /**
     * Evict oldest cache entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}