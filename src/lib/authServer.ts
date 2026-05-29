import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import {
  isValidDocentePerfilPublico,
  normalizarPerfilPublicoGuardado,
  normalizeEmail,
  normalizeEscuelaNombre,
  type AlumnoProfile,
  type DocentePerfilPublico,
  type DocenteProfile,
  type UserRole,
} from "@/lib/authShared";

export type StoredAccount = {
  passwordHash: string;
  role: UserRole;
  verified?: boolean;
  docenteProfile?: DocenteProfile;
  alumnoProfile?: AlumnoProfile;
};

export type DocentePublico = {
  email: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  nombre: string;
  apellidos: string;
  escuelas: string[];
  materias: string[];
  telefono: string;
  correo: string;
  fotoUrl: string | null;
};

function perfilPublicoToDocentePublico(
  accountEmail: string,
  p: DocentePerfilPublico,
): DocentePublico {
  const n = normalizarPerfilPublicoGuardado(p);
  return {
    email: accountEmail,
    apellidoPaterno: n.apellidoPaterno,
    apellidoMaterno: n.apellidoMaterno,
    nombres: n.nombres,
    nombre: n.nombres,
    apellidos: `${n.apellidoPaterno} ${n.apellidoMaterno}`.trim(),
    escuelas: n.escuelas,
    materias: n.materias,
    telefono: n.telefonos[0] ?? "",
    correo: n.correos[0] ?? accountEmail,
    fotoUrl: n.fotoUrl?.trim() || null,
  };
}

export async function getAccount(
  email: string,
): Promise<StoredAccount | undefined> {
  const data = await db.getAccount(email);
  if (!data) return undefined;

  return {
    passwordHash: data.password_hash,
    role: data.role,
    verified: data.verified,
    docenteProfile: (data.docente_profile as unknown as DocenteProfile) || undefined,
    alumnoProfile: (data.alumno_profile as unknown as AlumnoProfile) || undefined,
  };
}

export async function registerAccount(
  email: string,
  password: string,
  role: UserRole,
  docenteProfile?: DocenteProfile,
  alumnoProfile?: AlumnoProfile,
): Promise<void> {
  const key = normalizeEmail(email);
  const existing = await db.getAccount(key);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.createAccount(key, passwordHash, role, docenteProfile || null, alumnoProfile || null);
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
): DocentePublico | null {
  if (!profile.perfilPublico || !isValidDocentePerfilPublico(profile.perfilPublico)) {
    return null;
  }
  return perfilPublicoToDocentePublico(email, profile.perfilPublico);
}

export async function saveDocentePerfilPublico(
  email: string,
  data: DocentePerfilPublico,
): Promise<DocentePerfilPublico | null> {
  const key = normalizeEmail(email);
  const acc = await db.getAccount(key);
  if (!acc || acc.role !== "docente" || !acc.docente_profile) return null;

  const perfilPublico = normalizarPerfilPublicoGuardado(data);
  const docenteProfile: DocenteProfile = {
    ...(acc.docente_profile as DocenteProfile),
    perfilPublico,
  };

  await db.updateAccount(key, { docente_profile: docenteProfile });
  return perfilPublico;
}

export async function deleteDocentePerfilPublico(email: string): Promise<boolean> {
  const key = normalizeEmail(email);
  const acc = await db.getAccount(key);
  if (!acc || acc.role !== "docente" || !acc.docente_profile) return false;

  const nextProfile = { ...(acc.docente_profile as DocenteProfile) };
  delete nextProfile.perfilPublico;

  await db.updateAccount(key, { docente_profile: nextProfile });
  return true;
}

export async function updateDocenteProfile(
  email: string,
  patch: Partial<DocenteProfile>,
): Promise<DocenteProfile | null> {
  const key = normalizeEmail(email);
  const acc = await db.getAccount(key);
  if (!acc || acc.role !== "docente" || !acc.docente_profile) return null;

  const prev = acc.docente_profile as DocenteProfile;
  const next: DocenteProfile = {
    ...prev,
    nombre:
      typeof patch.nombre === "string" && patch.nombre.trim()
        ? patch.nombre.trim()
        : prev.nombre,
    apellidos:
      patch.apellidos !== undefined
        ? patch.apellidos.trim()
        : prev.apellidos,
    escuelas: patch.escuelas ?? prev.escuelas,
    telefono:
      patch.telefono !== undefined ? patch.telefono.trim() : prev.telefono,
    materias: patch.materias ?? prev.materias,
    fotoUrl:
      patch.fotoUrl !== undefined
        ? patch.fotoUrl.trim() || undefined
        : prev.fotoUrl,
    perfilPublico: patch.perfilPublico ?? prev.perfilPublico,
  };

  await db.updateAccount(key, { docente_profile: next });
  return next;
}

export async function getDocenteProfile(
  email: string,
): Promise<DocenteProfile | undefined> {
  const acc = await getAccount(email);
  return acc?.docenteProfile;
}

/** Obtiene docentes restringiendo a la escuela del alumno para garantizar la privacidad. */
export async function listDocentesParaAlumno(
  alumnoEmail: string,
  searchQuery?: string,
): Promise<DocentePublico[]> {
  const alumnoProfile = await getAlumnoProfile(alumnoEmail);
  const inst = alumnoProfile?.institucion
    ? normalizeEscuelaNombre(alumnoProfile.institucion)
    : "";

  const accounts = await db.listDocentes();
  const q = (searchQuery ?? "").trim().toLowerCase();
  const out: DocentePublico[] = [];

  for (const acc of accounts) {
    if (acc.role !== "docente" || !acc.docente_profile) continue;
    const pub = toDocentePublico(acc.email, acc.docente_profile as DocenteProfile);
    if (!pub) continue;

    // Privacidad: Solo ver profesores de la misma institución si el alumno tiene una registrada
    if (inst) {
      const coincideEscuela = pub.escuelas.some(
        (e) => normalizeEscuelaNombre(e) === inst,
      );
      if (!coincideEscuela) continue;
    }

    if (q) {
      const full =
        `${pub.nombres} ${pub.apellidoPaterno} ${pub.apellidoMaterno}`.toLowerCase();
      if (!full.includes(q)) continue;
    }
    out.push(pub);
  }

  out.sort((a, b) =>
    `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombres}`.localeCompare(
      `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombres}`,
      "es",
    ),
  );
  return out;
}

export async function getDocentePublico(
  docenteEmail: string,
): Promise<DocentePublico | null> {
  const key = normalizeEmail(docenteEmail);
  const acc = await getAccount(key);
  if (!acc || acc.role !== "docente" || !acc.docenteProfile) return null;
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
