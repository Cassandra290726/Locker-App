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
const NOTAS_FILE = path.join(DATA_DIR, "docente_notas.json");

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

export async function getDocenteNotasData(email: string): Promise<DocenteNotasData> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const raw = store[key] ?? {};
  const data = asegurarEstructuraNotas(raw);
  store[key] = data;
  await writeStore(store);
  return data;
}

export async function guardarCategoriasDocente(
  email: string,
  incoming: NotaCategoria[],
): Promise<DocenteNotasData> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const prev = asegurarEstructuraNotas(store[key] ?? {});
  const slice = incoming.slice(0, 5);
  if (slice.length !== 5) {
    return prev;
  }
  const merged: NotaCategoria[] = slice.map((c, i) => ({
    id: prev.categorias[i].id,
    nombre: (c.nombre ?? "").trim() || `Categoría ${i + 1}`,
    color: prev.categorias[i].color,
  }));
  const data: DocenteNotasData = { categorias: merged, notas: prev.notas };
  store[key] = data;
  await writeStore(store);
  return data;
}

export async function crearNotaDocente(
  email: string,
  input: {
    titulo: string;
    contenido: string;
    categoriaId: string;
    tipo: TipoNotaDocente;
    itemsLista?: unknown;
  },
): Promise<NotaDocente> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const now = new Date().toISOString();
  const tipo = input.tipo === "lista" ? "lista" : "texto";
  const itemsLista = tipo === "lista" ? sanitizarItemsLista(input.itemsLista) : [];
  const nota: NotaDocente = {
    id: randomUUID(),
    categoriaId: input.categoriaId,
    tipo,
    titulo: input.titulo.trim() || "Sin título",
    contenido: tipo === "texto" ? input.contenido : "",
    itemsLista,
    createdAt: now,
    updatedAt: now,
  };
  data.notas = [...data.notas, nota];
  store[key] = data;
  await writeStore(store);
  return nota;
}

export async function actualizarNotaDocente(
  email: string,
  id: string,
  patch: Partial<
    Pick<NotaDocente, "titulo" | "contenido" | "categoriaId" | "tipo"> & {
      itemsLista?: unknown;
    }
  >,
): Promise<NotaDocente | null> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const idx = data.notas.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const cur = data.notas[idx];
  const tipo =
    patch.tipo === "lista" || patch.tipo === "texto" ? patch.tipo : cur.tipo;
  const next: NotaDocente = {
    ...cur,
    tipo,
    titulo:
      patch.titulo !== undefined ? patch.titulo.trim() || "Sin título" : cur.titulo,
    categoriaId: patch.categoriaId ?? cur.categoriaId,
    contenido:
      tipo === "texto"
        ? patch.contenido !== undefined
          ? patch.contenido
          : cur.contenido
        : "",
    itemsLista:
      tipo === "lista"
        ? patch.itemsLista !== undefined
          ? sanitizarItemsLista(patch.itemsLista)
          : cur.itemsLista
        : [],
    updatedAt: new Date().toISOString(),
  };
  const list = [...data.notas];
  list[idx] = next;
  store[key] = { ...data, notas: list };
  await writeStore(store);
  return next;
}

export async function eliminarNotaDocente(email: string, id: string): Promise<boolean> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const data = asegurarEstructuraNotas(store[key] ?? {});
  const next = data.notas.filter((n) => n.id !== id);
  if (next.length === data.notas.length) return false;
  store[key] = { ...data, notas: next };
  await writeStore(store);
  return true;
}

function sanitizarItemsLista(raw: unknown): ItemListaNota[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it) => ({
      id: typeof it.id === "string" && it.id ? it.id : randomUUID(),
      texto: typeof it.texto === "string" ? it.texto : "",
      hecho: Boolean(it.hecho),
    }));
}
