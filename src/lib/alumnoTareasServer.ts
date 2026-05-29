import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { normalizeEmail } from "@/lib/authShared";
import type { AlumnoTareaInput, AlumnoTareaPendiente } from "@/lib/tareasShared";

const DATA_DIR = path.join(process.cwd(), "data");
const TAREAS_FILE = path.join(DATA_DIR, "alumno_tareas.json");

type Store = Record<string, AlumnoTareaPendiente[]>;

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(TAREAS_FILE, "utf8");
    const p = JSON.parse(raw) as Store;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await ensureDir();
  await writeFile(TAREAS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function listForUser(store: Store, email: string): AlumnoTareaPendiente[] {
  const key = normalizeEmail(email);
  return Array.isArray(store[key]) ? store[key] : [];
}

export async function listTareasAlumno(
  email: string,
  claseId?: string,
): Promise<AlumnoTareaPendiente[]> {
  const store = await readStore();
  const list = listForUser(store, email);
  if (!claseId) return list;
  return list.filter((t) => t.claseId === claseId);
}

export async function getTareaAlumno(
  email: string,
  tareaId: string,
): Promise<AlumnoTareaPendiente | null> {
  const store = await readStore();
  return listForUser(store, email).find((t) => t.id === tareaId) ?? null;
}

export async function addTareaAlumno(
  email: string,
  input: AlumnoTareaInput,
): Promise<AlumnoTareaPendiente> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = [...listForUser(store, email)];
  const now = new Date().toISOString();
  const tarea: AlumnoTareaPendiente = {
    id: randomUUID(),
    claseId: input.claseId,
    claseMateria: input.claseMateria.trim(),
    claseDia: input.claseDia,
    claseHoraInicio: input.claseHoraInicio.trim(),
    claseHoraFinal: input.claseHoraFinal.trim(),
    claseSalon: input.claseSalon.trim(),
    nombre: input.nombre.trim(),
    descripcion: input.descripcion.trim(),
    entregaHoraInicio: input.entregaHoraInicio.trim(),
    entregaHoraFinal: input.entregaHoraFinal.trim(),
    createdAt: now,
    updatedAt: now,
  };
  list.push(tarea);
  store[key] = list;
  await writeStore(store);
  return tarea;
}

export async function updateTareaAlumno(
  email: string,
  tareaId: string,
  patch: { nombre: string; descripcion: string },
): Promise<AlumnoTareaPendiente | null> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = [...listForUser(store, email)];
  const idx = list.findIndex((t) => t.id === tareaId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    nombre: patch.nombre.trim(),
    descripcion: patch.descripcion.trim(),
    updatedAt: new Date().toISOString(),
  };
  store[key] = list;
  await writeStore(store);
  return list[idx];
}

export async function deleteTareaAlumno(
  email: string,
  tareaId: string,
): Promise<boolean> {
  const key = normalizeEmail(email);
  const store = await readStore();
  const list = listForUser(store, email);
  const next = list.filter((t) => t.id !== tareaId);
  if (next.length === list.length) return false;
  store[key] = next;
  await writeStore(store);
  return true;
}
