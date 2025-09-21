import type { Store, Key } from './types.js';


export default class MemoryStore implements Store {
  private map: Map<string, number[]>;
  private prefix: string;

  constructor(prefix = 'rl') {
    this.map = new Map();
    this.prefix = prefix;
  }

  private redisKey(key: Key) {
    return `${this.prefix}:${key}`;
  }

  async evalSlidingWindow(key: Key, now: number, windowMs: number, limit: number): Promise<{ count: number; oldestTs: number; }> {
    const rKey = this.redisKey(key);
    let arr = this.map.get(rKey);
    if (!arr) {
      arr = [];
      this.map.set(rKey, arr);
    }

    const minTs = now - windowMs;
    let firstValidIndex = 0;
    while (firstValidIndex < arr.length && arr[firstValidIndex] <= minTs) {
      firstValidIndex++;
    }

    if (firstValidIndex > 0) {
      arr.splice(0, firstValidIndex);
    }

    arr.push(now);

    const maxKeep = limit + 100;
    if (arr.length > maxKeep) {
      arr.splice(0, arr.length - maxKeep);
    }


    const count = arr.length
    const oldestTs = count > 0 ? arr[0] : 0;

    return { count, oldestTs };
  }

  async reset(key: Key): Promise<void> {
    this.map.delete(this.redisKey(key));
  }
};
