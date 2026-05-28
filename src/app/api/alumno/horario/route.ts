import { NextResponse } from "next/server";

import {
  addClaseAlumno,
  deleteClaseAlumno,
  listClasesAlumno,
  updateClaseAlumno,
} from "@/lib/alumnoHorarioServer";
import {
  esDiaHabilDocente,
  formatoHoraValido,
  normalizarDiaEntrada,
  parseHoraAMinutos,
  type DiaCalendarioKey,
} from "@/lib/horarioShared";
import { getSessionFromCookies } from "@/lib/session";

function parseBodyClase(raw: Record<string, unknown>): {
  materia: string;
  dia: DiaCalendarioKey | null;
  horaInicio: string;
  horaFinal: string;
  salon: string;
} | null {
  const materia = typeof raw.materia === "string" ? raw.materia : "";
  const diaRaw = typeof raw.dia === "string" ? raw.dia : "";
  const horaInicio = typeof raw.horaInicio === "string" ? raw.horaInicio : "";
  const horaFinal = typeof raw.horaFinal === "string" ? raw.horaFinal : "";
  const salon = typeof raw.salon === "string" ? raw.salon : "";
  const dia = normalizarDiaEntrada(diaRaw);
  return { materia, dia, horaInicio, horaFinal, salon };
}

function validateClasePayload(p: {
  materia: string;
  dia: DiaCalendarioKey | null;
  horaInicio: string;
  horaFinal: string;
  salon: string;
}): string | null {
  if (!p.materia.trim()) return "Falta la materia.";
  if (!p.dia) return "El día no es válido.";
  if (!esDiaHabilDocente(p.dia)) {
    return "Día no válido. Usa Lunes, Martes, Miércoles, Jueves, Viernes o Sábado.";
  }
  if (!p.salon.trim()) return "Indica salón y edificio.";
  if (!formatoHoraValido(p.horaInicio))
    return "Hora de inicio inválida (usa HH:mm, 24 h).";
  if (!formatoHoraValido(p.horaFinal))
    return "Hora final inválida (usa HH:mm, 24 h).";
  const a = parseHoraAMinutos(p.horaInicio);
  const b = parseHoraAMinutos(p.horaFinal);
  if (a === null || b === null || b <= a) {
    return "La hora final debe ser posterior a la de inicio.";
  }
  return null;
}

function requireAlumno() {
  return getSessionFromCookies().then((s) =>
    s && s.role === "alumno" ? s : null,
  );
}

export async function GET() {
  const session = await requireAlumno();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const clases = await listClasesAlumno(session.email);
  return NextResponse.json({ clases });
}

export async function POST(request: Request) {
  const session = await requireAlumno();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const p = parseBodyClase(body);
  if (!p) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const err = validateClasePayload(p);
  if (err || !p.dia) {
    return NextResponse.json({ ok: false, error: err ?? "INVALID" }, { status: 400 });
  }
  const clase = await addClaseAlumno(session.email, {
    materia: p.materia,
    dia: p.dia,
    horaInicio: p.horaInicio,
    horaFinal: p.horaFinal,
    salon: p.salon,
  });
  return NextResponse.json({ ok: true, clase });
}

export async function PATCH(request: Request) {
  const session = await requireAlumno();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }
  const p = parseBodyClase(body);
  if (!p) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const err = validateClasePayload(p);
  if (err || !p.dia) {
    return NextResponse.json({ ok: false, error: err ?? "INVALID" }, { status: 400 });
  }
  const updated = await updateClaseAlumno(session.email, id, {
    materia: p.materia,
    dia: p.dia,
    horaInicio: p.horaInicio,
    horaFinal: p.horaFinal,
    salon: p.salon,
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, clase: updated });
}

export async function DELETE(request: Request) {
  const session = await requireAlumno();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }
  const ok = await deleteClaseAlumno(session.email, id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
