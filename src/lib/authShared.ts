export type UserRole = "docente" | "alumno";

export type SessionUser = {
  email: string;
  role: UserRole;
};

export type DocenteSchool = {
  escuela: string;
  matricula: string;
};

export type DocentePerfilPublico = {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  escuelas: string[];
  materias: string[];
  correos: string[];
  telefonos: string[];
  fotoUrl?: string;
  /** Compatibilidad datos antiguos */
  escuela?: string;
  correo?: string;
  telefono?: string;
};

export type DocenteProfile = {
  nombre: string;
  apellidos?: string;
  escuelas: DocenteSchool[];
  telefono?: string;
  materias?: string[];
  fotoUrl?: string;
  /** Datos visibles para alumnos (perfil público del docente). */
  perfilPublico?: DocentePerfilPublico;
};

export type AlumnoProfile = {
  nombre: string;
  institucion: string;
  municipio: string;
  plantel: string;
  turno: string;
};

export const MUNICIPIOS_BCN = [
  "Tijuana",
  "Mexicali",
  "Ensenada",
  "Tecate",
  "Playas de Rosarito",
  "San Quintín",
  "San Felipe",
] as const;

export type MunicipioBcn = (typeof MUNICIPIOS_BCN)[number];

/** Longitud máxima razonable (RFC 5322). */
export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 25;

export const MAX_DOCENTE_SCHOOLS = 3;

/** Formato básico: @ presente, partes razonables y longitud total acotada. */
export function isValidEmailFormat(email: string): boolean {
  return getEmailInputError(email) === null;
}

/** Mensaje específico o null cuando el formato es válido. */
export function getEmailInputError(emailDraft: string): string | null {
  const t = emailDraft.trim();

  if (t.length === 0) return "Escribe el correo.";
  if (t.length > MAX_EMAIL_LENGTH) {
    return "El correo no puede tener más de 254 caracteres.";
  }
  if (!t.includes("@")) return "El correo debe incluir el símbolo @.";
  const at = t.indexOf("@");
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length < 1 || domain.length < 3) {
    return "Completa usuario y dominio después del @.";
  }
  if (!domain.includes(".")) return "El dominio debe incluir un punto (ej. escuela.mx).";
  if (/\s/.test(t)) return "El correo no debe contener espacios.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return "Introduce un correo con formato válido.";
  }
  if (t.length < 6) return "El correo es demasiado corto.";
  return null;
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  );
}

export function getPasswordInputError(password: string): string | null {
  if (password.length === 0) return "Escribe la contraseña.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return "La contraseña no puede tener más de 25 caracteres.";
  }
  return null;
}

