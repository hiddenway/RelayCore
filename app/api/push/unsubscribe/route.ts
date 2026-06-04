import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { removeSubscription } from "@/lib/push";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await removeSubscription(id);
  return NextResponse.json({ ok: true });
}
