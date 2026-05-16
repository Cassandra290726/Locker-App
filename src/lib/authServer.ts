import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import bcrypt from "bcryptjs";

import {
  normalizeEmail,
  type DocenteProfile,
  type UserRole,
} from "@/lib/authShared";

export type StoredAccount = {
  passwordHash: string;
  role: UserRole;
  docenteProfile?: DocenteProfile;
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
  };
  await writeAccounts(accounts);
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
