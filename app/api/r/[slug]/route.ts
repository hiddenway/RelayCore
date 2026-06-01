import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRoute, getBot, saveEvent, incrementStats } from "@/lib/redis";
import { verifyApiKey } from "@/lib/crypto";
import { sendTelegramMessage, formatMessage } from "@/lib/telegram";
import type { EventLog, DeliveryResult } from "@/types";
import { v4 as uuidv4 } from "uuid";

const bodySchema = z.object({
  title: z.string().max(256).optional(),
  message: z.string().max(4096).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  level: z.enum(["info", "success", "warning", "error"]).optional().default("info"),
});

// Simple in-memory rate limiter per route slug (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(slug: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(slug);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(slug, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!checkRateLimit(slug)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const route = await getRoute(slug);
  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });
  if (!route.enabled) return NextResponse.json({ error: "Route disabled" }, { status: 403 });

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });

  const valid = await verifyApiKey(apiKey, route.apiKeyHash);
  if (!valid) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const event: EventLog = {
    id: uuidv4(),
    routeSlug: slug,
    title: body.title,
    message: body.message,
    payload: body.payload as Record<string, unknown> | undefined,
    level: body.level,
    deliveries: [],
    timestamp: new Date().toISOString(),
  };

  const text = formatMessage(route.name, body);
  const deliveries: DeliveryResult[] = [];

  for (const target of route.targets) {
    const bot = await getBot(target.botId);
    if (!bot || !bot.enabled) {
      deliveries.push({ botId: target.botId, chatId: target.chatId, success: false, error: "Bot not found or disabled" });
      continue;
    }
    const result = await sendTelegramMessage(bot, target.chatId, text);
    deliveries.push(result);
  }

  event.deliveries = deliveries;

  const anySuccess = deliveries.some((d) => d.success);
  await Promise.all([
    saveEvent(event),
    incrementStats(slug, anySuccess),
  ]);

  return NextResponse.json({
    id: event.id,
    timestamp: event.timestamp,
    delivered: deliveries.filter((d) => d.success).length,
    failed: deliveries.filter((d) => !d.success).length,
    deliveries,
  });
}
