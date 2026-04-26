interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory store — resets on server restart. Use Redis in production for multi-instance deployments.
const store = new Map<string, Bucket>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, bucket);
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetIn: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count, resetIn: bucket.resetAt - now };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

// Clean up expired buckets every 30 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }, 30 * 60 * 1000);
}
