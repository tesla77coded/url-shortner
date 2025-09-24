import MemoryStore from '../../src/rateLimiter/memoryStore'

describe('MemoryStore.evalSlidingWindow', () => {
  test('adds timestamps and prunes old ones', async () => {
    const ms = new MemoryStore('test');
    const key = 'k';
    const now = 1000000;
    await ms.evalSlidingWindow(key, now, 1000, 5);
    await ms.evalSlidingWindow(key, now + 1, 1000, 5);
    await ms.evalSlidingWindow(key, now + 2, 1000, 5);
    const res = await ms.evalSlidingWindow(key, now + 3, 1000, 5);
    expect(res.count).toBe(4);


    // advance past window, old entries removed
    const res2 = await ms.evalSlidingWindow(key, now + 2000, 1000, 5);
    expect(res2.count).toBe(1);
  });

  test('reset removes key', async () => {
    const ms = new MemoryStore('test');
    const key = 'r';
    await ms.evalSlidingWindow(key, 1, 1000, 10);
    await ms.reset(key);
    const res = await ms.evalSlidingWindow(key, 2, 1000, 10);
    expect(res.count).toBe(1);
  });

});
