import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRoute, saveRoute } from "@/lib/redis";
import { generateApiKey, hashApiKey } from "@/lib/crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const route = await getRoute(slug);
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  await saveRoute({ ...route, apiKeyHash, updatedAt: new Date().toISOString() });

  return NextResponse.json({ apiKey });
}
