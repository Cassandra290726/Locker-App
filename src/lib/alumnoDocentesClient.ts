import type { DocenteClaseGuardada } from "@/lib/horarioShared";

export type DocentePublico = {
  email: string;
  nombre: string;
  apellidos: string;
  escuelas: string[];
  materias: string[];
  telefono: string;
  fotoUrl: string | null;
};

export async function fetchDocentesAlumno(
  q?: string,
): Promise<DocentePublico[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const url = `/api/alumno/docentes${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const data = (await res.json()) as { docentes?: DocentePublico[] };
  return Array.isArray(data.docentes) ? data.docentes : [];
}

export async function fetchDocenteDetalle(
  email: string,
): Promise<DocentePublico | null> {
  const url = `/api/alumno/docentes?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { docente?: DocentePublico };
  return data.docente ?? null;
}

export async function fetchHorarioDocenteAlumno(
  email: string,
): Promise<{ docente: DocentePublico; clases: DocenteClaseGuardada[] } | null> {
  const url = `/api/alumno/docentes?email=${encodeURIComponent(email)}&horario=1`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    docente?: DocentePublico;
    clases?: DocenteClaseGuardada[];
  };
  if (!data.docente || !Array.isArray(data.clases)) return null;
  return { docente: data.docente, clases: data.clases };
}
