import type { DiaCalendarioKey, DocenteClaseGuardada } from "@/lib/horarioShared";

export async function fetchClasesDocente(): Promise<DocenteClaseGuardada[]> {
  const res = await fetch("/api/docente/horario", { credentials: "include" });
  if (!res.ok) return [];
  const data = (await res.json()) as { clases?: DocenteClaseGuardada[] };
  return Array.isArray(data.clases) ? data.clases : [];
}

export async function registrarClaseDocente(body: {
  materia: string;
  dia: DiaCalendarioKey;
  horaInicio: string;
  horaFinal: string;
  salon: string;
}): Promise<{ ok: boolean; error?: string; clase?: DocenteClaseGuardada }> {
  const res = await fetch("/api/docente/horario", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    clase?: DocenteClaseGuardada;
  };
  if (res.ok && data.ok && data.clase) return { ok: true, clase: data.clase };
  return {
    ok: false,
    error: typeof data.error === "string" ? data.error : "SAVE_FAILED",
  };
}

export async function actualizarClaseDocente(
  id: string,
  body: Omit<DocenteClaseGuardada, "id">,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/docente/horario", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...body }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return {
    ok: false,
    error: typeof data.error === "string" ? data.error : "SAVE_FAILED",
  };
}

export async function eliminarClaseDocente(
  id: string,
): Promise<{ ok: boolean }> {
  const url = `/api/docente/horario?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  const data = (await res.json()) as { ok?: boolean };
  return res.ok && data.ok ? { ok: true } : { ok: false };
}
