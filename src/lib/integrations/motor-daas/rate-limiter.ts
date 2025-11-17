// src/lib/integrations/motor-daas/rate-limiter.ts

import { RateLimitInfo } from './types';

export class MotorDaasRateLimiter {
    private requests: number[] = [];
    private readonly limit: number;
    private readonly windowMs: number;

    /**
     * Initialize rate limiter
     * @param limit - Maximum requests allowed (default: 1500)
     * @param windowMinutes - Time window in minutes (default: 15)
     */
    constructor(limit: number = 1500, windowMinutes: number = 15) {
        this.limit = limit;
        this.windowMs = windowMinutes * 60 * 1000;
    }

    /**
     * Check if request can be made
     */
    canMakeRequest(): boolean {
        this.cleanOldRequests();
        return this.requests.length < this.limit;
    }

    /**
     * Record a new request
     * @throws Error if rate limit exceeded
     */
    recordRequest(): void {
        this.cleanOldRequests();

        if (this.requests.length >= this.limit) {
            const resetTime = this.getResetTime();
            const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
            throw new Error(
                `Rate limit exceeded. ${this.limit} requests per ${this.windowMs / 60000} minutes. ` +
                `Try again in ${waitSeconds} seconds.`
            );
        }

        this.requests.push(Date.now());
    }

    /**
     * Get current rate limit info
     */
    getRateLimitInfo(): RateLimitInfo {
        this.cleanOldRequests();

        return {
            limit: this.limit,
            remaining: Math.max(0, this.limit - this.requests.length),
            resetTime: this.getResetTime()
        };
    }

    /**
     * Remove requests outside the current window
     */
    private cleanOldRequests(): void {
        const cutoff = Date.now() - this.windowMs;
        this.requests = this.requests.filter(timestamp => timestamp > cutoff);
    }

    /**
     * Get timestamp when rate limit will reset
     */
    private getResetTime(): number {
        if (this.requests.length === 0) {
            return Date.now() + this.windowMs;
        }

        const oldestRequest = Math.min(...this.requests);
        return oldestRequest + this.windowMs;
    }

    /**
     * Reset the rate limiter (for testing)
     */
    reset(): void {
        this.requests = [];
    }
}