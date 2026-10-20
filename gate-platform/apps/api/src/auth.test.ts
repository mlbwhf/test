import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, InMemoryNotifier, createInMemoryRepos } from "@gate/core";
import { buildApp } from "./app.js";
import { configuredProviders, safeReturnTo } from "./oauth.js";
import { permissionFor } from "./auth.js";

const WEB = "https://app.test";
const API = "https://api.test";

async function setup(profiles: Record<string, Record<string, unknown>> = {}) {
  const mailer = new InMemoryNotifier();
  const calls: string[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push(url);
    if (url === "https://oauth2.googleapis.com/token") {
      const body = new URLSearchParams(String(init?.body));
      expect(body.get("client_secret")).toBe("g-secret");
      expect(body.get("code_verifier")).toBeTruthy();
      return new Response(JSON.stringify({ access_token: `at-${body.get("code")}` }));
    }
    if (url === "https://openidconnect.googleapis.com/v1/userinfo") {
      const at = String((init?.headers as Record<string, string>).authorization).replace("Bearer at-", "");
      return new Response(JSON.stringify(profiles[at] ?? {}));
    }
    return new Response("{}", { status: 404 });
  }) as unknown as typeof fetch;
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
  const app = await buildApp({ core, env: "test", adminKey: "admin", publicUrl: API, webUrl: WEB, mailer, fetchImpl, providers: configuredProviders({ GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-secret" }) });
  return { app, mailer, calls, core };
}

/** Runs the whole Google flow and returns a session token. */
async function googleLogin(app: Awaited<ReturnType<typeof setup>>["app"], code: string, returnTo?: string) {
  const start = await app.inject(`/auth/google/start${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`);
  expect(start.statusCode).toBe(302);
  const auth = new URL(start.headers.location as string);
  expect(auth.origin + auth.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(auth.searchParams.get("client_id")).toBe("g-id");
  expect(auth.searchParams.get("redirect_uri")).toBe(`${API}/auth/google/callback`);
  expect(auth.searchParams.get("code_challenge_method")).toBe("S256");
  const cb = await app.inject(`/auth/google/callback?code=${code}&state=${encodeURIComponent(auth.searchParams.get("state")!)}`);
  expect(cb.statusCode).toBe(303);
  const done = new URL(cb.headers.location as string);
  expect(done.origin + done.pathname).toBe(`${WEB}/auth/complete`);
  const ex = await app.inject({ method: "POST", url: "/auth/exchange", payload: { code: done.searchParams.get("code") } });
  expect(ex.statusCode).toBe(200);
  return ex.json() as { token: string; returnTo: string | null; me: { organization: unknown; role: string | null; permissions: string[] } };
}
const B = (t: string) => ({ authorization: `Bearer ${t}` });
const BJ = (t: string) => ({ authorization: `Bearer ${t}`, "content-type": "application/json" });

describe("sign-in", () => {
  it("lists only configured providers", async () => {
    const { app } = await setup();
    expect((await app.inject("/auth/providers")).json()).toEqual({ providers: [{ id: "google", label: "Google" }], email: true });
    expect(configuredProviders({ LINKEDIN_CLIENT_ID: "x" })).toEqual([]);
  });

  it("Google: sign in, create an independent practice, then use the tenant API with the session", async () => {
    const { app } = await setup({ c1: { sub: "g-1", email: "alex@example.com", email_verified: true, name: "Alex Morgan" } });
    const { token, me, returnTo } = await googleLogin(app, "c1", "/events");
    expect(returnTo).toBe("/events");
    expect(me.organization).toBeNull();
    expect((await app.inject({ url: "/v1/events", headers: B(token) })).statusCode).toBe(403);
    const created = await app.inject({ method: "POST", url: "/auth/organizations", headers: BJ(token), payload: { kind: "individual", country: "CA", currency: "CAD" } });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ organization: { name: "Alex Morgan", kind: "individual", currency: "CAD", paymentsConnected: false }, role: "owner" });
    expect((await app.inject({ url: "/v1/events", headers: B(token) })).statusCode).toBe(200);
    expect((await app.inject({ url: "/v1/parties", headers: B(token) })).json().items[0]).toMatchObject({ kind: "instructor", name: "Alex Morgan" });
    await app.inject({ method: "POST", url: "/auth/logout", headers: B(token) });
    expect((await app.inject({ url: "/v1/events", headers: B(token) })).statusCode).toBe(401);
  });

  it("rejects forged or replayed state and ignores off-site return paths", async () => {
    const { app } = await setup({ c1: { sub: "g-1", email: "a@x.co", email_verified: true } });
    const bad = await app.inject("/auth/google/callback?code=c1&state=st_forged");
    expect(bad.statusCode).toBe(303);
    expect(bad.headers.location).toMatch(/^https:\/\/app\.test\/login\?error=/);
    const start = await app.inject("/auth/google/start?returnTo=%2F%2Fevil.com");
    const state = new URL(start.headers.location as string).searchParams.get("state")!;
    const ok = await app.inject(`/auth/google/callback?code=c1&state=${encodeURIComponent(state)}`);
    const code = new URL(ok.headers.location as string).searchParams.get("code");
    expect((await app.inject({ method: "POST", url: "/auth/exchange", payload: { code } })).json().returnTo).toBeNull();
    const replay = await app.inject(`/auth/google/callback?code=c1&state=${encodeURIComponent(state)}`);
    expect(replay.headers.location).toMatch(/\/login\?error=/);
    expect(safeReturnTo("/dashboard?x=1")).toBe("/dashboard?x=1");
    expect(safeReturnTo("https://evil.com")).toBeUndefined();
    expect(safeReturnTo("/\\evil.com")).toBeUndefined();
  });

  it("email link: one-time, and the same answer whether or not the account exists", async () => {
    const { app, mailer } = await setup();
    const sent = await app.inject({ method: "POST", url: "/auth/email", payload: { email: "New@Person.com", returnTo: "/courses" } });
    expect(sent.statusCode).toBe(202);
    const mail = mailer.sent.at(-1)!;
    expect(mail.to).toBe("new@person.com");
    const link = mail.text.match(/https:\/\/api\.test\/auth\/email\/verify\?token=\S+/)![0];
    const path = link.replace(API, "");
    const v = await app.inject(path);
    expect(v.headers.location).toMatch(/^https:\/\/app\.test\/auth\/complete\?code=/);
    const again = await app.inject(path);
    expect(again.headers.location).toMatch(/\/login\?error=/);
    const code = new URL(v.headers.location as string).searchParams.get("code");
    const ex = (await app.inject({ method: "POST", url: "/auth/exchange", payload: { code } })).json();
    expect(ex.returnTo).toBe("/courses");
  });
});

describe("teams and roles", () => {
  it("company owner invites instructor and finance; each role sees only what it should", async () => {
    const { app, mailer } = await setup({
      o: { sub: "g-o", email: "owner@acme.com", email_verified: true, name: "Olive" },
      i: { sub: "g-i", email: "teacher@gmail.com", email_verified: true, name: "Ivan" },
      f: { sub: "g-f", email: "books@acme.com", email_verified: true, name: "Fay" },
    });
    const owner = (await googleLogin(app, "o")).token;
    await app.inject({ method: "POST", url: "/auth/organizations", headers: BJ(owner), payload: { kind: "company", name: "Acme Training", country: "US", currency: "USD" } });

    const inv = await app.inject({ method: "POST", url: "/v1/invitations", headers: BJ(owner), payload: { email: "teacher@gmail.com", role: "instructor" } });
    expect(inv.statusCode).toBe(201);
    expect(inv.json()).toMatchObject({ emailed: true, invitation: { role: "instructor" } });
    expect(mailer.sent.at(-1)!.subject).toBe("Join Acme Training on EnrollClass");
    const token = decodeURIComponent(inv.json().acceptUrl.split("/invite/")[1]);
    await app.inject({ method: "POST", url: "/v1/invitations", headers: BJ(owner), payload: { email: "books@acme.com", role: "finance" } });

    const teacher = (await googleLogin(app, "i")).token;
    const accepted = await app.inject({ method: "POST", url: "/auth/invitations/accept", headers: BJ(teacher), payload: { token } });
    expect(accepted.json()).toMatchObject({ role: "instructor", organization: { name: "Acme Training" }, permissions: ["classes:write", "classes:read"] });

    // Finance joins automatically: signed in with the invited, verified address.
    const fin = await googleLogin(app, "f");
    expect(fin.me).toMatchObject({ role: "finance" });

    const status = async (t: string, method: string, url: string, payload?: unknown) => (await app.inject({ method: method as "GET", url, headers: payload ? BJ(t) : B(t), ...(payload ? { payload } : {}) })).statusCode;
    expect(await status(teacher, "POST", "/v1/courses", { slug: "pmp", name: "PMP" })).toBe(201);
    expect(await status(teacher, "GET", "/v1/orders")).toBe(403);
    expect(await status(teacher, "GET", "/v1/members")).toBe(403);
    expect(await status(teacher, "PATCH", "/v1/organizations/me", { name: "Hijack" })).toBe(403);
    expect(await status(fin.token, "GET", "/v1/orders")).toBe(200);
    expect(await status(fin.token, "GET", "/v1/ledger/balances")).toBe(200);
    expect(await status(teacher, "GET", "/v1/ledger/balances")).toBe(403);
    expect(await status(fin.token, "GET", "/v1/courses")).toBe(200);
    expect(await status(fin.token, "POST", "/v1/courses", { slug: "x", name: "X" })).toBe(403);
    expect(await status(owner, "GET", "/v1/members")).toBe(200);
    const members = (await app.inject({ url: "/v1/members", headers: B(owner) })).json();
    expect(members.members.map((m: { role: string }) => m.role).sort()).toEqual(["finance", "instructor", "owner"]);
    expect(members.invitations).toEqual([]);

    // Today: the instructor gets cohorts but no money and no setup chores; finance gets money.
    const home = async (t: string) => (await app.inject({ url: "/v1/home", headers: B(t) })).json();
    expect(await home(teacher)).toMatchObject({ money: null, attention: [] });
    expect((await home(fin.token)).money).toEqual([{ currency: "USD", grossMinor: 0, netMinor: 0, feesMinor: 0, heldMinor: 0, paidOrders: 0 }]);
    expect((await home(owner)).attention.map((a: { kind: string }) => a.kind)).toContain("payments_setup");

    // Instructor view and control.
    const J = async (t: string, method: string, url: string, payload?: unknown) => app.inject({ method: method as "GET", url, headers: payload ? BJ(t) : B(t), ...(payload ? { payload } : {}) });
    const mine = (await J(teacher, "POST", "/v1/events", { name: "Ivan's class", startsAt: "2026-11-02T14:00:00Z" })).json();
    const ivanParty = mine.instructorIds[0];
    expect(mine).toMatchObject({ status: "live", instructorIds: [expect.stringMatching(/^party_/)] });
    const theirs = (await J(owner, "POST", "/v1/events", { name: "Olive's class", startsAt: "2026-11-03T14:00:00Z" })).json();
    expect((await J(teacher, "GET", "/v1/events")).json().items.map((e: { name: string }) => e.name)).toEqual(["Ivan's class"]);
    expect((await J(teacher, "GET", "/v1/events/overview")).json().items).toHaveLength(1);
    expect((await J(teacher, "GET", `/v1/events/${theirs.id}`)).statusCode).toBe(404);
    expect((await J(teacher, "GET", `/v1/seats`)).statusCode).toBe(403);
    expect((await J(teacher, "GET", `/v1/seats?eventId=${theirs.id}`)).statusCode).toBe(404);
    expect((await J(teacher, "POST", `/v1/checkins`, { code: "EC-AAAA-BBBB", eventId: theirs.id })).statusCode).toBe(404);
    expect((await J(owner, "GET", "/v1/events")).json().items).toHaveLength(2);

    expect((await J(owner, "PATCH", "/v1/organizations/me/instructor-access", { publish: "approval" })).json().instructorAccess).toEqual({ scope: "own", publish: "approval" });
    expect((await J(teacher, "PATCH", "/v1/organizations/me/instructor-access", { scope: "all" })).statusCode).toBe(403);
    const draft = (await J(teacher, "POST", "/v1/events", { name: "Needs approval", startsAt: "2026-11-09T14:00:00Z" })).json();
    expect(draft.status).toBe("draft");
    expect((await home(owner)).attention.map((a: { kind: string }) => a.kind)).toContain("approval");
    expect((await J(teacher, "POST", `/v1/events/${draft.id}/publish`, {})).statusCode).toBe(403);
    expect((await J(owner, "POST", `/v1/events/${draft.id}/publish`, {})).json().status).toBe("live");

    expect((await J(owner, "PUT", `/v1/events/${theirs.id}/instructors`, { instructorIds: [ivanParty] })).json().instructorIds).toEqual([ivanParty]);
    expect((await J(teacher, "GET", `/v1/events/${theirs.id}`)).statusCode).toBe(200);
    await J(owner, "PATCH", "/v1/organizations/me/instructor-access", { scope: "all" });
    expect((await J(owner, "POST", "/v1/events", { name: "Another", startsAt: "2026-11-10T14:00:00Z" })).statusCode).toBe(201);
    expect((await J(teacher, "GET", "/v1/events")).json().items).toHaveLength(4);
  });

  it("maps routes to permissions", () => {
    expect(permissionFor("GET", "/v1/events")).toBe("classes:read");
    expect(permissionFor("POST", "/v1/events/evt_1/ticket-types")).toBe("classes:write");
    expect(permissionFor("POST", "/v1/events/evt_1/release")).toBe("money:write");
    expect(permissionFor("POST", "/v1/seats/s/cancel")).toBe("money:write");
    expect(permissionFor("GET", "/v1/ledger/balances?x")).toBe("money:read");
    expect(permissionFor("POST", "/v1/organizations/me/payments/connect")).toBe("settings");
    expect(permissionFor("GET", "/v1/organizations/me")).toBe("classes:read");
    expect(permissionFor("DELETE", "/v1/members/u1")).toBe("team");
    expect(permissionFor("POST", "/v1/checkins")).toBe("classes:write");
  });

  it("operator owner link: needs the admin key, signs in the owner of an existing organization", async () => {
    const { app } = await setup();
    const org = (await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "CA", currency: "USD" } })).json().organization;
    expect((await app.inject({ method: "POST", url: `/v1/organizations/${org.id}/owner-link`, payload: { email: "me@agile-agilist.com" } })).statusCode).toBe(401);
    const res = await app.inject({ method: "POST", url: `/v1/organizations/${org.id}/owner-link`, headers: { "x-admin-key": "admin" }, payload: { email: "me@agile-agilist.com" } });
    expect(res.statusCode).toBe(200);
    const v = await app.inject(res.json().signInUrl.replace(API, ""));
    const code = new URL(v.headers.location as string).searchParams.get("code");
    const ex = (await app.inject({ method: "POST", url: "/auth/exchange", payload: { code } })).json();
    expect(ex.returnTo).toBe("/dashboard");
    expect(ex.me).toMatchObject({ role: "owner", organization: { id: org.id, name: "Agile Agilist" } });
  });

  it("Stripe counts as connected only once Stripe enables the account, and the button resumes setup", async () => {
    const payments = new FakePaymentsAdapter();
    payments.requireOnboarding = true;
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments });
    const mailer = new InMemoryNotifier();
    const app = await buildApp({ core, env: "test", publicUrl: API, webUrl: WEB, mailer });
    await app.inject({ method: "POST", url: "/auth/email", payload: { email: "solo@x.co" } });
    const link = mailer.sent.at(-1)!.text.match(/https:\/\/api\.test\S+/)![0].replace(API, "");
    const code = new URL((await app.inject(link)).headers.location as string).searchParams.get("code");
    const token = (await app.inject({ method: "POST", url: "/auth/exchange", payload: { code } })).json().token as string;
    await app.inject({ method: "POST", url: "/auth/organizations", headers: BJ(token), payload: { kind: "individual", country: "CA", currency: "CAD" } });
    const me = async () => (await app.inject({ url: "/auth/me", headers: B(token) })).json().organization;
    expect(await me()).toMatchObject({ paymentsConnected: false, paymentsSetup: "none" });

    const c1 = (await app.inject({ method: "POST", url: "/v1/organizations/me/payments/connect", headers: BJ(token), payload: {} })).json();
    expect(c1).toMatchObject({ ready: false });
    expect(c1.onboardingUrl).toBeTruthy();
    expect(await me()).toMatchObject({ paymentsConnected: false, paymentsSetup: "incomplete" });
    const c2 = (await app.inject({ method: "POST", url: "/v1/organizations/me/payments/connect", headers: BJ(token), payload: {} })).json();
    expect(c2.onboardingUrl).toContain("resume=1");

    payments.completeOnboarding(c1.paymentsAccountRef);
    const refreshed = (await app.inject({ url: "/v1/organizations/me/payments", headers: B(token) })).json();
    expect(refreshed).toMatchObject({ setup: "ready", status: { ready: true } });
    expect(await me()).toMatchObject({ paymentsConnected: true, paymentsSetup: "ready" });
  });
});
