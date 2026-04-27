import { withRetry, RetryError } from './retry';

function makeError(status: number): Error {
  const err = new Error(`HTTP ${status}`) as any;
  err.status = status;
  return err;
}

describe('withRetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns result immediately on success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable status codes and eventually succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(makeError(503))
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, { initialDelayMs: 100 });
    // Advance timers to skip delay
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws RetryError after maxAttempts exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(makeError(500));

    const promise = withRetry(fn, { maxAttempts: 3, initialDelayMs: 50 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(RetryError);
    await expect(promise).rejects.toMatchObject({ attempts: 3 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on non-retryable status codes', async () => {
    const fn = jest.fn().mockRejectedValue(makeError(404));

    await expect(withRetry(fn)).rejects.toThrow(RetryError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on non-HTTP errors', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('unexpected'));

    await expect(withRetry(fn)).rejects.toThrow(RetryError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects custom retryableStatusCodes', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(makeError(422))
      .mockResolvedValueOnce('custom-retry');

    const promise = withRetry(fn, {
      retryableStatusCodes: [422],
      initialDelayMs: 10,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('custom-retry');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
