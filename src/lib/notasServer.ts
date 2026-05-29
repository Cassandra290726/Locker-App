import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/authShared";
import {
  asegurarEstructuraNotas,
  type DocenteNotasData,
  type ItemListaNota,
  type NotaCategoria,
  type NotaDocente,
  type TipoNotaDocente,
} from "@/lib/notasShared";

export async function getDocenteNotasData(email: string): Promise<DocenteNotasData> {
  const norm = normalizeEmail(email);
  const categoriasRaw = await db.getDocenteCategorias(norm);
  const notasRaw = await db.listNotasDocente(norm);

  const notas: NotaDocente[] = notasRaw.map((n) => ({
    id: n.id,
    categoriaId: n.categoria_id,
    tipo: n.tipo as TipoNotaDocente,
    titulo: n.titulo,
    contenido: n.contenido,
    itemsLista: (n.items_lista as unknown as ItemListaNota[]) || [],
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));

  const data = asegurarEstructuraNotas({ categorias: categoriasRaw as unknown as NotaCategoria[], notas });

  if (categoriasRaw.length === 0) {
    await db.saveDocenteCategorias(norm, data.categorias);
  }

  return data;
}

export async function guardarCategoriasDocente(
  email: string,
  incoming: NotaCategoria[],
): Promise<DocenteNotasData> {
  const norm = normalizeEmail(email);
  const prevData = await getDocenteNotasData(norm);
  const slice = incoming.slice(0, 5);
  if (slice.length !== 5) {
    return prevData;
  }
  const merged: NotaCategoria[] = slice.map((c, i) => ({
    id: prevData.categorias[i].id,
    nombre: (c.nombre ?? "").trim() || `Categoría ${i + 1}`,
    color: prevData.categorias[i].color,
  }));

  await db.saveDocenteCategorias(norm, merged);

  return { categorias: merged, notas: prevData.notas };
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
): Promise<NotaDocente | null> {
  const norm = normalizeEmail(email);
  const now = new Date().toISOString();
  const tipo = input.tipo === "lista" ? "lista" : "texto";
  const itemsLista = tipo === "lista" ? sanitizarItemsLista(input.itemsLista) : [];
  
  const tituloFinal = input.titulo.trim();
  const contenidoFinal = tipo === "texto" ? input.contenido.trim() : "";
  const isEmpty = !tituloFinal && (tipo === "texto" ? !contenidoFinal : itemsLista.length === 0);
  
  if (isEmpty) {
    return null; // Do not create empty note
  }

  const nota: NotaDocente = {
    id: randomUUID(),
    categoriaId: input.categoriaId,
    tipo,
    titulo: tituloFinal || "Sin título",
    contenido: tipo === "texto" ? input.contenido : "",
    itemsLista,
    createdAt: now,
    updatedAt: now,
  };

  await db.addNotaDocente({
    id: nota.id,
    email: norm,
    titulo: nota.titulo,
    contenido: nota.contenido,
    categoria_id: nota.categoriaId,
    tipo: nota.tipo,
    items_lista: nota.itemsLista,
    created_at: nota.createdAt,
    updated_at: nota.updatedAt,
  });

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
  const norm = normalizeEmail(email);
  const currentNotas = await db.listNotasDocente(norm);
  const cur = currentNotas.find((n) => n.id === id);
  if (!cur) return null;

  const tipo = patch.tipo === "lista" || patch.tipo === "texto" ? patch.tipo : cur.tipo;
  let titulo = patch.titulo !== undefined ? patch.titulo.trim() : cur.titulo;
  const categoriaId = patch.categoriaId ?? cur.categoria_id;
  const contenido =
    tipo === "texto" ? (patch.contenido !== undefined ? patch.contenido : cur.contenido) : "";
  const itemsLista =
    tipo === "lista"
      ? patch.itemsLista !== undefined
        ? sanitizarItemsLista(patch.itemsLista)
        : (cur.items_lista as unknown as ItemListaNota[]) || []
      : [];

  const isEmpty = !titulo.trim() && (tipo === "texto" ? !contenido.trim() : itemsLista.length === 0);
  if (isEmpty) {
    await eliminarNotaDocente(email, id);
    return null; // Return null to indicate it was removed
  }

  if (!titulo.trim()) {
    titulo = "Sin título";
  }

  const updatedAt = new Date().toISOString();

  await db.updateNotaDocente(id, norm, {
    titulo,
    contenido,
    categoria_id: categoriaId,
    tipo,
    items_lista: itemsLista,
    updated_at: updatedAt,
  });

  return {
    id,
    categoriaId,
    tipo: tipo as TipoNotaDocente,
    titulo,
    contenido,
    itemsLista,
    createdAt: cur.created_at,
    updatedAt,
  };
}

export async function eliminarNotaDocente(email: string, id: string): Promise<boolean> {
  const norm = normalizeEmail(email);
  return await db.deleteNotaDocente(id, norm);
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
