import type { Decision, SlidingWindowConfig, Store } from "./types.js";

export async function decideSlidingWindow(
  store: Store,
  key: string,
  cfg: SlidingWindowConfig,
  now = Date.now()
): Promise<Decision> {
  const { count, oldestTs } = await store.evalSlidingWindow(key, now, cfg.windowMs, cfg.limit);

  const allowed = count <= cfg.limit;
  const remaining = Math.max(0, cfg.limit - (allowed ? count : cfg.limit)); // if blocked, remaining=0

  const resetMs = Math.max(0, (oldestTs + cfg.windowMs) - now);

  return { allowed, remaining, resetMs };
}
