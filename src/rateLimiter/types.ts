export type Key = string;

export interface SlidingWindowConfig {
  limit: number;
  windowMs: number
  prefix?: string;
}

export interface Decision {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export interface Store {

  evalSlidingWindow(key: Key, now: number, windowMs: number, limit: number): Promise<{
    count: number;
    oldestTs: number;
  }>;
}
