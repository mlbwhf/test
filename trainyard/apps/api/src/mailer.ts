// Outbound email. SMTP when TRAINYARD_SMTP_URL is set (smtp://user:pass@host:587 or
// smtps://user:pass@host:465), otherwise a mailer that only logs, so a server without mail
// still runs and says plainly what it would have sent. Tests use the memory mailer.

import nodemailer, { type Transporter } from "nodemailer";

/** Which address a mail comes from: support@ for accounts, sign-up codes and invitations, billing@ for payments. */
export type Sender = "support" | "billing";

export const DEFAULT_FROM: Record<Sender, string> = { support: "Trainyard <support@trainyard.app>", billing: "Trainyard Billing <billing@trainyard.app>" };

export interface Mail {
  to: string;
  /** Defaults to support. */
  from?: Sender;
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
  private readonly transport: Transporter;
  constructor(url: string, private readonly from: Record<Sender, string>) {
    this.transport = nodemailer.createTransport(url);
  }
  async send(mail: Mail): Promise<void> {
    const from = this.from[mail.from ?? "support"];
    // Replies go back to the address the mail came from.
    await this.transport.sendMail({ from, replyTo: from, to: mail.to, subject: mail.subject, text: mail.text, ...(mail.html ? { html: mail.html } : {}) });
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
  return new SmtpMailer(url, senders(env));
}

/** TRAINYARD_MAIL_FROM sends account, sign-up and invitation mail; TRAINYARD_BILLING_FROM sends payment mail. */
export function senders(env: NodeJS.ProcessEnv = process.env): Record<Sender, string> {
  return { support: env.TRAINYARD_MAIL_FROM || DEFAULT_FROM.support, billing: env.TRAINYARD_BILLING_FROM || DEFAULT_FROM.billing };
}
