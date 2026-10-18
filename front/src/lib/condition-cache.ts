import { randomUUID } from "node:crypto";

export class HistoryBusyError extends Error {}
type Entry<T> = { value: T; expiresAt: number };
const memory = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
let redisUnavailableUntil = 0;

// REST avoids persistent Redis connections; credentials never enter client bundles.
async function redis(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || Date.now() < redisUnavailableUntil) throw new Error("Cache unavailable");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Cache request failed");
    const body = await response.json();
    if (body.error) throw new Error("Cache command failed");
    return body.result;
  } catch {
    redisUnavailableUntil = Date.now() + 60_000;
    console.warn("Condition cache unavailable; using bounded process cache for 60 seconds");
    throw new Error("Cache unavailable");
  }
}

function remember<T>(key: string, entry: Entry<T>) {
  memory.delete(key);
  memory.set(key, entry);
  while (memory.size > 64) memory.delete(memory.keys().next().value!);
}

export async function cachedConditionData<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const existing = memory.get(key) as Entry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    remember(key, existing);
    return existing.value;
  }
  const running = pending.get(key);
  if (running) return running as Promise<T>;
  // Bound DB work during cache outages and requests for many distinct ranges/devices.
  if (pending.size >= 2) throw new HistoryBusyError();
  const work = (async () => {
    let shared = false;
    let locked = false;
    const token = randomUUID();
    try {
      const raw = await redis(["GET", key]);
      shared = true;
      if (typeof raw === "string") {
        const entry = JSON.parse(raw) as Entry<T>;
        if (entry.expiresAt > Date.now()) {
          remember(key, entry);
          return entry.value;
        }
      }
      // A lease prevents concurrent server instances from refilling the same day.
      locked = await redis(["SET", `${key}:lock`, token, "NX", "EX", 45]) === "OK";
    } catch {
      shared = false;
    }
    if (shared && !locked) throw new HistoryBusyError();
    try {
      const value = await load();
      const entry = { value, expiresAt: Date.now() + ttl * 1000 };
      remember(key, entry);
      if (shared) {
        await redis(["SET", key, JSON.stringify(entry), "EX", ttl]).catch(() => undefined);
      }
      return value;
    } finally {
      if (locked) {
        await redis([
          "EVAL",
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
          1, `${key}:lock`, token,
        ]).catch(() => undefined);
      }
    }
  })();
  pending.set(key, work);
  try { return await work; } finally { pending.delete(key); }
}
