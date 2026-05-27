import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomInt } from "crypto";

import { normalizeEmail } from "@/lib/authShared";

const DATA_DIR = path.join(process.cwd(), "data");
const CODES_FILE = path.join(DATA_DIR, "email_verification.json");

type CodeEntry = {
  code: string;
  role: string;
  createdAt: string;
};

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readCodes(): Promise<Record<string, CodeEntry>> {
  try {
    const raw = await readFile(CODES_FILE, "utf8");
    const p = JSON.parse(raw) as Record<string, CodeEntry>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

async function writeCodes(codes: Record<string, CodeEntry>) {
  await ensureDir();
  await writeFile(CODES_FILE, JSON.stringify(codes, null, 2), "utf8");
}

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Envía (o simula) notificación de verificación al correo registrado.
 * Con SMTP configurado en .env envía correo real; si no, guarda código en data/.
 */
export async function sendRegistrationAuthEmail(
  email: string,
  role: "docente" | "alumno",
): Promise<{ ok: true; devCode?: string; emailed: boolean }> {
  const key = normalizeEmail(email);
  const code = generateCode();
  const codes = await readCodes();
  codes[key] = { code, role, createdAt: new Date().toISOString() };
  await writeCodes(codes);

  const roleLabel = role === "docente" ? "Docente" : "Alumno/a";
  const subject = "Locker — Código de verificación";
  const body = `Hola,\n\nTe registraste en Locker como ${roleLabel}.\n\nTu código de verificación es: ${code}\n\nSi no fuiste tú, ignora este mensaje.\n\n— Locker App`;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "locker@localhost";

  if (host && user && pass) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });
      await transport.sendMail({
        from,
        to: email,
        subject,
        text: body,
      });
      return { ok: true, emailed: true };
    } catch (err) {
      console.error("[Locker] Error SMTP:", err);
    }
  }

  console.info(`[Locker] Código de verificación para ${email}: ${code}`);
  return { ok: true, devCode: code, emailed: false };
}
