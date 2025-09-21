import MemoryStore from './memoryStore.js';
import RedisStore from './redisStore.js';
import type { Store } from './types.js';

const storeType = (process.env.RATE_LIMIT_STORE || 'memory').toLowerCase();

let store: Store;

if (storeType === 'redis') {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    const msg =
      '[rate-limiter] RATE_LIMIT_STORE=redis but REDIS_URL is not set. Please set REDIS_URL to your Upstash connection string.';
    console.error(msg);
    throw new Error(msg);
  } else {
    store = new RedisStore(redisUrl);
  }
} else {
  store = new MemoryStore();
}

export default store;
