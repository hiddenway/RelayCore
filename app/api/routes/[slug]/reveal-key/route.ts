import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRoute } from "@/lib/redis";
import { decryptApiKey } from "@/lib/crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const route = await getRoute(slug);
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const apiKey = decryptApiKey(route.apiKeyEncrypted);
    return NextResponse.json({ apiKey });
  } catch {
    return NextResponse.json({ error: "Could not decrypt key" }, { status: 500 });
  }
}
