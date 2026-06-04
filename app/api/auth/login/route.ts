import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin, checkLoginRateLimit, recordFailedLogin, clearLoginAttempts } from "@/lib/redis";
import { verifyPassword } from "@/lib/crypto";
import { createSession, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Check if IP is blocked
  const limit = await checkLoginRateLimit(ip);
  if (limit.blocked) {
    const minutes = Math.ceil((limit.retryAfter ?? 900) / 60);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "No admin configured" }, { status: 401 });

  const credentialsValid =
    admin.username === body.username &&
    (await verifyPassword(body.password, admin.passwordHash));

  if (!credentialsValid) {
    const result = await recordFailedLogin(ip);
    if (result.blocked) {
      const minutes = Math.ceil((result.retryAfter ?? 900) / 60);
      return NextResponse.json(
        { error: `Too many failed attempts. Blocked for ${minutes} minute${minutes !== 1 ? "s" : ""}.` },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Invalid credentials. ${result.remaining} attempt${result.remaining !== 1 ? "s" : ""} remaining.` },
      { status: 401 }
    );
  }

  // Success — clear any previous failed attempts
  await clearLoginAttempts(ip);

  const token = await createSession(admin.username);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
