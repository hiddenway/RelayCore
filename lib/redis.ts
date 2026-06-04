import { Redis } from "@upstash/redis";
import type { AdminAccount, TelegramBot, Route, EventLog, Stats } from "@/types";

let redis: Redis | null = null;

function getRedisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
}

function getRedisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
}

export function getRedis(): Redis {
  if (!redis) {
    const url = getRedisUrl();
    const token = getRedisToken();
    if (!url || !token) throw new Error("Redis not configured");
    redis = new Redis({ url, token });
  }
  return redis;
}

export function isRedisConfigured(): boolean {
  return !!(getRedisUrl() && getRedisToken());
}

// Setup
export async function isSetupCompleted(): Promise<boolean> {
  const r = getRedis();
  const val = await r.get("app:setup_completed");
  return val === true || val === "true" || val === 1;
}

export async function markSetupCompleted(): Promise<void> {
  const r = getRedis();
  await r.set("app:setup_completed", true);
}

// Admin
export async function getAdmin(): Promise<AdminAccount | null> {
  const r = getRedis();
  return r.get<AdminAccount>("app:admin");
}

export async function saveAdmin(admin: AdminAccount): Promise<void> {
  const r = getRedis();
  await r.set("app:admin", admin);
}

// Bots
export async function getBotIds(): Promise<string[]> {
  const r = getRedis();
  const ids = await r.get<string[]>("bots:index");
  return ids ?? [];
}

export async function getBot(botId: string): Promise<TelegramBot | null> {
  const r = getRedis();
  return r.get<TelegramBot>(`bot:${botId}`);
}

export async function getAllBots(): Promise<TelegramBot[]> {
  const ids = await getBotIds();
  if (ids.length === 0) return [];
  const r = getRedis();
  const bots = await Promise.all(ids.map((id) => r.get<TelegramBot>(`bot:${id}`)));
  return bots.filter((b): b is TelegramBot => b !== null);
}

export async function saveBot(bot: TelegramBot): Promise<void> {
  const r = getRedis();
  await r.set(`bot:${bot.id}`, bot);
  const ids = await getBotIds();
  if (!ids.includes(bot.id)) {
    await r.set("bots:index", [...ids, bot.id]);
  }
}

export async function deleteBot(botId: string): Promise<void> {
  const r = getRedis();
  await r.del(`bot:${botId}`);
  const ids = await getBotIds();
  await r.set("bots:index", ids.filter((id) => id !== botId));
}

// Routes
export async function getRouteSlugIndex(): Promise<string[]> {
  const r = getRedis();
  const slugs = await r.get<string[]>("routes:index");
  return slugs ?? [];
}

export async function getRoute(slug: string): Promise<Route | null> {
  const r = getRedis();
  return r.get<Route>(`route:${slug}`);
}

export async function getAllRoutes(): Promise<Route[]> {
  const slugs = await getRouteSlugIndex();
  if (slugs.length === 0) return [];
  const r = getRedis();
  const routes = await Promise.all(slugs.map((s) => r.get<Route>(`route:${s}`)));
  return routes.filter((r): r is Route => r !== null);
}

export async function saveRoute(route: Route): Promise<void> {
  const r = getRedis();
  await r.set(`route:${route.slug}`, route);
  const slugs = await getRouteSlugIndex();
  if (!slugs.includes(route.slug)) {
    await r.set("routes:index", [...slugs, route.slug]);
  }
}

export async function deleteRoute(slug: string): Promise<void> {
  const r = getRedis();
  await r.del(`route:${slug}`);
  const slugs = await getRouteSlugIndex();
  await r.set("routes:index", slugs.filter((s) => s !== slug));
}

// Event logs
const MAX_RECENT_EVENTS = 10;
const MAX_ROUTE_EVENTS = 10;

export async function saveEvent(event: EventLog): Promise<void> {
  const r = getRedis();
  const pipeline = r.pipeline();
  pipeline.lpush("events:recent", JSON.stringify(event));
  pipeline.ltrim("events:recent", 0, MAX_RECENT_EVENTS - 1);
  pipeline.lpush(`events:route:${event.routeSlug}`, JSON.stringify(event));
  pipeline.ltrim(`events:route:${event.routeSlug}`, 0, MAX_ROUTE_EVENTS - 1);
  await pipeline.exec();
}

