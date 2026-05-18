import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import bcrypt from "bcryptjs";

import {
  escuelaCoincideConInstitucion,
  normalizeEmail,
  type AlumnoProfile,
  type DocenteProfile,
  type UserRole,
} from "@/lib/authShared";

export type StoredAccount = {
  passwordHash: string;
  role: UserRole;
  docenteProfile?: DocenteProfile;
  alumnoProfile?: AlumnoProfile;
};

export type DocentePublico = {
  email: string;
  nombre: string;
  apellidos: string;
  escuelas: string[];
  materias: string[];
  telefono: string;
  fotoUrl: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readAccounts(): Promise<Record<string, StoredAccount>> {
  try {
    const raw = await readFile(ACCOUNTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, StoredAccount>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAccounts(next: Record<string, StoredAccount>) {
  await ensureDataDir();
  await writeFile(ACCOUNTS_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function getAccount(
  email: string,
): Promise<StoredAccount | undefined> {
  const key = normalizeEmail(email);
  return (await readAccounts())[key];
}

export async function registerAccount(
  email: string,
  password: string,
  role: UserRole,
  docenteProfile?: DocenteProfile,
  alumnoProfile?: AlumnoProfile,
): Promise<void> {
  const key = normalizeEmail(email);
  const accounts = await readAccounts();
  if (accounts[key]) {
    throw new Error("EMAIL_TAKEN");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  accounts[key] = {
    passwordHash,
    role,
    ...(role === "docente" && docenteProfile
      ? { docenteProfile }
      : {}),
    ...(role === "alumno" && alumnoProfile ? { alumnoProfile } : {}),
  };
  await writeAccounts(accounts);
}

export async function getAlumnoProfile(
  email: string,
): Promise<AlumnoProfile | undefined> {
  const acc = await getAccount(email);
  return acc?.alumnoProfile;
}

function toDocentePublico(
  email: string,
  profile: DocenteProfile,
): DocentePublico {
  return {
    email,
    nombre: profile.nombre.trim(),
    apellidos: (profile.apellidos ?? "").trim(),
    escuelas: profile.escuelas.map((s) => s.escuela.trim()).filter(Boolean),
    materias: Array.isArray(profile.materias)
      ? profile.materias.map((m) => m.trim()).filter(Boolean)
      : [],
    telefono: (profile.telefono ?? "").trim(),
    fotoUrl: profile.fotoUrl?.trim() || null,
  };
}

export async function listDocentesParaAlumno(
  institucionAlumno: string,
  searchQuery?: string,
): Promise<DocentePublico[]> {
  const accounts = await readAccounts();
  const q = (searchQuery ?? "").trim().toLowerCase();
  const out: DocentePublico[] = [];

  for (const [email, acc] of Object.entries(accounts)) {
    if (acc.role !== "docente" || !acc.docenteProfile) continue;
    if (
      !escuelaCoincideConInstitucion(institucionAlumno, acc.docenteProfile.escuelas)
    ) {
      continue;
    }
    const pub = toDocentePublico(email, acc.docenteProfile);
    if (q) {
      const full = `${pub.nombre} ${pub.apellidos}`.toLowerCase();
      if (!full.includes(q)) continue;
    }
    out.push(pub);
  }

  out.sort((a, b) =>
    `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, "es"),
  );
  return out;
}

export async function getDocentePublicoSiCoincide(
  docenteEmail: string,
  institucionAlumno: string,
): Promise<DocentePublico | null> {
  const key = normalizeEmail(docenteEmail);
  const acc = await getAccount(key);
  if (!acc || acc.role !== "docente" || !acc.docenteProfile) return null;
  if (
    !escuelaCoincideConInstitucion(institucionAlumno, acc.docenteProfile.escuelas)
  ) {
    return null;
  }
  return toDocentePublico(key, acc.docenteProfile);
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<StoredAccount | null> {
  const acc = await getAccount(email);
  if (!acc) return null;
  const ok = await bcrypt.compare(password, acc.passwordHash);
  return ok ? acc : null;
}
