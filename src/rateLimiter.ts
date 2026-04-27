/**
 * rateLimiter.ts
 *
 * Provides a simple rate limiter to throttle GitHub API calls and avoid
 * hitting secondary rate limits (403 with Retry-After header).
 */

import * as core from "@actions/core";

export interface RateLimiterOptions {
  /** Maximum number of requests allowed per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Minimum delay between consecutive requests in milliseconds */
  minDelayMs: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  maxRequests: 30,
  windowMs: 60_000,
  minDelayMs: 200,
};

export class RateLimiter {
  private readonly options: RateLimiterOptions;
  private requestTimestamps: number[] = [];
  private lastRequestTime = 0;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Waits until it is safe to make the next request, respecting both the
   * sliding-window limit and the minimum inter-request delay.
   */
  async throttle(): Promise<void> {
    const now = Date.now();

    // Enforce minimum delay between consecutive requests
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.options.minDelayMs) {
      await sleep(this.options.minDelayMs - timeSinceLast);
    }

    // Prune timestamps outside the current window
    const windowStart = Date.now() - this.options.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > windowStart
    );

    // If we have hit the window limit, wait until the oldest request expires
    if (this.requestTimestamps.length >= this.options.maxRequests) {
      const oldest = this.requestTimestamps[0];
      const waitMs = oldest + this.options.windowMs - Date.now() + 10;
      if (waitMs > 0) {
        core.debug(
          `Rate limit reached (${this.options.maxRequests} req/${this.options.windowMs}ms). Waiting ${waitMs}ms.`
        );
        await sleep(waitMs);
      }
      // Re-prune after sleeping
      const newWindowStart = Date.now() - this.options.windowMs;
      this.requestTimestamps = this.requestTimestamps.filter(
        (ts) => ts > newWindowStart
      );
    }

    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(this.lastRequestTime);
  }

  /** Returns the number of requests recorded in the current window. */
  get currentCount(): number {
    const windowStart = Date.now() - this.options.windowMs;
    return this.requestTimestamps.filter((ts) => ts > windowStart).length;
  }

  /** Resets all internal state (useful for testing). */
  reset(): void {
    this.requestTimestamps = [];
    this.lastRequestTime = 0;
  }
}

/** Promisified setTimeout. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Singleton instance used across the action run. */
export const globalRateLimiter = new RateLimiter();
