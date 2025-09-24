jest.mock('../../src/lib/supabaseClient.js', () => {
  return {
    supabase: {
      from: jest.fn(),
    },
  };
});

import express from 'express';
import request from 'supertest';

import shortenRouter from '../../src/routes/shorten';
import redirectRouter from '../../src/routes/redirect';
import { supabase } from '../../src/lib/supabaseClient.js';

describe('POST /api/shorten and GET /:code', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3000';
  });

  test('shorten returns code and updates row', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 123 }, error: null }),
        }),
      }),
    }));

    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    const app = express();
    app.use(express.json());
    app.use('/api', shortenRouter);

    const res = await request(app).post('/api/shorten').send({ longUrl: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body.code).toBeDefined();
  });

  test('redirect returns 302 when found and increments click (fire-and-forget)', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { id: 1, long_url: 'https://example.com', clicks: 0 },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    const app = express();
    app.use('/', redirectRouter);

    const res = await request(app).get('/abc123');

    expect(res.status).toBe(302);
    expect(res.headers['location']).toBe('https://example.com');
  });

  test('redirect returns 404 when not found', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
        }),
      }),
    }));

    const app = express();
    app.use('/', redirectRouter);

    const res = await request(app).get('/doesnotexist');
    expect(res.status).toBe(404);
  });

  test('shorten rejects invalid url', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', shortenRouter);

    const res = await request(app).post('/api/shorten').send({ longUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
