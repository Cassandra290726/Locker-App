import { NextResponse } from "next/server";

import {
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/authShared";
import { verifyCredentials } from "@/lib/authServer";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password || !isValidEmailFormat(email)) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const account = await verifyCredentials(email, password);
  if (!account) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const normalized = normalizeEmail(email);
  const token = await createSessionToken({ email: normalized, role: account.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
