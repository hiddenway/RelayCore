import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getBot, saveBot, deleteBot } from "@/lib/redis";

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  const bot = await getBot(botId);
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = { ...bot, ...body };
  await saveBot(updated);

  const { tokenEncrypted: _, ...safe } = updated;
  return NextResponse.json({ bot: safe });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { botId } = await params;
  await deleteBot(botId);
  return NextResponse.json({ ok: true });
}
