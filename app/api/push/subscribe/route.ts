import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveSubscription } from "@/lib/push";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription, label } = await request.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const id = uuidv4();
  await saveSubscription({ id, subscription, label, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, id });
}
