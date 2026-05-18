import { NextResponse } from "next/server";

import {
  getAlumnoProfile,
  getDocentePublicoSiCoincide,
  listDocentesParaAlumno,
} from "@/lib/authServer";
import { listClasesDocente } from "@/lib/horarioServer";
import { getSessionFromCookies } from "@/lib/session";

async function requireAlumno() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "alumno") return null;
  const profile = await getAlumnoProfile(session.email);
  if (!profile) return null;
  return { session, profile };
}

export async function GET(request: Request) {
  const ctx = await requireAlumno();
  if (!ctx) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const emailDocente = searchParams.get("email");
  const horarioOnly = searchParams.get("horario") === "1";

  if (emailDocente && horarioOnly) {
    const pub = await getDocentePublicoSiCoincide(
      emailDocente,
      ctx.profile.institucion,
    );
    if (!pub) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const clases = await listClasesDocente(pub.email);
    const materiasHorario = [...new Set(clases.map((c) => c.materia))];
    return NextResponse.json({
      docente: pub,
      clases,
      materiasHorario,
    });
  }

  if (emailDocente) {
    const pub = await getDocentePublicoSiCoincide(
      emailDocente,
      ctx.profile.institucion,
    );
    if (!pub) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const clases = await listClasesDocente(pub.email);
    const materiasHorario = [...new Set(clases.map((c) => c.materia))];
    const materias =
      pub.materias.length > 0 ? pub.materias : materiasHorario;
    return NextResponse.json({
      docente: { ...pub, materias },
    });
  }

  const q = searchParams.get("q") ?? "";
  const docentes = await listDocentesParaAlumno(ctx.profile.institucion, q);
  return NextResponse.json({ docentes });
}
