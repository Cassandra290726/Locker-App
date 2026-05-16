import { NextResponse } from "next/server";

import { getAccount } from "@/lib/authServer";
import { getSessionFromCookies } from "@/lib/session";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const account = await getAccount(session.email);
  if (!account || account.role !== session.role) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session });
}
