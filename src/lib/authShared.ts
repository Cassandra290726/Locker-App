export type UserRole = "docente" | "alumno";

export type SessionUser = {
  email: string;
  role: UserRole;
};

export type DocenteSchool = {
  escuela: string;
  matricula: string;
};

export type DocenteProfile = {
  nombre: string;
  escuelas: DocenteSchool[];
};

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
