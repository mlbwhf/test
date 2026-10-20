import { createHash, randomBytes } from "node:crypto";
import { DomainError, type VerifiedProfile } from "@gate/core";

// Sign-in providers. Each is a standard OAuth 2.0 authorization-code flow (OpenID Connect
// where the provider offers it) run entirely by the API: the browser only ever sees the
// provider's consent screen and a short-lived one-time code. A provider is enabled when
// its client id and secret are present in the environment.

export interface ProviderConfig {
  id: string;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  pkce: boolean;
  /** Extra authorize parameters. */
  extra?: Record<string, string>;
  clientId: string;
  clientSecret: string;
  profile: (accessToken: string, fetchImpl: typeof fetch) => Promise<VerifiedProfile>;
}

async function getJson(fetchImpl: typeof fetch, url: string, accessToken: string): Promise<Record<string, unknown>> {
  const res = await fetchImpl(url, { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new DomainError("UNAUTHORIZED", `could not read your profile (${res.status})`);
  return (await res.json()) as Record<string, unknown>;
}
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const verified = (v: unknown) => v === true || v === "true";

type Env = Record<string, string | undefined>;

export function configuredProviders(env: Env): ProviderConfig[] {
  const out: ProviderConfig[] = [];
  const pair = (prefix: string) => (env[`${prefix}_CLIENT_ID`] && env[`${prefix}_CLIENT_SECRET`] ? { clientId: env[`${prefix}_CLIENT_ID`]!, clientSecret: env[`${prefix}_CLIENT_SECRET`]! } : undefined);

  const google = pair("GOOGLE");
  if (google) out.push({
    id: "google", label: "Google", ...google, pkce: true, scope: "openid email profile",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token", extra: { prompt: "select_account" },
    profile: async (t, f) => {
      const p = await getJson(f, "https://openidconnect.googleapis.com/v1/userinfo", t);
      return { provider: "google", subject: String(p.sub), email: s(p.email), emailVerified: verified(p.email_verified), name: s(p.name), avatarUrl: s(p.picture) };
    },
  });

  const microsoft = pair("MICROSOFT");
  if (microsoft) out.push({
    id: "microsoft", label: "Microsoft", ...microsoft, pkce: true, scope: "openid email profile",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token", extra: { prompt: "select_account" },
    profile: async (t, f) => {
      const p = await getJson(f, "https://graph.microsoft.com/oidc/userinfo", t);
      // Work accounts let tenant admins set any email, so Microsoft addresses are never
      // treated as verified: they cannot link to an existing account by email.
      return { provider: "microsoft", subject: String(p.sub), email: s(p.email), emailVerified: false, name: s(p.name) };
    },
  });

  const linkedin = pair("LINKEDIN");
  if (linkedin) out.push({
    id: "linkedin", label: "LinkedIn", ...linkedin, pkce: false, scope: "openid profile email",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization", tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profile: async (t, f) => {
      const p = await getJson(f, "https://api.linkedin.com/v2/userinfo", t);
      return { provider: "linkedin", subject: String(p.sub), email: s(p.email), emailVerified: verified(p.email_verified), name: s(p.name), avatarUrl: s(p.picture) };
    },
  });

  const facebook = pair("FACEBOOK");
  const graph = `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION ?? "v23.0"}`;
  if (facebook) out.push({
    id: "facebook", label: "Facebook", ...facebook, pkce: false, scope: "email,public_profile",
    authorizeUrl: `https://www.facebook.com/${env.FACEBOOK_GRAPH_VERSION ?? "v23.0"}/dialog/oauth`, tokenUrl: `${graph}/oauth/access_token`,
    profile: async (t, f) => {
      const p = await getJson(f, `${graph}/me?fields=id,name,email,picture.type(large)`, t);
      const pic = (p.picture as { data?: { url?: string } } | undefined)?.data?.url;
      // Facebook only returns an email once the person has confirmed it.
      return { provider: "facebook", subject: String(p.id), email: s(p.email), emailVerified: Boolean(s(p.email)), name: s(p.name), avatarUrl: s(pic) };
    },
  });

  const eventbrite = pair("EVENTBRITE");
  if (eventbrite) out.push({
    id: "eventbrite", label: "Eventbrite", ...eventbrite, pkce: false, scope: "",
    authorizeUrl: "https://www.eventbrite.com/oauth/authorize", tokenUrl: "https://www.eventbrite.com/oauth/token",
    profile: async (t, f) => {
      const p = await getJson(f, "https://www.eventbriteapi.com/v3/users/me/", t);
      const emails = (p.emails as Array<{ email?: string; verified?: boolean; primary?: boolean }> | undefined) ?? [];
      const e = emails.find((x) => x.primary) ?? emails[0];
      return { provider: "eventbrite", subject: String(p.id), email: s(e?.email), emailVerified: verified(e?.verified), name: s(p.name) };
    },
  });
  return out;
}

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function authorizeUrl(p: ProviderConfig, redirectUri: string, state: string, challenge?: string): string {
  const q = new URLSearchParams({ response_type: "code", client_id: p.clientId, redirect_uri: redirectUri, state, ...(p.scope ? { scope: p.scope } : {}), ...(p.extra ?? {}) });
  if (p.pkce && challenge) { q.set("code_challenge", challenge); q.set("code_challenge_method", "S256"); }
  return `${p.authorizeUrl}?${q}`;
}

export async function exchangeCode(p: ProviderConfig, code: string, redirectUri: string, verifier: string | undefined, fetchImpl: typeof fetch): Promise<string> {
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: p.clientId, client_secret: p.clientSecret });
  if (p.pkce && verifier) body.set("code_verifier", verifier);
  let res: Response;
  try {
    res = await fetchImpl(p.tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new DomainError("PAYMENTS_UPSTREAM", `${p.label} did not answer, please try again`);
  }
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new DomainError("UNAUTHORIZED", `${p.label} sign-in failed${json.error_description ? `: ${json.error_description}` : ""}`);
  return json.access_token;
}

/** Only same-site relative paths survive as a post-login destination. */
export function safeReturnTo(v: unknown): string | undefined {
  return typeof v === "string" && /^\/(?!\/)[\x21-\x7e]*$/.test(v) && !v.includes("\\") ? v.slice(0, 500) : undefined;
}
