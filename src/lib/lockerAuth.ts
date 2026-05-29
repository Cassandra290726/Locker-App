import type {
  AlumnoProfile,
  DocenteProfile,
  SessionUser,
  UserRole,
} from "@/lib/authShared";

export type { AlumnoProfile, DocenteProfile, SessionUser, UserRole };
export {
  getEmailInputError,
  getInstitucionInputError,
  getMatriculaInputError,
  getMunicipioInputError,
  getNombreInputError,
  getPasswordInputError,
  getPasswordMismatchError,
  getPlantelInputError,
  getTurnoInputError,
  isValidEmailFormat,
  isValidPassword,
  MAX_DOCENTE_SCHOOLS,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MUNICIPIOS_BCN,
  normalizeEscuelaNombre,
  tieneParesEscuelaMatriculaDuplicados,
} from "@/lib/authShared";

export async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: SessionUser | null };
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error ?? "LOGIN_FAILED" };
}

export async function register(
  email: string,
  password: string,
  role: UserRole,
  profiles?: { docenteProfile?: DocenteProfile; alumnoProfile?: AlumnoProfile },
): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
      role,
      docenteProfile: profiles?.docenteProfile,
      alumnoProfile: profiles?.alumnoProfile,
    }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    verificationEmailSent?: boolean;
    devVerificationCode?: string;
  };
  if (res.ok && data.ok) {
    return {
      ok: true,
    };
  }
  return { ok: false, error: data.error ?? "REGISTER_FAILED" };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
