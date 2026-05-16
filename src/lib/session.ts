import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import type { SessionUser } from "@/lib/authShared";

export const SESSION_COOKIE = "locker_session";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 días

function getSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ?? "dev-only-change-in-production-locker";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = payload.email;
    const role = payload.role;
    if (typeof email !== "string" || (role !== "docente" && role !== "alumno")) {
      return null;
    }
    return { email, role };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};
