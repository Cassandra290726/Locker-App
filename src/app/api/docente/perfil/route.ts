import { NextResponse } from "next/server";

import { getDocenteProfile, updateDocenteProfile } from "@/lib/authServer";
import type { DocenteProfile, DocenteSchool } from "@/lib/authShared";
import { getSessionFromCookies } from "@/lib/session";

function parseProfileBody(raw: unknown): Partial<DocenteProfile> | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const patch: Partial<DocenteProfile> = {};

  if (typeof p.nombre === "string") patch.nombre = p.nombre.trim();
  if (typeof p.apellidos === "string") patch.apellidos = p.apellidos.trim();
  if (typeof p.telefono === "string") patch.telefono = p.telefono.trim();
  if (typeof p.fotoUrl === "string") patch.fotoUrl = p.fotoUrl.trim();

  if (typeof p.materias === "string") {
    patch.materias = p.materias
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  } else if (Array.isArray(p.materias)) {
    patch.materias = p.materias
      .filter((m): m is string => typeof m === "string")
      .map((m) => m.trim())
      .filter(Boolean);
  }

  if (Array.isArray(p.escuelas)) {
    const escuelas: DocenteSchool[] = p.escuelas
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const s = item as Record<string, unknown>;
        return {
          escuela: typeof s.escuela === "string" ? s.escuela.trim() : "",
          matricula: typeof s.matricula === "string" ? s.matricula.trim() : "",
        };
      });
    patch.escuelas = escuelas;
  }

  return patch;
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const profile = await getDocenteProfile(session.email);
  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ profile, email: session.email });
}

export async function PATCH(request: Request) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const patch = parseProfileBody(body);
  if (!patch) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const updated = await updateDocenteProfile(session.email, patch);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile: updated });
}
