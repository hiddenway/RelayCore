import { NextRequest, NextResponse } from "next/server";
import { isSetupCompleted } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const completed = await isSetupCompleted();
  if (completed) return NextResponse.json({ error: "Setup already completed" }, { status: 403 });

  const { token } = await request.json();
  const expected = process.env.SETUP_TOKEN;

  if (!expected) return NextResponse.json({ error: "SETUP_TOKEN is not configured" }, { status: 500 });
  if (!token || token !== expected) return NextResponse.json({ error: "Invalid setup password" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
