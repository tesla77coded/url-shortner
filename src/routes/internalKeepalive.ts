import { Router, Request, Response } from "express";
import RedisStore from "../rateLimiter/redisStore.js"; // adjust import to your file
// Your store expects REDIS_URL
const store = new RedisStore(process.env.REDIS_URL as string, "ka"); // separate prefix "ka" for keepalive

const router = Router();

/**
 * POST /internal/keepalive
 * Header: x-keepalive-token: <token>
 * Does: a tiny Redis write via store.evalSlidingWindow (ZADD + EXPIRE) so Upstash stays warm.
 */
router.post("/keepalive", async (req: Request, res: Response) => {
  try {
    const token = req.headers["x-keepalive-token"];
    if (token !== process.env.URLSHORT_KEEPALIVE_TOKEN) {
      return res.status(401).send("unauthorized");
    }

    // Dummy sliding-window op = multiple Redis writes (warm activity)
    await store.evalSlidingWindow("ping", Date.now(), 60_000, 1);

    return res.status(200).send("ok");
  } catch (err) {
    console.error("[keepalive] error:", err);
    return res.status(500).send("error");
  }
});

export default router;
