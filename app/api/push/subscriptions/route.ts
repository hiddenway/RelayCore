import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllSubscriptions, isWebPushConfigured } from "@/lib/push";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configured = isWebPushConfigured();
  const subscriptions = configured ? await getAllSubscriptions() : [];

  return NextResponse.json({
    configured,
    subscriptions: subscriptions.map(({ id, label, createdAt }) => ({ id, label, createdAt })),
  });
}
