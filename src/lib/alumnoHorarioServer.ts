import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { normalizeEmail } from "@/lib/authShared";
import type {
  DiaCalendarioKey,
  DocenteClaseGuardada,
} from "@/lib/horarioShared";

const DATA_DIR = path.join(process.cwd(), "data");
const HORARIO_FILE = path.join(DATA_DIR, "alumno_horarios.json");

type Store = Record<string, DocenteClaseGuardada[]>;

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(HORARIO_FILE, "utf8");
    const p = JSON.parse(raw) as Store;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await ensureDir();
  await writeFile(HORARIO_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function listClasesAlumno(
  email: string,
): Promise<DocenteClaseGuardada[]> {
  const key = normalizeEmail(email);
  const store = await readStore();
  return Array.isArray(store[key]) ? store[key] : [];
}

export async function addClaseAlumno(
  email: string,
  clase: Omit<DocenteClaseGuardada, "id"> & { id?: string },
): Promise<DocenteClaseGuardada> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = Array.isArray(store[key]) ? [...store[key]] : [];
  const nuevos: DocenteClaseGuardada = {
    ...clase,
    id: clase.id ?? randomUUID(),
    materia: clase.materia.trim(),
    salon: clase.salon.trim(),
    horaInicio: clase.horaInicio.trim(),
    horaFinal: clase.horaFinal.trim(),
    dia: clase.dia as DiaCalendarioKey,
  };
  list.push(nuevos);
  store[key] = list;
  await writeStore(store);
  return nuevos;
}

export async function updateClaseAlumno(
  email: string,
  id: string,
  patch: Omit<DocenteClaseGuardada, "id">,
): Promise<DocenteClaseGuardada | null> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = Array.isArray(store[key]) ? [...store[key]] : [];
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = {
    id,
    materia: patch.materia.trim(),
    dia: patch.dia as DiaCalendarioKey,
    horaInicio: patch.horaInicio.trim(),
    horaFinal: patch.horaFinal.trim(),
    salon: patch.salon.trim(),
  };
  store[key] = list;
  await writeStore(store);
  return list[idx];
}

export async function deleteClaseAlumno(
  email: string,
  id: string,
): Promise<boolean> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = Array.isArray(store[key]) ? store[key] : [];
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  store[key] = next;
  await writeStore(store);
  return true;
}
