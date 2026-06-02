import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSetupCompleted, markSetupCompleted, saveAdmin, saveBot, saveRoute } from "@/lib/redis";
import { hashPassword, encryptToken, generateApiKey, encryptApiKey, generateId } from "@/lib/crypto";
import { validateBotToken } from "@/lib/telegram";
import { createSession, setSessionCookie } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const setupSchema = z.object({
  setupToken: z.string().min(1),
  username: z.string().min(3).max(32),
  password: z.string().min(8),
  botToken: z.string().min(1),
  botName: z.string().min(1).max(64),
  botChatId: z.string().min(1),
  botThreadId: z.string().optional(),
  routeName: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
  const completed = await isSetupCompleted();
  if (completed) return NextResponse.json({ error: "Setup already completed" }, { status: 403 });

  const expectedToken = process.env.SETUP_PASSWORD;
  if (!expectedToken) return NextResponse.json({ error: "SETUP_PASSWORD not configured" }, { status: 500 });

  let body: z.infer<typeof setupSchema>;
  try {
    body = setupSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", details: err }, { status: 400 });
  }

  if (body.setupToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });
  }

  const botValidation = await validateBotToken(body.botToken);
  if (!botValidation.valid) {
    return NextResponse.json({ error: `Invalid bot token: ${botValidation.error}` }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  await saveAdmin({ username: body.username, passwordHash, createdAt: new Date().toISOString() });

  const botId = generateId();
  const bot = {
    id: botId,
    name: body.botName,
    tokenEncrypted: encryptToken(body.botToken),
    username: botValidation.username,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  await saveBot(bot);

  const slug = slugify(body.routeName);
  const apiKey = generateApiKey();
  const apiKeyEncrypted = encryptApiKey(apiKey);
  const route = {
    slug,
    name: body.routeName,
    apiKeyEncrypted,
    targets: [{ botId, chatId: body.botChatId, threadId: body.botThreadId || undefined, chatName: "Default Chat" }],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveRoute(route);
  await markSetupCompleted();

  const sessionToken = await createSession(body.username);
  await setSessionCookie(sessionToken);

  return NextResponse.json({ ok: true, routeSlug: slug, apiKey });
}

export async function GET() {
  const completed = await isSetupCompleted();
  return NextResponse.json({ completed });
}
