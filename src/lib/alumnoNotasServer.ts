import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { normalizeEmail } from "@/lib/authShared";
import {
  asegurarEstructuraNotas,
  type DocenteNotasData,
  type ItemListaNota,
  type NotaCategoria,
  type NotaDocente,
  type TipoNotaDocente,
} from "@/lib/notasShared";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTAS_FILE = path.join(DATA_DIR, "alumno_notas.json");

type Store = Record<string, DocenteNotasData>;

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(NOTAS_FILE, "utf8");
    const p = JSON.parse(raw) as Store;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await ensureDir();
  await writeFile(NOTAS_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function getAlumnoNotasData(email: string): Promise<DocenteNotasData> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const raw = store[key] ?? {};
  const data = asegurarEstructuraNotas(raw);
  store[key] = data;
  await writeStore(store);
  return data;
}

export async function guardarCategoriasAlumno(
  email: string,
  incoming: NotaCategoria[],
): Promise<DocenteNotasData> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const prev = asegurarEstructuraNotas(store[key] ?? {});
  const slice = incoming.slice(0, 5);
  if (slice.length !== 5) return prev;
  const merged: NotaCategoria[] = slice.map((c, i) => ({
    id: c.id || prev.categorias[i].id,
    nombre: (c.nombre ?? "").trim() || prev.categorias[i].nombre,
    color: prev.categorias[i].color,
  }));
  const next = { ...prev, categorias: merged };
  store[key] = next;
  await writeStore(store);
  return next;
}

export async function crearNotaAlumno(
  email: string,
  input: {
    titulo: string;
    contenido: string;
    categoriaId: string;
    tipo?: TipoNotaDocente;
    itemsLista?: ItemListaNota[];
  },
): Promise<NotaDocente> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const now = new Date().toISOString();
  const nota: NotaDocente = {
    id: randomUUID(),
    categoriaId: input.categoriaId,
    tipo: input.tipo === "lista" ? "lista" : "texto",
    titulo: input.titulo.trim() || "Sin título",
    contenido: input.contenido,
    itemsLista: input.itemsLista ?? [],
    createdAt: now,
    updatedAt: now,
  };
  data.notas.push(nota);
  store[key] = data;
  await writeStore(store);
  return nota;
}

export async function actualizarNotaAlumno(
  email: string,
  id: string,
  patch: Partial<{
    titulo: string;
    contenido: string;
    categoriaId: string;
    tipo: TipoNotaDocente;
    itemsLista: ItemListaNota[];
  }>,
): Promise<NotaDocente | null> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const idx = data.notas.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const prev = data.notas[idx];
  data.notas[idx] = {
    ...prev,
    ...patch,
    titulo: patch.titulo !== undefined ? patch.titulo.trim() || "Sin título" : prev.titulo,
    updatedAt: new Date().toISOString(),
  };
  store[key] = data;
  await writeStore(store);
  return data.notas[idx];
}

export async function eliminarNotaAlumno(
  email: string,
  id: string,
): Promise<boolean> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const next = data.notas.filter((n) => n.id !== id);
  if (next.length === data.notas.length) return false;
  data.notas = next;
  store[key] = data;
  await writeStore(store);
  return true;
}
