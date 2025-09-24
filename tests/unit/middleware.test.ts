jest.mock('../../src/rateLimiter/index', () => ({
  __esModule: true,
  default: {
    evalSlidingWindow: jest.fn(),
  },
}));


import express from 'express';
import request from 'supertest';
import rateLimiter from '../../src/rateLimiter/middleware';
import store from '../../src/rateLimiter/index';


describe('rateLimiter middleware integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('sets rate-limit headers and allows when under limit', async () => {
    (store.evalSlidingWindow as jest.Mock).mockResolvedValue({ count: 1, oldestTs: Date.now() });
    const app = express();
    app.get('/', rateLimiter({ limit: 5, windowMs: 1000 }), (_req, res) => res.status(200).send('ok'));


    const res = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4');
    expect(res.status).toBe(200);
    expect(res.headers['x-ratelimit-limit']).toBe('5');
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });


  test('returns 429 when over limit', async () => {
    (store.evalSlidingWindow as jest.Mock).mockResolvedValue({ count: 10, oldestTs: Date.now() - 100 });
    const app = express();
    app.get('/', rateLimiter({ limit: 1, windowMs: 1000 }), (_req, res) => res.status(200).send('ok'));


    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.headers['retry-after']).toBeDefined();
  });
});
