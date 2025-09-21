# URL Shortener — Custom Rate Limiter

A small, production-minded URL shortener built with TypeScript, Express, and Supabase — featuring a custom sliding-window rate limiter with pluggable storage (in-memory for local dev, Upstash Redis for cloud).

**Live demo:** [https://url-shortner-ap09.onrender.com](https://url-shortner-ap09.onrender.com)

---

## Tech stack

* Node.js + TypeScript (ESM)
* Express
* Supabase (Postgres) for URL storage
* Upstash Redis for distributed rate-limiting (sliding window via sorted sets)
* `ioredis` client
* Dev: `ts-node-dev`

---

## Features

* `POST /api/shorten` — create short code for a long URL
* `GET /:code` — redirect and increment click count
* Sliding-window rate limiter (configurable window & limit), storeable in-memory or Redis (Upstash)
* `X-RateLimit-*` headers and correct `429` handling

---

## Try it live

You can test the API directly against the deployed demo:

### Shorten a URL

```bash
curl -X POST "https://url-shortner-ap09.onrender.com/api/shorten" \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com"}'
```

Response example:

```json
{"code":"8","shortUrl":"https://url-shortner-ap09.onrender.com/8"}
```

### Redirect

```bash
curl -i "https://url-shortner-ap09.onrender.com/8"
```

Response example:

```
HTTP/2 302 Found
Location: https://example.com
```

---

## Quickstart (local / dev using Upstash)

1. Copy `.env.example` → `.env` and fill in values:

   * `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   * `RATE_LIMIT_STORE=redis`
   * `REDIS_URL=rediss://:PASSWORD@<region>-...upstash.io:6379`
   * `BASE_URL=http://localhost:3000`
2. Install dependencies:

   ```bash
   npm install
   ```
3. Dev:

   ```bash
   npm run dev
   ```
4. Example request:

   ```bash
   curl -X POST http://localhost:3000/api/shorten \
     -H "Content-Type: application/json" \
     -d '{"longUrl":"https://example.com"}'
   ```

---

## Environment variables

Put these into `.env` (do not commit `.env`):

```
PORT=3000
BASE_URL=http://localhost:3000

SUPABASE_URL=https://<your-supabase>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

RATE_LIMIT_STORE=redis      # 'memory' or 'redis'
REDIS_URL=rediss://:pwd@usX-...upstash.io:6379

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
```

---

## Upstash (quick)

1. Create a Redis database on Upstash (free tier available).
2. Copy the `rediss://...` public endpoint and paste into `REDIS_URL`.
3. Set `RATE_LIMIT_STORE=redis`.

---

## Deploying to Render (quick)

* Connect this GitHub repo to Render, set **Build command**: `npm install && npm run build` and **Start command**: `npm run start`.
* Add the same environment variables in the Render dashboard (including `REDIS_URL` and Supabase keys).
* Ensure `RATE_LIMIT_STORE=redis` for production so all instances use Upstash.

---

## How the rate limiter works (high level)

* Sliding-window implemented with per-key timestamps.
* In-memory store (for single-instance dev) stores timestamps in an array.
* Redis store uses a sorted set (ZADD, ZREMRANGEBYSCORE, ZCARD, ZRANGE) for distributed accurate counts across instances.

---

## Security

* **Never** commit `SUPABASE_SERVICE_ROLE_KEY` or any secrets. Use `.env` (ignored) and Render environment variables for production.
* The service role key is server-side only; do not expose it to clients.

---

## Contributing

PRs welcome — keep changes small and documented. Add tests where appropriate.

---

## License

MIT
