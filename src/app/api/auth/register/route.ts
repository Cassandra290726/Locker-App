import { NextResponse } from "next/server";

import {
  isValidAlumnoProfile,
  isValidDocenteProfile,
  isValidEmailFormat,
  isValidPassword,
  normalizeEmail,
  type AlumnoProfile,
  type DocenteProfile,
  type UserRole,
} from "@/lib/authShared";
import { registerAccount } from "@/lib/authServer";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

function parseDocenteProfile(raw: unknown): DocenteProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const nombre = typeof p.nombre === "string" ? p.nombre.trim() : "";
  if (!Array.isArray(p.escuelas)) return null;
  const escuelas = p.escuelas
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const s = item as Record<string, unknown>;
      return {
        escuela: typeof s.escuela === "string" ? s.escuela.trim() : "",
        matricula: typeof s.matricula === "string" ? s.matricula.trim() : "",
      };
    });
  return { nombre, escuelas };
}

function parseAlumnoProfile(raw: unknown): AlumnoProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return {
    nombre: typeof p.nombre === "string" ? p.nombre.trim() : "",
    institucion: typeof p.institucion === "string" ? p.institucion.trim() : "",
    municipio: typeof p.municipio === "string" ? p.municipio.trim() : "",
    plantel: typeof p.plantel === "string" ? p.plantel.trim() : "",
    turno: typeof p.turno === "string" ? p.turno.trim() : "",
  };
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    role?: string;
    docenteProfile?: unknown;
    alumnoProfile?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (!email || !password || !isValidEmailFormat(email) || !isValidPassword(password)) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }

  if (role !== "docente" && role !== "alumno") {
    return NextResponse.json({ ok: false, error: "INVALID_ROLE" }, { status: 400 });
  }

  let docenteProfile: DocenteProfile | undefined;
  let alumnoProfile: AlumnoProfile | undefined;
  if (role === "docente") {
    const parsed = parseDocenteProfile(body.docenteProfile);
    if (!parsed || !isValidDocenteProfile(parsed)) {
      return NextResponse.json({ ok: false, error: "INVALID_PROFILE" }, { status: 400 });
    }
    docenteProfile = parsed;
  }
  if (role === "alumno") {
    const parsed = parseAlumnoProfile(body.alumnoProfile);
    if (!parsed || !isValidAlumnoProfile(parsed)) {
      return NextResponse.json({ ok: false, error: "INVALID_PROFILE" }, { status: 400 });
    }
    alumnoProfile = parsed;
  }

  try {
    await registerAccount(
      email,
      password,
      role as UserRole,
      docenteProfile,
      alumnoProfile,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return NextResponse.json({ ok: false, error: "EMAIL_TAKEN" }, { status: 409 });
    }
    throw err;
  }

  const normalized = normalizeEmail(email);
  const token = await createSessionToken({ email: normalized, role: role as UserRole });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
