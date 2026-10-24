// How people prove who they are. Today: email and password, or an API key, with new addresses
// confirmed by an emailed code (signups.ts). Single sign-on plugs in here: each provider is
// listed on the sign-in page, and a sign-in through it links to a user by the provider's
// subject id (User.identities), so a person can use the password and SSO side by side.
//
// Planned providers, not yet wired: OIDC (Microsoft Entra ID, Okta, Google Workspace, Auth0,
// Keycloak) with the authorization-code flow and PKCE, and SAML 2.0 for older directories.
// A provider that verifies email addresses (OIDC's email_verified) also confirms the address,
// so its users skip the emailed code. Configuration is per server, from TRAINYARD_SSO_*.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface SsoProvider {
  /** Stable id stored with linked identities, e.g. "entra" or "okta-acme". */
  id: string;
  kind: "oidc" | "saml";
  /** Button text on the sign-in page: "Sign in with Microsoft". */
  label: string;
  /** OIDC issuer URL or SAML metadata URL. */
  issuer: string;
  /** Email domains that go straight to this provider (home realm discovery). */
  domains?: string[];
}

export interface IdentityOptions {
  emailVerification: "required" | "off";
  sso: SsoProvider[];
}

export function registerIdentityRoutes(app: App, opts: IdentityOptions) {
  // The sign-in and sign-up pages read this to decide what to show.
  app.get("/v1/auth/providers", async () => ({
    password: true,
    apiKey: true,
    emailVerification: opts.emailVerification,
    sso: opts.sso.map((p) => ({ id: p.id, kind: p.kind, label: p.label, ...(p.domains?.length ? { domains: p.domains } : {}) })),
  }));
}
