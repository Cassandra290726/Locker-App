import type { AlumnoTareaInput, AlumnoTareaPendiente } from "@/lib/tareasShared";

export async function fetchTareasAlumno(
  claseId: string,
): Promise<AlumnoTareaPendiente[]> {
  const url = `/api/alumno/tareas?claseId=${encodeURIComponent(claseId)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const data = (await res.json()) as { tareas?: AlumnoTareaPendiente[] };
  return Array.isArray(data.tareas) ? data.tareas : [];
}

export async function fetchTareaAlumno(
  tareaId: string,
): Promise<AlumnoTareaPendiente | null> {
  const url = `/api/alumno/tareas?id=${encodeURIComponent(tareaId)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { tarea?: AlumnoTareaPendiente | null };
  return data.tarea ?? null;
}

export async function crearTareaAlumno(
  body: AlumnoTareaInput,
): Promise<{ ok: boolean; error?: string; tarea?: AlumnoTareaPendiente }> {
  const res = await fetch("/api/alumno/tareas", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    tarea?: AlumnoTareaPendiente;
  };
  if (res.ok && data.ok && data.tarea) return { ok: true, tarea: data.tarea };
  return {
    ok: false,
    error: typeof data.error === "string" ? data.error : "SAVE_FAILED",
  };
}

export async function actualizarTareaAlumno(
  id: string,
  body: { nombre: string; descripcion: string },
): Promise<{ ok: boolean; error?: string; tarea?: AlumnoTareaPendiente }> {
  const res = await fetch("/api/alumno/tareas", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...body }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    tarea?: AlumnoTareaPendiente;
  };
  if (res.ok && data.ok && data.tarea) return { ok: true, tarea: data.tarea };
  return {
    ok: false,
    error: typeof data.error === "string" ? data.error : "SAVE_FAILED",
  };
}

export async function eliminarTareaAlumno(id: string): Promise<{ ok: boolean }> {
  const url = `/api/alumno/tareas?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  const data = (await res.json()) as { ok?: boolean };
  return res.ok && data.ok ? { ok: true } : { ok: false };
}
