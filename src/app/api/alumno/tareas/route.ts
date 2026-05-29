import { NextResponse } from "next/server";

import {
  addTareaAlumno,
  deleteTareaAlumno,
  getTareaAlumno,
  listTareasAlumno,
  updateTareaAlumno,
} from "@/lib/alumnoTareasServer";
import type { DiaCalendarioKey } from "@/lib/horarioShared";
import { getSessionFromCookies } from "@/lib/session";

function requireAlumno() {
  return getSessionFromCookies().then((s) =>
    s && s.role === "alumno" ? s : null,
  );
}

export async function GET(request: Request) {
  const session = await requireAlumno();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const claseId = params.get("claseId") ?? "";

  if (id) {
    const tarea = await getTareaAlumno(session.email, id);
    if (!tarea) {
      return NextResponse.json({ tarea: null }, { status: 404 });
    }
    return NextResponse.json({ tarea });
  }

  const tareas = await listTareasAlumno(
    session.email,
    claseId || undefined,
  );
  return NextResponse.json({ tareas });
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

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const descripcion =
    typeof body.descripcion === "string" ? body.descripcion.trim() : "";
  const claseId = typeof body.claseId === "string" ? body.claseId : "";
  const claseMateria =
    typeof body.claseMateria === "string" ? body.claseMateria : "";
  const claseDia = typeof body.claseDia === "string" ? body.claseDia : "";
  const claseHoraInicio =
    typeof body.claseHoraInicio === "string" ? body.claseHoraInicio : "";
  const claseHoraFinal =
    typeof body.claseHoraFinal === "string" ? body.claseHoraFinal : "";
  const claseSalon = typeof body.claseSalon === "string" ? body.claseSalon : "";
  const entregaHoraInicio =
    typeof body.entregaHoraInicio === "string" ? body.entregaHoraInicio : "";
  const entregaHoraFinal =
    typeof body.entregaHoraFinal === "string" ? body.entregaHoraFinal : "";

  if (!nombre) {
    return NextResponse.json(
      { ok: false, error: "Indica el nombre de la tarea." },
      { status: 400 },
    );
  }
  if (!claseId) {
    return NextResponse.json(
      { ok: false, error: "Clase no válida." },
      { status: 400 },
    );
  }

  const tarea = await addTareaAlumno(session.email, {
    claseId,
    claseMateria,
    claseDia: claseDia as DiaCalendarioKey,
    claseHoraInicio,
    claseHoraFinal,
    claseSalon,
    nombre,
    descripcion,
    entregaHoraInicio,
    entregaHoraFinal,
  });
  return NextResponse.json({ ok: true, tarea });
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
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const descripcion =
    typeof body.descripcion === "string" ? body.descripcion.trim() : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }
  if (!nombre) {
    return NextResponse.json(
      { ok: false, error: "Indica el nombre de la tarea." },
      { status: 400 },
    );
  }

  const tarea = await updateTareaAlumno(session.email, id, {
    nombre,
    descripcion,
  });
  if (!tarea) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, tarea });
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
  const ok = await deleteTareaAlumno(session.email, id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
