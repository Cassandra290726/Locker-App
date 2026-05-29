import { db } from "@/lib/db";

import { randomInt } from "crypto";
import { normalizeEmail } from "@/lib/authShared";

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
  
  await db.saveVerification(key, code, role);

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
