import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRoute, saveRoute, deleteRoute } from "@/lib/redis";

const targetSchema = z.object({
  botId: z.string().min(1),
  chatId: z.string().min(1),
  chatName: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  description: z.string().max(256).optional(),
  targets: z.array(targetSchema).min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const route = await getRoute(slug);
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { apiKeyHash: _, ...safe } = route;
  return NextResponse.json({ route: safe });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const route = await getRoute(slug);
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = { ...route, ...body, updatedAt: new Date().toISOString() };
  await saveRoute(updated);

  const { apiKeyHash: _, ...safe } = updated;
  return NextResponse.json({ route: safe });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  await deleteRoute(slug);
  return NextResponse.json({ ok: true });
}
