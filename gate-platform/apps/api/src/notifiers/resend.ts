import type { EmailMessage, Notifier } from "@gate/core";

/** Resend transactional email adapter (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendNotifier implements Notifier {
  readonly provider = "resend";
  constructor(private readonly opts: { apiKey: string; from: string; fetch?: typeof fetch; baseUrl?: string }) {}

  async send(m: EmailMessage): Promise<void> {
    const f = this.opts.fetch ?? fetch;
    const res = await f(`${this.opts.baseUrl ?? "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.opts.apiKey}`, "content-type": "application/json", "idempotency-key": m.key },
      body: JSON.stringify({
        from: this.opts.from,
        to: [m.to],
        subject: m.subject,
        text: m.text,
        html: m.html,
        ...(m.replyTo ? { reply_to: m.replyTo } : {}),
        ...(m.attachments?.length
          ? { attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.encoding === "base64" ? a.content : Buffer.from(a.content, "utf8").toString("base64"), content_type: a.contentType })) }
          : {}),
      }),
    });
    if (!res.ok) throw new Error(`resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
