export type UserRole = "docente" | "alumno";

export type StoredAccount = {
  password: string;
  role: UserRole;
};

const ACCOUNTS_KEY = "locker_accounts_v1";
const SESSION_KEY = "locker_session_v1";

function readAccounts(): Record<string, StoredAccount> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredAccount>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAccounts(next: Record<string, StoredAccount>) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
}

export function getStoredSessionEmail(): string | null {
  if (typeof window === "undefined") return null;
  const e = window.localStorage.getItem(SESSION_KEY);
  return e && e.length > 0 ? e : null;
}

export function setStoredSessionEmail(email: string) {
  window.localStorage.setItem(SESSION_KEY, email.trim().toLowerCase());
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAccount(email: string): StoredAccount | undefined {
  const key = email.trim().toLowerCase();
  return readAccounts()[key];
}

export function registerAccount(
  email: string,
  password: string,
  role: UserRole,
) {
  const key = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts[key]) {
    throw new Error("EMAIL_TAKEN");
  }
  accounts[key] = { password, role };
  writeAccounts(accounts);
}

/** Formato básico: @ presente, partes razonables y longitud total acotada. */
export function isValidEmailFormat(email: string): boolean {
  const t = email.trim();
  if (t.length < 6 || t.length > 254) return false;
  if (!t.includes("@")) return false;
  const at = t.indexOf("@");
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (local.length < 1 || domain.length < 3) return false;
  if (!domain.includes(".")) return false;
  if (/\s/.test(t)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}
