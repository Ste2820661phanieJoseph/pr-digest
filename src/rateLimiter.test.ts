import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter, sleep } from './rateLimiter';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified delay', async () => {
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('does not resolve before the delay', async () => {
    let resolved = false;
    sleep(500).then(() => {
      resolved = true;
    });
    vi.advanceTimersByTime(499);
    // Flush microtasks
    await Promise.resolve();
    expect(resolved).toBe(false);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the rate limit without delay', async () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    const start = Date.now();

    // All three should go through immediately
    const p1 = limiter.throttle();
    const p2 = limiter.throttle();
    const p3 = limiter.throttle();

    vi.advanceTimersByTime(0);
    await Promise.all([p1, p2, p3]);

    expect(Date.now() - start).toBeLessThan(50);
  });

  it('delays requests that exceed the rate limit', async () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

    const results: number[] = [];

    const run = async (id: number) => {
      await limiter.throttle();
      results.push(id);
    };

    const p1 = run(1);
    const p2 = run(2);
    const p3 = run(3); // This one should be delayed

    // Advance past the window so the 3rd request can proceed
    vi.advanceTimersByTime(1001);
    await Promise.all([p1, p2, p3]);

    expect(results).toContain(1);
    expect(results).toContain(2);
    expect(results).toContain(3);
  });

  it('resets the window after windowMs has passed', async () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 500 });

    const p1 = limiter.throttle();
    vi.advanceTimersByTime(0);
    await p1;

    // After the window, another request should go through
    vi.advanceTimersByTime(500);
    const p2 = limiter.throttle();
    vi.advanceTimersByTime(0);
    await expect(p2).resolves.toBeUndefined();
  });

  it('tracks remaining capacity correctly', async () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });

    expect(limiter.remaining()).toBe(5);

    const p1 = limiter.throttle();
    vi.advanceTimersByTime(0);
    await p1;

    expect(limiter.remaining()).toBe(4);
  });
});
