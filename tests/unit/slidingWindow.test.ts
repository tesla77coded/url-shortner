import { decideSlidingWindow } from '../../src/rateLimiter/slidingWindow'

const makeStore = () => {
  const calls: Array<any> = [];
  return {
    calls,
    async evalSlidingWindow(key: string, now: number, windowMs: number, limit: number) {
      const map = (this as any)._map ||= new Map<string, number[]>();
      const rKey = key;
      const arr = map.get(rKey) || [];
      const minTs = now - windowMs;
      while (arr.length && arr[0] <= minTs) arr.shift();
      arr.push(now);
      map.set(rKey, arr);
      return { count: arr.length, oldestTs: arr.length ? arr[0] : 0 };
    },
  };
};

describe('decideSlidingWindow', () => {
  test('allows until limit and then blocks', async () => {
    const store = makeStore();
    const cfg = { limit: 3, windowMs: 1000 };
    const key = 'k';
    const now = Date.now();


    //1
    let d = await decideSlidingWindow(store as any, key, cfg, now + 0);
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(2);

    //2
    d = await decideSlidingWindow(store as any, key, cfg, now + 1);
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(1);


    //3
    d = await decideSlidingWindow(store as any, key, cfg, now + 2);
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(0);

    //4
    d = await decideSlidingWindow(store as any, key, cfg, now + 3);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);

  });

  test('resets window after windowMs', async () => {
    const store = makeStore();
    const cfg = { limit: 2, windowMs: 100 };
    const key = 'a';
    const t0 = 1000000;
    await decideSlidingWindow(store as any, key, cfg, t0);
    await decideSlidingWindow(store as any, key, cfg, t0 + 10);
    const blocked = await decideSlidingWindow(store as any, key, cfg, t0 + 20);
    expect(blocked.allowed).toBe(false);

    //after window is passed, allow
    const after = await decideSlidingWindow(store as any, key, cfg, t0 + 200);
    expect(after.allowed).toBe(true);
  });
});
