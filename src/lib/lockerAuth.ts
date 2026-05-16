import type {
  DocenteProfile,
  SessionUser,
  UserRole,
} from "@/lib/authShared";

export type { DocenteProfile, SessionUser, UserRole };
export {
  getEmailInputError,
  getMatriculaInputError,
  getPasswordInputError,
  getPasswordMismatchError,
  isValidEmailFormat,
  isValidPassword,
  MAX_DOCENTE_SCHOOLS,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
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
  docenteProfile?: DocenteProfile,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, role, docenteProfile }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error ?? "REGISTER_FAILED" };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
