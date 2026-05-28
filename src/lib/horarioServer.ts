import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/authShared";
import type {
  DiaCalendarioKey,
  DocenteClaseGuardada,
} from "@/lib/horarioShared";

export async function listClasesDocente(
  email: string,
): Promise<DocenteClaseGuardada[]> {
  const norm = normalizeEmail(email);
  const clases = await db.listClasesDocente(norm);
  return clases.map((c) => ({
    id: c.id,
    materia: c.materia,
    dia: c.dia as DiaCalendarioKey,
    horaInicio: c.hora_inicio,
    horaFinal: c.hora_final,
    salon: c.salon,
  }));
}

export async function addClaseDocente(
  email: string,
  clase: Omit<DocenteClaseGuardada, "id"> & { id?: string },
): Promise<DocenteClaseGuardada> {
  const norm = normalizeEmail(email);
  const id = clase.id ?? randomUUID();
  const nueva: DocenteClaseGuardada = {
    ...clase,
    id,
    materia: clase.materia.trim(),
    salon: clase.salon.trim(),
    horaInicio: clase.horaInicio.trim(),
    horaFinal: clase.horaFinal.trim(),
    dia: clase.dia as DiaCalendarioKey,
  };

  await db.addClaseDocente({
    id,
    email: norm,
    materia: nueva.materia,
    dia: nueva.dia,
    hora_inicio: nueva.horaInicio,
    hora_final: nueva.horaFinal,
    salon: nueva.salon,
  });

  return nueva;
}

export async function updateClaseDocente(
  email: string,
  id: string,
  patch: Omit<DocenteClaseGuardada, "id">,
): Promise<DocenteClaseGuardada | null> {
  const norm = normalizeEmail(email);
  const patchData = {
    materia: patch.materia.trim(),
    dia: patch.dia as DiaCalendarioKey,
    hora_inicio: patch.horaInicio.trim(),
    hora_final: patch.horaFinal.trim(),
    salon: patch.salon.trim(),
  };

  await db.updateClaseDocente(id, norm, patchData);

  return {
    id,
    materia: patchData.materia,
    dia: patchData.dia,
    horaInicio: patchData.hora_inicio,
    horaFinal: patchData.hora_final,
    salon: patchData.salon,
  };
}

export async function deleteClaseDocente(
  email: string,
  id: string,
): Promise<boolean> {
  const norm = normalizeEmail(email);
  return await db.deleteClaseDocente(id, norm);
}