export async function getRecentEvents(limit = 50): Promise<EventLog[]> {
  const r = getRedis();
  const raw = await r.lrange("events:recent", 0, limit - 1);
  return raw.map((item) => (typeof item === "string" ? JSON.parse(item) : item) as EventLog);
}

export async function getRouteEvents(slug: string, limit = 20): Promise<EventLog[]> {
  const r = getRedis();
  const raw = await r.lrange(`events:route:${slug}`, 0, limit - 1);
  return raw.map((item) => (typeof item === "string" ? JSON.parse(item) : item) as EventLog);
}

// Stats
export async function incrementStats(routeSlug: string, success: boolean): Promise<void> {
  const r = getRedis();
  const today = new Date().toISOString().split("T")[0];
  const pipeline = r.pipeline();

  const field = success ? "success" : "failed";
  pipeline.hincrby("stats:total", "total", 1);
  pipeline.hincrby("stats:total", field, 1);
  pipeline.hincrby(`stats:today:${today}`, "total", 1);
  pipeline.hincrby(`stats:today:${today}`, field, 1);
  pipeline.hincrby(`stats:route:${routeSlug}`, "total", 1);
  pipeline.hincrby(`stats:route:${routeSlug}`, field, 1);
  pipeline.expire(`stats:today:${today}`, 60 * 60 * 24 * 7);

  await pipeline.exec();
}

export async function getGlobalStats(): Promise<Stats> {
  const r = getRedis();
  const raw = await r.hgetall<Record<string, string>>("stats:total");
  if (!raw) return { total: 0, success: 0, failed: 0 };
  return {
    total: parseInt(raw.total ?? "0"),
    success: parseInt(raw.success ?? "0"),
    failed: parseInt(raw.failed ?? "0"),
  };
}

export async function getTodayStats(): Promise<Stats> {
  const r = getRedis();
  const today = new Date().toISOString().split("T")[0];
  const raw = await r.hgetall<Record<string, string>>(`stats:today:${today}`);
  if (!raw) return { total: 0, success: 0, failed: 0 };
  return {
    total: parseInt(raw.total ?? "0"),
    success: parseInt(raw.success ?? "0"),
    failed: parseInt(raw.failed ?? "0"),
  };
}

export async function getRouteStats(slug: string): Promise<Stats> {
  const r = getRedis();
  const raw = await r.hgetall<Record<string, string>>(`stats:route:${slug}`);
  if (!raw) return { total: 0, success: 0, failed: 0 };
  return {
    total: parseInt(raw.total ?? "0"),
    success: parseInt(raw.success ?? "0"),
    failed: parseInt(raw.failed ?? "0"),
  };
}

// ─── Login rate limiting (stored in Redis — works across serverless instances) ───

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_SECONDS = 15 * 60; // 15 min block
const LOGIN_WINDOW_SECONDS = 10 * 60; // attempt counter TTL

export async function checkLoginRateLimit(ip: string): Promise<{
  blocked: boolean;
  remaining: number;
  retryAfter?: number;
}> {
  const r = getRedis();
  const ttl = await r.ttl(`login:blocked:${ip}`);
  if (ttl > 0) return { blocked: true, remaining: 0, retryAfter: ttl };

  const attempts = (await r.get<number>(`login:attempts:${ip}`)) ?? 0;
  return { blocked: false, remaining: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts) };
}

export async function recordFailedLogin(ip: string): Promise<{
  blocked: boolean;
  remaining: number;
  retryAfter?: number;
}> {
  const r = getRedis();
  const attempts = await r.incr(`login:attempts:${ip}`);
  await r.expire(`login:attempts:${ip}`, LOGIN_WINDOW_SECONDS);

  if (attempts >= LOGIN_MAX_ATTEMPTS) {
    await r.set(`login:blocked:${ip}`, 1, { ex: LOGIN_BLOCK_SECONDS });
    await r.del(`login:attempts:${ip}`);
    return { blocked: true, remaining: 0, retryAfter: LOGIN_BLOCK_SECONDS };
  }

  return { blocked: false, remaining: LOGIN_MAX_ATTEMPTS - attempts };
}

export async function clearLoginAttempts(ip: string): Promise<void> {
  const r = getRedis();
  await Promise.all([
    r.del(`login:attempts:${ip}`),
    r.del(`login:blocked:${ip}`),
  ]);
}
