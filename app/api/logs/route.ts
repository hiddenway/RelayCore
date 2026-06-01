import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRecentEvents, getRouteEvents } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const routeSlug = searchParams.get("route");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const events = routeSlug
    ? await getRouteEvents(routeSlug, limit)
    : await getRecentEvents(limit);

  return NextResponse.json({ events });
}
