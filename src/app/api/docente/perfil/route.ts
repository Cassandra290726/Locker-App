import { NextResponse } from "next/server";

import {
  deleteDocentePerfilPublico,
  getDocenteProfile,
  saveDocentePerfilPublico,
  updateDocenteProfile,
} from "@/lib/authServer";
import {
  hayErroresPerfilPublico,
  isValidDocentePerfilPublico,
  type DocentePerfilPublico,
  type DocenteProfile,
  type DocenteSchool,
  validarPerfilPublico,
} from "@/lib/authShared";
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

  if (p.perfilPublico && typeof p.perfilPublico === "object") {
    const pub = p.perfilPublico as Record<string, unknown>;
    patch.perfilPublico = {
      apellidoPaterno:
        typeof pub.apellidoPaterno === "string" ? pub.apellidoPaterno : "",
      apellidoMaterno:
        typeof pub.apellidoMaterno === "string" ? pub.apellidoMaterno : "",
      nombres: typeof pub.nombres === "string" ? pub.nombres : "",
      escuela: typeof pub.escuela === "string" ? pub.escuela : "",
      materias: Array.isArray(pub.materias)
        ? pub.materias.filter((m): m is string => typeof m === "string")
        : [],
      correo: typeof pub.correo === "string" ? pub.correo : "",
      telefono: typeof pub.telefono === "string" ? pub.telefono : "",
      fotoUrl:
        typeof pub.fotoUrl === "string" ? pub.fotoUrl : undefined,
    } as DocentePerfilPublico;
  }

  return patch;
}

function parsePerfilPublicoBody(raw: unknown): DocentePerfilPublico | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const materias: string[] = Array.isArray(p.materias)
    ? p.materias.filter((m): m is string => typeof m === "string").map((m) => m.trim())
    : typeof p.materias === "string"
      ? p.materias
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [];
  return {
    apellidoPaterno:
      typeof p.apellidoPaterno === "string" ? p.apellidoPaterno.trim() : "",
    apellidoMaterno:
      typeof p.apellidoMaterno === "string" ? p.apellidoMaterno.trim() : "",
    nombres: typeof p.nombres === "string" ? p.nombres.trim() : "",
    escuela: typeof p.escuela === "string" ? p.escuela.trim() : "",
    materias,
    correo: typeof p.correo === "string" ? p.correo.trim() : "",
    telefono: typeof p.telefono === "string" ? p.telefono.trim() : "",
    fotoUrl:
      typeof p.fotoUrl === "string" && p.fotoUrl.trim()
        ? p.fotoUrl.trim()
        : undefined,
  };
}

export async function GET(request: Request) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const profile = await getDocenteProfile(session.email);
  if (!profile) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("estado") === "1") {
    const tienePerfil =
      Boolean(profile.perfilPublico) &&
      isValidDocentePerfilPublico(profile.perfilPublico!);
    return NextResponse.json({
      tienePerfil,
      perfil: tienePerfil ? profile.perfilPublico : null,
      email: session.email,
    });
  }

  return NextResponse.json({ profile, email: session.email });
}

export async function POST(request: Request) {
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

  const data = parsePerfilPublicoBody(body);
  if (!data) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const errs = validarPerfilPublico(data);
  if (hayErroresPerfilPublico(errs)) {
    return NextResponse.json({ ok: false, errors: errs }, { status: 400 });
  }

  const saved = await saveDocentePerfilPublico(session.email, data);
  if (!saved) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, perfil: saved });
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

export async function DELETE() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const ok = await deleteDocentePerfilPublico(session.email);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
