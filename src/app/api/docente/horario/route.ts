import { NextResponse } from "next/server";

import { getSessionFromCookies } from "@/lib/session";
import {
  esDiaHabilDocente,
  formatoHoraValido,
  normalizarDiaEntrada,
  parseHoraAMinutos,
  type DiaCalendarioKey,
} from "@/lib/horarioShared";
import {
  addClaseDocente,
  deleteClaseDocente,
  listClasesDocente,
  updateClaseDocente,
} from "@/lib/horarioServer";

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

  return {
    materia,
    dia,
    horaInicio,
    horaFinal,
    salon,
  };
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
  if (!esDiaHabilDocente(p.dia)) return "Usa un día de lunes a sábado.";
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

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const clases = await listClasesDocente(session.email);
  return NextResponse.json({ clases });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
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
  const clase = await addClaseDocente(session.email, {
    materia: p.materia,
    dia: p.dia,
    horaInicio: p.horaInicio,
    horaFinal: p.horaFinal,
    salon: p.salon,
  });
  return NextResponse.json({ ok: true, clase });
}

export async function PATCH(request: Request) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
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
  const updated = await updateClaseDocente(session.email, id, {
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
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }
  const ok = await deleteClaseDocente(session.email, id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
