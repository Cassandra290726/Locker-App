import type { DocenteNotasData, NotaDocente } from "@/lib/notasShared";

export async function fetchAlumnoNotas(): Promise<DocenteNotasData | null> {
  const res = await fetch("/api/alumno/notas", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as DocenteNotasData;
}

export async function guardarCategoriasAlumnoApi(
  categorias: DocenteNotasData["categorias"],
): Promise<{ ok: boolean }> {
  const res = await fetch("/api/alumno/notas", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categorias }),
  });
  const data = (await res.json()) as { ok?: boolean };
  return { ok: Boolean(res.ok && data.ok) };
}

export async function crearNotaAlumnoApi(input: {
  titulo: string;
  contenido: string;
  categoriaId: string;
  tipo?: "texto" | "lista";
  itemsLista?: { id: string; texto: string; hecho: boolean }[];
}): Promise<{ ok: boolean; nota?: NotaDocente }> {
  const res = await fetch("/api/alumno/notas", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { ok?: boolean; nota?: NotaDocente };
  if (res.ok && data.ok && data.nota) return { ok: true, nota: data.nota };
  return { ok: false };
}

export async function actualizarNotaAlumnoApi(
  id: string,
  patch: Partial<{
    titulo: string;
    contenido: string;
    categoriaId: string;
    tipo: "texto" | "lista";
    itemsLista: { id: string; texto: string; hecho: boolean }[];
  }>,
): Promise<{ ok: boolean; nota?: NotaDocente }> {
  const res = await fetch("/api/alumno/notas", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  const data = (await res.json()) as { ok?: boolean; nota?: NotaDocente };
  if (res.ok && data.ok && data.nota) return { ok: true, nota: data.nota };
  return { ok: false };
}
