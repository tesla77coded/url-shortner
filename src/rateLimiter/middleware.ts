import type { Request, Response, NextFunction } from 'express';
import store from './index.js'; // <--- factory that picks MemoryStore or RedisStore
import type { SlidingWindowConfig, Decision } from './types.js';

export function getStore() {
  return store;
}

export function rateLimiter(
  config: SlidingWindowConfig,
  opts?: { keyExtractor?: (req: Request) => string }
) {
  const limit = config.limit;
  const windowMs = config.windowMs;

  const keyExtractor =
    opts?.keyExtractor ??
    ((req: Request) => {
      const xff = req.headers['x-forwarded-for'];
      if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim();
      }
      return req.ip || 'anon';
    });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyExtractor(req);
      const now = Date.now();

      // use the store from ./index.ts (memory or redis)
      const { count, oldestTs } = await store.evalSlidingWindow(key, now, windowMs, limit);

      const remaining = Math.max(0, limit - count);
      const resetMs = count === 0 ? windowMs : Math.max(0, windowMs - (now - oldestTs));

      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetMs / 1000)));

      if (count > limit) {
        res.setHeader('Retry-After', String(Math.ceil(resetMs / 1000)));
        return res
          .status(429)
          .json({ error: 'Too many requests', retry_after: Math.ceil(resetMs / 1000) });
      }

      return next();
    } catch (err) {
      console.error('rate-limiter error (allowing request): ', err);
      // On any internal error, allow the request through (fail-open).
      return next();
    }
  };
}

export default rateLimiter;
