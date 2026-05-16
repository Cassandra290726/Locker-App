import type { DocenteNotasData, NotaDocente } from "@/lib/notasShared";

export async function fetchDocenteNotas(): Promise<DocenteNotasData | null> {
  const res = await fetch("/api/docente/notas", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as DocenteNotasData;
}

export async function guardarCategoriasApi(
  categorias: DocenteNotasData["categorias"],
): Promise<{ ok: boolean }> {
  const res = await fetch("/api/docente/notas", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorias }),
  });
  const data = (await res.json()) as { ok?: boolean };
  return { ok: Boolean(res.ok && data.ok) };
}

export async function crearNotaApi(input: {
  titulo: string;
  contenido: string;
  categoriaId: string;
  tipo?: "texto" | "lista";
  itemsLista?: { id: string; texto: string; hecho: boolean }[];
}): Promise<{ ok: boolean; nota?: NotaDocente }> {
  const res = await fetch("/api/docente/notas", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo: input.titulo,
      contenido: input.contenido,
      categoriaId: input.categoriaId,
      tipo: input.tipo ?? "texto",
      itemsLista: input.itemsLista,
    }),
  });
  const data = (await res.json()) as { ok?: boolean; nota?: NotaDocente };
  if (res.ok && data.ok && data.nota) return { ok: true, nota: data.nota };
  return { ok: false };
}

export async function actualizarNotaApi(
  id: string,
  patch: Partial<{
    titulo: string;
    contenido: string;
    categoriaId: string;
    tipo: "texto" | "lista";
    itemsLista: { id: string; texto: string; hecho: boolean }[];
  }>,
): Promise<{ ok: boolean; nota?: NotaDocente }> {
  const res = await fetch("/api/docente/notas", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  const data = (await res.json()) as { ok?: boolean; nota?: NotaDocente };
  if (res.ok && data.ok && data.nota) return { ok: true, nota: data.nota };
  return { ok: false };
}
