import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

/** Sends an email via SMTP if configured; otherwise logs it (development fallback). */
export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }) {
  const smtp = env.smtp;
  if (!smtp.host) {
    console.info(`\n[mailer] SMTP not configured — email not sent.\nTo: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`);
    return { delivered: false };
  }
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
  });
  await transport.sendMail({ from: smtp.from, ...opts });
  return { delivered: true };
}
