// Outbound email. SMTP when TRAINYARD_SMTP_URL is set (smtp://user:pass@host:587 or
// smtps://user:pass@host:465), otherwise a mailer that only logs, so a server without mail
// still runs and says plainly what it would have sent. Tests use the memory mailer.

import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  /** True when mail really leaves the server. */
  readonly live: boolean;
  send(mail: Mail): Promise<void>;
}

export class SmtpMailer implements Mailer {
  readonly live = true;
  private readonly transport: nodemailer.Transporter;
  constructor(url: string, private readonly from: string) {
    this.transport = nodemailer.createTransport(url);
  }
  async send(mail: Mail): Promise<void> {
    await this.transport.sendMail({ from: this.from, to: mail.to, subject: mail.subject, text: mail.text, ...(mail.html ? { html: mail.html } : {}) });
  }
}

/** No SMTP configured: nothing is sent, and nothing is marked as sent. */
export class LogMailer implements Mailer {
  readonly live = false;
  async send(mail: Mail): Promise<void> {
    console.warn(`[mail] not sent (set TRAINYARD_SMTP_URL): to=${mail.to} subject="${mail.subject}"`);
    throw new Error("mail is not configured");
  }
}

export class MemoryMailer implements Mailer {
  readonly live = true;
  readonly sent: Mail[] = [];
  async send(mail: Mail): Promise<void> {
    this.sent.push(mail);
  }
}

export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer {
  const url = env.TRAINYARD_SMTP_URL;
  if (!url) return new LogMailer();
  return new SmtpMailer(url, env.TRAINYARD_MAIL_FROM || "Trainyard <billing@trainyard.app>");
}
