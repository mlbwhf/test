// Forgotten passwords: the person asks with their email, gets a six-digit code by email, and
// chooses a new password with it. Codes live in memory for 15 minutes (a restart only means
// asking again), so they can never leak through a user export or an API response.

import { randomInt, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ApiError } from "./errors.js";
import { PASSWORD_MIN, SESSION_MS, hashKey, hashPassword, newSessionToken } from "./auth.js";
import type { Tenants } from "./tenants.js";
import type { Mailer } from "./mailer.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const CODE_MINUTES = 15;
const CODE_TRIES = 5;
const MAX_SESSIONS = 10;

export function registerPasswordReset(app: App, tenants: Tenants, opts: { mailer?: Mailer; webUrl?: string }) {
  const platform = tenants.platform;
  const codes = new Map<string, { hash: string; expiresAt: number; tries: number }>();
  const userBy = (email: string) => platform.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.disabled);
  const codeHash = (userId: string, code: string) => hashKey(`reset:${userId}:${code}`);
  const web = (opts.webUrl ?? "").replace(/\/$/, "");
  const send = async (to: string, subject: string, text: string) => {
    try {
      if (!opts.mailer) throw new Error("no mailer");
      await opts.mailer.send({ to, subject, text });
    } catch (e) {
      console.error(`[mail] password reset to ${to} not sent: ${(e as Error).message}`);
    }
  };

  // The same answer whether or not the email has a sign-in, so the form never tells which exist.
  app.post("/v1/auth/forgot", { config: { rateLimit: { max: 3, timeWindow: "1 minute" } }, schema: { body: z.object({ email: z.string().trim().email().max(200) }) } }, async (req, reply) => {
    const email = req.body.email.toLowerCase();
    const user = userBy(email);
    if (user) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      codes.set(user.id, { hash: codeHash(user.id, code), expiresAt: Date.now() + CODE_MINUTES * 60_000, tries: 0 });
      await send(user.email, `${code} is your Trainyard password code`, `Hi ${user.name},\n\nYour code to choose a new Trainyard password is ${code}. It works for ${CODE_MINUTES} minutes.\n\nDidn't ask for this? Ignore this email; your password stays as it is.\n\nTrainyard`);
    } else {
      // Started signing up but never finished: there is no password to reset yet, so say how to carry on.
      const pending = (platform.state.signups ?? []).find((s) => s.email === email && s.status === "new");
      if (pending) await send(email, "Finish signing up for Trainyard", `Hi ${pending.name},\n\nYou started signing up for Trainyard but did not finish, so there is no password to reset yet. Sign up again${web ? ` at ${web}/pricing` : ""} with this email: the password you choose then replaces the earlier one.\n\nTrainyard`);
    }
    return reply.code(202).send({ sent: true, expiresInMinutes: CODE_MINUTES });
  });

  // The code and a new password: the password is set, every other session ends, and this browser is signed in.
  app.post("/v1/auth/reset", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: z.object({ email: z.string().trim().email().max(200), code: z.string().trim().regex(/^\d{6}$/, "Six digits"), password: z.string().min(PASSWORD_MIN, `at least ${PASSWORD_MIN} characters`).max(200) }) } }, async (req) => {
    const wrong = () => new ApiError(422, "BAD_CODE", "That code is wrong or has expired. Ask for a new one.");
    const user = userBy(req.body.email);
    const c = user && codes.get(user.id);
    if (!user || !c || c.expiresAt < Date.now() || c.tries >= CODE_TRIES) throw wrong();
    c.tries++;
    const a = Buffer.from(c.hash, "hex");
    const b = Buffer.from(codeHash(user.id, req.body.code), "hex");
    if (!timingSafeEqual(a, b)) throw wrong();
    codes.delete(user.id);
    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MS).toISOString();
    user.passwordHash = hashPassword(req.body.password);
    user.sessions = [{ hash: hashKey(token), expiresAt }].slice(-MAX_SESSIONS);
    // Reading the code proves the address.
    user.emailVerifiedAt ??= new Date().toISOString();
    await platform.commit(req.principal, "auth.password-reset", { userId: user.id });
    const { keyHash: _k, passwordHash: _p, sessions: _s, ...pub } = user;
    return { token, expiresAt, user: { ...pub, hasPassword: true } };
  });
}
