import type { Store, Key } from './types.js';
import Redis from 'ioredis';

export default class RedisStore implements Store {
  private client: Redis;
  private prefix: string;

  constructor(redisUrl: string, prefix = 'rl') {
    this.client = new Redis(redisUrl);
    this.prefix = prefix;

    this.client.on('connect', () => {
      console.info('[RedisStore] connect');
    });
    this.client.on('ready', () => {
      console.info('[RedisStore] ready');
    });
    this.client.on('error', (err: Error) => {
      console.error('[RedisStore] error', err?.message ?? err);
    });
    this.client.on('close', () => {
      console.warn('[RedisStore] connection closed');
    });
  }

  private redisKey(key: Key) {
    return `${this.prefix}:${key}`;
  }

  async evalSlidingWindow(
    key: Key,
    now: number,
    windowMs: number,
    limit: number
  ): Promise<{ count: number; oldestTs: number }> {
    const rKey = this.redisKey(key);
    const minTs = now - windowMs;

    const multi = this.client.multi();
    multi.zremrangebyscore(rKey, 0, minTs);
    multi.zadd(rKey, String(now), String(now));
    multi.zcard(rKey);
    multi.zrange(rKey, 0, 0);
    multi.expire(rKey, Math.ceil(windowMs / 1000) + 1);

    const execResult = await multi.exec();

    const zcardRes = execResult?.[2];
    const zrangeRes = execResult?.[3];

    const rawCount = Array.isArray(zcardRes) ? zcardRes[1] : 0;
    const rawZRange = Array.isArray(zrangeRes) ? zrangeRes[1] : [];

    const count = typeof rawCount === 'number' ? rawCount : parseInt(String(rawCount || '0'), 10);
    const oldestTs = Array.isArray(rawZRange) && rawZRange.length ? Number(rawZRange[0]) : 0;

    return { count, oldestTs };
  }

  async reset(key: Key): Promise<void> {
    await this.client.del(this.redisKey(key));
  }
}
