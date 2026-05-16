import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/session";

const PROTECTED_PREFIXES = ["/agenda", "/perfil"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/agenda/:path*", "/perfil/:path*"],
};
