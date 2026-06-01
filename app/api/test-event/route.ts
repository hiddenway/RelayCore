import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRoute, getBot, saveEvent, incrementStats } from "@/lib/redis";
import { sendTelegramMessage, formatMessage } from "@/lib/telegram";
import type { EventLog } from "@/types";
import { v4 as uuidv4 } from "uuid";

const schema = z.object({
  routeSlug: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const route = await getRoute(body.routeSlug);
  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const testPayload = {
    title: "Test Event",
    message: "This is a test event sent from the RelayCore dashboard.",
    payload: { source: "dashboard", test: true },
    level: "info" as const,
  };

  const text = formatMessage(route.name, testPayload);
  const deliveries = [];

  for (const target of route.targets) {
    const bot = await getBot(target.botId);
    if (!bot || !bot.enabled) {
      deliveries.push({ botId: target.botId, chatId: target.chatId, success: false, error: "Bot not found or disabled" });
      continue;
    }
    const result = await sendTelegramMessage(bot, target.chatId, text);
    deliveries.push(result);
  }

  const event: EventLog = {
    id: uuidv4(),
    routeSlug: route.slug,
    ...testPayload,
    deliveries,
    timestamp: new Date().toISOString(),
  };

  const anySuccess = deliveries.some((d) => d.success);
  await Promise.all([saveEvent(event), incrementStats(route.slug, anySuccess)]);

  return NextResponse.json({ ok: true, deliveries });
}
