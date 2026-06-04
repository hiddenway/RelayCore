import webpush from "web-push";
import { getRedis } from "./redis";
import type { RelayEventInput } from "@/types";

const LEVEL_EMOJI: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

function getVapidConfig() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT ?? "mailto:admin@relaycore.app";
  if (!pub || !priv) return null;
  return { pub, priv, sub };
}

export function isWebPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

// Redis key for storing subscriptions
const SUBS_KEY = "push:subscriptions";

export interface StoredSubscription {
  id: string;
  subscription: webpush.PushSubscription;
  createdAt: string;
  label?: string;
}

export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  const r = getRedis();
  await r.hset(SUBS_KEY, { [sub.id]: JSON.stringify(sub) });
}

export async function removeSubscription(id: string): Promise<void> {
  const r = getRedis();
  await r.hdel(SUBS_KEY, id);
}

export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  const r = getRedis();
  const raw = await r.hgetall<Record<string, string>>(SUBS_KEY);
  if (!raw) return [];
  return Object.values(raw).map((v) =>
    typeof v === "string" ? JSON.parse(v) : v
  ) as StoredSubscription[];
}

export async function sendPushNotifications(
  routeName: string,
  routeSlug: string,
  event: RelayEventInput
): Promise<{ sent: number; failed: number }> {
  const vapid = getVapidConfig();
  if (!vapid) return { sent: 0, failed: 0 };

  const subs = await getAllSubscriptions();
  if (subs.length === 0) return { sent: 0, failed: 0 };

  webpush.setVapidDetails(vapid.sub, vapid.pub, vapid.priv);

  const emoji = LEVEL_EMOJI[event.level ?? "info"];
  const title = `${emoji} ${event.title ?? routeName}`;
  const body = event.message ?? `New ${event.level ?? "info"} event on route /${routeSlug}`;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: `relay-${routeSlug}`,
    data: { routeSlug, level: event.level },
  });

  let sent = 0;
  let failed = 0;
  const toRemove: string[] = [];

  await Promise.allSettled(
    subs.map(async (stored) => {
      try {
        await webpush.sendNotification(stored.subscription, payload);
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 410 Gone = subscription expired/unsubscribed
        if (status === 410 || status === 404) {
          toRemove.push(stored.id);
        }
        failed++;
      }
    })
  );

  // Clean up expired subscriptions
  if (toRemove.length > 0) {
    await Promise.all(toRemove.map(removeSubscription));
  }

  return { sent, failed };
}
