import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getAllRoutes, saveRoute, getRoute } from "@/lib/redis";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import { slugify } from "@/lib/utils";

const targetSchema = z.object({
  botId: z.string().min(1),
  chatId: z.string().min(1),
  threadId: z.string().optional(),
  chatName: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  targets: z.array(targetSchema).min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const routes = await getAllRoutes();
  const safe = routes.map(({ apiKeyHash: _, ...r }) => r);
  return NextResponse.json({ routes: safe });
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

  const slug = slugify(body.name);
  const existing = await getRoute(slug);
  if (existing) return NextResponse.json({ error: "Route with this slug already exists" }, { status: 409 });

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  const route = {
    slug,
    name: body.name,
    description: body.description,
    apiKeyHash,
    targets: body.targets,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveRoute(route);

  const { apiKeyHash: _, ...safe } = route;
  return NextResponse.json({ route: safe, apiKey }, { status: 201 });
}