export function getPasswordMismatchError(
  password: string,
  confirmation: string,
): string | null {
  if (confirmation.length === 0) return "Confirma la contraseña.";
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeEscuelaNombre(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isMatriculaSoloNumeros(matricula: string): boolean {
  const t = matricula.trim();
  return t.length > 0 && /^\d+$/.test(t);
}

export function getMatriculaInputError(matriculaDraft: string): string | null {
  const t = matriculaDraft.trim();
  if (t.length === 0) return "Escribe tu matrícula.";
  if (!/^\d+$/.test(t)) return "La matrícula solo puede contener números.";
  return null;
}

export function tieneParesEscuelaMatriculaDuplicados(
  escuelas: DocenteSchool[],
): boolean {
  const seen = new Set<string>();
  for (const s of escuelas) {
    const key = `${normalizeEscuelaNombre(s.escuela)}|${s.matricula.trim()}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function getNombreInputError(nombre: string): string | null {
  if (!nombre.trim()) return "Escribe tu nombre.";
  return null;
}

export function getInstitucionInputError(institucion: string): string | null {
  if (!institucion.trim()) return "Escribe la institución.";
  return null;
}

export function getPlantelInputError(plantel: string): string | null {
  if (!plantel.trim()) return "Escribe el plantel.";
  return null;
}

export function getTurnoInputError(turno: string): string | null {
  if (!turno.trim()) return "Escribe el turno.";
  return null;
}

export function getMunicipioInputError(municipio: string): string | null {
  if (!municipio.trim()) return "Selecciona el municipio.";
  if (!MUNICIPIOS_BCN.includes(municipio as MunicipioBcn)) {
    return "Selecciona un municipio válido.";
  }
  return null;
}

export function isValidAlumnoProfile(profile: AlumnoProfile): boolean {
  if (getNombreInputError(profile.nombre)) return false;
  if (getInstitucionInputError(profile.institucion)) return false;
  if (getMunicipioInputError(profile.municipio)) return false;
  if (getPlantelInputError(profile.plantel)) return false;
  if (getTurnoInputError(profile.turno)) return false;
  return true;
}

export function escuelaCoincideConInstitucion(
  institucionAlumno: string,
  escuelasDocente: DocenteSchool[],
): boolean {
  const inst = normalizeEscuelaNombre(institucionAlumno);
  if (!inst) return false;
  return escuelasDocente.some(
    (s) => normalizeEscuelaNombre(s.escuela) === inst,
  );
}

export function getTelefonoPerfilError(telefono: string): string | null {
  const t = telefono.trim();
  if (t.length === 0) return "Escribe tu teléfono.";
  if (!/^\d+$/.test(t)) return "El teléfono solo puede contener números.";
  if (t.length < 7) return "El teléfono es demasiado corto.";
  return null;
}

export function getApellidoPaternoError(v: string): string | null {
  if (!v.trim()) return "Escribe tu apellido paterno.";
  return null;
}

export function getApellidoMaternoError(v: string): string | null {
  if (!v.trim()) return "Escribe tu apellido materno.";
  return null;
}

export function getNombresError(v: string): string | null {
  if (!v.trim()) return "Escribe tu(s) nombre(s).";
  return null;
}

export function getEscuelasPerfilError(escuelas: string[]): string | null {
  if (escuelas.length === 0) return "Agrega al menos una escuela.";
  return null;
}

export function getCorreosPerfilError(correos: string[]): string | null {
  if (correos.length === 0) return "Agrega al menos un correo.";
  for (const c of correos) {
    const err = getEmailInputError(c);
    if (err) return err;
  }
  return null;
}

export function getTelefonosPerfilError(telefonos: string[]): string | null {
  if (telefonos.length === 0) return "Agrega al menos un teléfono.";
  for (const t of telefonos) {
    const err = getTelefonoPerfilError(t);
    if (err) return err;
  }
  return null;
}

export function getMateriasPerfilError(materias: string[]): string | null {
  if (materias.length === 0) return "Agrega al menos una materia.";
  return null;
}

export type ErroresPerfilPublico = {
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombres?: string;
  escuelas?: string;
  materias?: string;
  correos?: string;
  telefonos?: string;
};

export function normalizarPerfilPublicoGuardado(
  raw: DocentePerfilPublico,
): DocentePerfilPublico {
  const escuelas =
    Array.isArray(raw.escuelas) && raw.escuelas.length > 0
      ? raw.escuelas.map((e) => e.trim()).filter(Boolean)
      : raw.escuela?.trim()
        ? [raw.escuela.trim()]
        : [];
  const correos =
    Array.isArray(raw.correos) && raw.correos.length > 0
      ? raw.correos.map((c) => c.trim()).filter(Boolean)
      : raw.correo?.trim()
        ? [raw.correo.trim()]
        : [];
  const telefonos =
    Array.isArray(raw.telefonos) && raw.telefonos.length > 0
      ? raw.telefonos.map((t) => t.trim()).filter(Boolean)
      : raw.telefono?.trim()
        ? [raw.telefono.trim()]
        : [];
  return {
    apellidoPaterno: raw.apellidoPaterno?.trim() ?? "",
    apellidoMaterno: raw.apellidoMaterno?.trim() ?? "",
    nombres: raw.nombres?.trim() ?? "",
    escuelas,
    materias: Array.isArray(raw.materias)
      ? raw.materias.map((m) => m.trim()).filter(Boolean)
      : [],
    correos,
    telefonos,
    fotoUrl: raw.fotoUrl?.trim() || undefined,
  };
}

export function validarPerfilPublico(input: {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  escuelas: string[];
  materias: string[];
  correos: string[];
  telefonos: string[];
}): ErroresPerfilPublico {
  const err: ErroresPerfilPublico = {};
  const ap = getApellidoPaternoError(input.apellidoPaterno);
  if (ap) err.apellidoPaterno = ap;
  const am = getApellidoMaternoError(input.apellidoMaterno);
  if (am) err.apellidoMaterno = am;
  const nm = getNombresError(input.nombres);
  if (nm) err.nombres = nm;
  const esc = getEscuelasPerfilError(input.escuelas);
  if (esc) err.escuelas = esc;
  const mat = getMateriasPerfilError(input.materias);
  if (mat) err.materias = mat;
  const cor = getCorreosPerfilError(input.correos);
  if (cor) err.correos = cor;
  const tel = getTelefonosPerfilError(input.telefonos);
  if (tel) err.telefonos = tel;
  return err;
}

export function hayErroresPerfilPublico(err: ErroresPerfilPublico): boolean {
  return Object.keys(err).length > 0;
}

export function isValidDocentePerfilPublico(p: DocentePerfilPublico): boolean {
  const n = normalizarPerfilPublicoGuardado(p);
  return hayErroresPerfilPublico(validarPerfilPublico(n)) === false;
}

export function isValidDocenteProfile(profile: DocenteProfile): boolean {
  if (!profile.nombre.trim()) return false;
  const escuelas = profile.escuelas;
  if (escuelas.length === 0 || escuelas.length > MAX_DOCENTE_SCHOOLS) {
    return false;
  }
  if (!escuelas.every((s) => s.escuela.trim().length > 0)) return false;
  if (!escuelas.every((s) => isMatriculaSoloNumeros(s.matricula))) return false;
  if (tieneParesEscuelaMatriculaDuplicados(escuelas)) return false;
  return true;
}
