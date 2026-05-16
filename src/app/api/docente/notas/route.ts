import { NextResponse } from "next/server";

import { getSessionFromCookies } from "@/lib/session";
import type { NotaCategoria, TipoNotaDocente } from "@/lib/notasShared";
import {
  actualizarNotaDocente,
  crearNotaDocente,
  eliminarNotaDocente,
  getDocenteNotasData,
  guardarCategoriasDocente,
} from "@/lib/notasServer";

function parseCategorias(raw: unknown): NotaCategoria[] | null {
  if (!Array.isArray(raw) || raw.length !== 5) return null;
  const out: NotaCategoria[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const nombre = typeof o.nombre === "string" ? o.nombre : "";
    const color = typeof o.color === "string" ? o.color : "";
    if (!id) return null;
    out.push({ id, nombre, color });
  }
  return out;
}

function parseTipoNota(raw: unknown): TipoNotaDocente {
  return raw === "lista" ? "lista" : "texto";
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const data = await getDocenteNotasData(session.email);
  return NextResponse.json(data);
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
  const titulo = typeof body.titulo === "string" ? body.titulo : "";
  const contenido = typeof body.contenido === "string" ? body.contenido : "";
  const categoriaId = typeof body.categoriaId === "string" ? body.categoriaId : "";
  const tipo = parseTipoNota(body.tipo);
  const data = await getDocenteNotasData(session.email);
  const catOk = data.categorias.some((c) => c.id === categoriaId);
  if (!catOk) {
    return NextResponse.json({ ok: false, error: "CATEGORIA_INVALIDA" }, { status: 400 });
  }
  const nota = await crearNotaDocente(session.email, {
    titulo,
    contenido,
    categoriaId,
    tipo,
    itemsLista: body.itemsLista,
  });
  return NextResponse.json({ ok: true, nota });
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

  if (Array.isArray(body.categorias)) {
    const parsed = parseCategorias(body.categorias);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "CATEGORIAS_INVALIDAS" }, { status: 400 });
    }
    const data = await guardarCategoriasDocente(session.email, parsed);
    return NextResponse.json({ ok: true, categorias: data.categorias });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }

  const patch: {
    titulo?: string;
    contenido?: string;
    categoriaId?: string;
    tipo?: TipoNotaDocente;
    itemsLista?: unknown;
  } = {};
  if (typeof body.titulo === "string") patch.titulo = body.titulo;
  if (typeof body.contenido === "string") patch.contenido = body.contenido;
  if (typeof body.categoriaId === "string") patch.categoriaId = body.categoriaId;
  if (body.tipo === "lista" || body.tipo === "texto") patch.tipo = body.tipo;
  if (body.itemsLista !== undefined) patch.itemsLista = body.itemsLista;

  if (patch.categoriaId) {
    const data = await getDocenteNotasData(session.email);
    if (!data.categorias.some((c) => c.id === patch.categoriaId)) {
      return NextResponse.json({ ok: false, error: "CATEGORIA_INVALIDA" }, { status: 400 });
    }
  }

  const nota = await actualizarNotaDocente(session.email, id, patch);
  if (!nota) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, nota });
}

export async function DELETE(request: Request) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "docente") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }
  const ok = await eliminarNotaDocente(session.email, id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
