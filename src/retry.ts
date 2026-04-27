/**
 * Retry utility for handling transient API failures (GitHub, OpenAI, Slack).
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffFactor: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: unknown
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

function isRetryableError(err: unknown, retryableStatusCodes: number[]): boolean {
  if (err instanceof Error) {
    // Axios / octokit style errors
    const status = (err as any)?.status ?? (err as any)?.response?.status;
    if (typeof status === 'number') {
      return retryableStatusCodes.includes(status);
    }
    // Network-level errors
    if ((err as any)?.code === 'ECONNRESET' || (err as any)?.code === 'ETIMEDOUT') {
      return true;
    }
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === opts.maxAttempts || !isRetryableError(err, opts.retryableStatusCodes)) {
        break;
      }

      const waitMs = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt - 1);
      await delay(waitMs);
    }
  }

  throw new RetryError(
    `Operation failed after ${opts.maxAttempts} attempts`,
    opts.maxAttempts,
    lastError
  );
}
