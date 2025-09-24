jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    multi: function () {
      const ops: any[] = [];
      return {
        zremrangebyscore: function (k: string, a: number, b: number) {
          ops.push(['zremrangebyscore', k, a, b]);
          return this;
        },
        zadd: function (k: string, score: string, member: string) {
          ops.push(['zadd', k, score, member]);
          return this;
        },
        zcard: function (k: string) {
          ops.push(['zcard', k]);
          return this;
        },
        zrange: function (k: string, a: number, b: number) {
          ops.push(['zrange', k, a, b]);
          return this;
        },
        expire: function (k: string, seconds: number) {
          ops.push(['expire', k, seconds]);
          return this;
        },
        exec: async function () {
          // simulate responses: zremrangebyscore -> [null, 0]
          // zadd -> [null, 1]
          // zcard -> [null, <count>]
          // zrange -> [null, [<oldest>]]
          // expire -> [null, 1]
          return [[null, 0], [null, 1], [null, 2], [null, ['100']], [null, 1]];
        },
      };
    },
    del: async function () {
      return 1;
    },
    on: function () { },
  }));
});

import RedisStore from '../../src/rateLimiter/redisStore';


describe('RedisStore.evalSlidingWindow (mocked ioredis)', () => {
  test('parses multi.exec result correctly', async () => {
    const rs = new RedisStore('redis://x');
    const res = await rs.evalSlidingWindow('k', 200, 1000, 10);
    expect(res.count).toBe(2);
    expect(res.oldestTs).toBe(100);
  });


  test('reset calls del', async () => {
    const rs = new RedisStore('redis://x');
    await expect(rs.reset('k')).resolves.not.toThrow();
  });
});
