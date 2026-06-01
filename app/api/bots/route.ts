import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getAllBots, saveBot } from "@/lib/redis";
import { encryptToken, generateId } from "@/lib/crypto";
import { validateBotToken } from "@/lib/telegram";

const createSchema = z.object({
  name: z.string().min(1).max(64),
  token: z.string().min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bots = await getAllBots();
  // Never expose tokens
  const safe = bots.map(({ tokenEncrypted: _, ...b }) => b);
  return NextResponse.json({ bots: safe });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validation = await validateBotToken(body.token);
  if (!validation.valid) {
    return NextResponse.json({ error: `Invalid bot token: ${validation.error}` }, { status: 400 });
  }

  const bot = {
    id: generateId(),
    name: body.name,
    tokenEncrypted: encryptToken(body.token),
    username: validation.username,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  await saveBot(bot);

  const { tokenEncrypted: _, ...safe } = bot;
  return NextResponse.json({ bot: safe }, { status: 201 });
}
