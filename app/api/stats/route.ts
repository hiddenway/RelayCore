import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGlobalStats, getTodayStats, getAllBots, getAllRoutes } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [global, today, bots, routes] = await Promise.all([
    getGlobalStats(),
    getTodayStats(),
    getAllBots(),
    getAllRoutes(),
  ]);

  return NextResponse.json({
    global,
    today,
    activeBots: bots.filter((b) => b.enabled).length,
    totalBots: bots.length,
    activeRoutes: routes.filter((r) => r.enabled).length,
    totalRoutes: routes.length,
  });
}
