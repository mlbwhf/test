import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryIdentityRepos, createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { Identities, can, hashSecret } from "./identity.js";

function setup() {
  let now = new Date("2026-10-20T12:00:00Z");
  const clock = { now: () => now };
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), clock });
  let n = 0;
  const repos = createInMemoryIdentityRepos();
  const ids = new Identities(repos, core, clock, { next: (p: string) => `${p}_${++n}` });
  return { core, ids, repos, advance: (ms: number) => { now = new Date(now.getTime() + ms); } };
}
const google = (sub: string, email: string, verified = true) => ({ provider: "google", subject: sub, email, emailVerified: verified, name: "Alex Morgan" });

describe("sign-in and account linking", () => {
  it("creates a user once and finds it again by provider subject", async () => {
    const { ids } = setup();
    const a = await ids.signIn(google("g1", "Alex@Example.com"));
    const b = await ids.signIn(google("g1", "alex@example.com"));
    expect(b.id).toBe(a.id);
    expect(a.email).toBe("alex@example.com");
  });
  it("links a second provider by verified email, refuses an unverified one", async () => {
    const { ids } = setup();
    const a = await ids.signIn(google("g1", "alex@example.com"));
    const li = await ids.signIn({ provider: "linkedin", subject: "l1", email: "alex@example.com", emailVerified: true });
    expect(li.id).toBe(a.id);
    await expect(ids.signIn({ provider: "microsoft", subject: "m1", email: "alex@example.com", emailVerified: false })).rejects.toThrow(/already uses/);
  });
  it("requires an email for new accounts", async () => {
    const { ids } = setup();
    await expect(ids.signIn({ provider: "facebook", subject: "f1", emailVerified: false })).rejects.toThrow(/email/);
  });
});

describe("tokens and sessions", () => {
  it("login codes are single-use and short-lived", async () => {
    const { ids, advance } = setup();
    const u = await ids.signIn(google("g1", "a@x.co"));
    const code = await ids.issueLoginCode(u.id, "/events");
    const first = await ids.exchangeLoginCode(code);
    expect(first.token).toMatch(/^ses_/);
    expect(first.returnTo).toBe("/events");
    await expect(ids.exchangeLoginCode(code)).rejects.toThrow();
    const late = await ids.issueLoginCode(u.id);
    advance(3 * 60_000);
    await expect(ids.exchangeLoginCode(late)).rejects.toThrow();
  });
  it("stores only hashes, expires sessions, and signs out", async () => {
    const { ids, repos, advance } = setup();
    const u = await ids.signIn(google("g1", "a@x.co"));
    const { token, session } = await ids.createSession(u.id);
    expect(session.tokenHash).toBe(hashSecret(token));
    expect(JSON.stringify(session)).not.toContain(token);
    expect((await ids.resolveSession(token))?.user.id).toBe(u.id);
    expect(await ids.resolveSession("ses_forged")).toBeUndefined();
    await ids.signOut(token);
    expect(await ids.resolveSession(token)).toBeUndefined();
    const again = await ids.createSession(u.id);
    advance(31 * 86_400_000);
    expect(await ids.resolveSession(again.token)).toBeUndefined();
    expect(repos).toBeDefined();
  });
});

describe("organizations, teams and roles", () => {
  it("an independent instructor gets a practice named after them and an instructor profile", async () => {
    const { ids, core } = setup();
    const u = await ids.signIn(google("g1", "alex@example.com"));
    const { organization, membership } = await ids.createOrganizationFor(u.id, { kind: "individual", country: "CA", currency: "CAD" });
    expect(organization).toMatchObject({ name: "Alex Morgan", kind: "individual", currency: "CAD" });
    expect(membership.role).toBe("owner");
    const parties = await core.listParties(organization.id);
    expect(parties.find((p) => p.id === membership.partyId)).toMatchObject({ kind: "instructor", name: "Alex Morgan" });
  });

  it("a company invites an instructor and a finance person; invitations work by link or by verified email", async () => {
    const { ids } = setup();
    const owner = await ids.signIn(google("g1", "owner@acme.com"));
    const { organization: org } = await ids.createOrganizationFor(owner.id, { kind: "company", name: "Acme Training", country: "US", currency: "USD" });
    const { token: instructorToken } = await ids.invite(org.id, { userId: owner.id, role: "owner" }, { email: "teacher@gmail.com", role: "instructor" });
    await ids.invite(org.id, { userId: owner.id, role: "owner" }, { email: "books@acme.com", role: "finance" });

    // The instructor signs in with a different address and uses the emailed link.
    const teacher = await ids.signIn({ provider: "linkedin", subject: "l9", email: "t.other@gmail.com", emailVerified: true });
    const m = await ids.acceptInvitation(instructorToken, teacher.id);
    expect(m).toMatchObject({ role: "instructor" });
    expect(m.partyId).toBeDefined();
    await expect(ids.acceptInvitation(instructorToken, owner.id)).rejects.toThrow(/already used/);

    // Finance signs in with the invited, verified address: joined automatically.
    const books = await ids.signIn(google("g2", "books@acme.com"));
    const { token } = await ids.createSession(books.id, org.id);
    const ctx = await ids.resolveSession(token);
    expect(ctx?.role).toBe("finance");
    expect(ctx?.organization?.name).toBe("Acme Training");
    expect((await ids.listMembers(org.id)).map((x) => x.role).sort()).toEqual(["finance", "instructor", "owner"]);
    expect(await ids.listInvitations(org.id)).toEqual([]);
  });

  it("enforces who may invite, promote and remove, and keeps one owner", async () => {
    const { ids } = setup();
    const owner = await ids.signIn(google("g1", "owner@acme.com"));
    const { organization: org } = await ids.createOrganizationFor(owner.id, { kind: "company", name: "Acme", country: "US", currency: "USD" });
    await expect(ids.invite(org.id, { role: "instructor" }, { email: "x@y.co", role: "instructor" })).rejects.toThrow(/only owners and admins/);
    await expect(ids.invite(org.id, { role: "admin" }, { email: "x@y.co", role: "owner" })).rejects.toThrow(/only an owner/);
    await expect(ids.removeMember(org.id, "owner", owner.id)).rejects.toThrow(/at least one owner/);
    await expect(ids.changeRole(org.id, "owner", owner.id, "admin")).rejects.toThrow(/at least one owner/);
    const { token } = await ids.invite(org.id, { role: "owner" }, { email: "admin@acme.com", role: "admin" });
    const admin = await ids.signIn(google("g3", "someone@else.com"));
    await ids.acceptInvitation(token, admin.id);
    await expect(ids.changeRole(org.id, "admin", owner.id, "instructor")).rejects.toThrow(/only an owner/);
    expect((await ids.changeRole(org.id, "owner", admin.id, "finance")).role).toBe("finance");
  });

  it("switches the active organization only to ones the user belongs to", async () => {
    const { ids } = setup();
    const u = await ids.signIn(google("g1", "a@x.co"));
    const a = await ids.createOrganizationFor(u.id, { kind: "individual", country: "US", currency: "USD" });
    const b = await ids.createOrganizationFor(u.id, { kind: "company", name: "Second", country: "US", currency: "USD" });
    const { token } = await ids.createSession(u.id, a.organization.id);
    expect((await ids.switchOrganization(token, b.organization.id)).organization?.id).toBe(b.organization.id);
    const stranger = await ids.signIn(google("g2", "b@x.co"));
    const other = await ids.createOrganizationFor(stranger.id, { kind: "individual", country: "US", currency: "USD" });
    await expect(ids.switchOrganization(token, other.organization.id)).rejects.toThrow(/not a member/);
  });
});

describe("permissions", () => {
  it("matches the access matrix", () => {
    expect(can("instructor", "classes:write")).toBe(true);
    expect(can("instructor", "money:read")).toBe(false);
    expect(can("finance", "money:write")).toBe(true);
    expect(can("finance", "classes:write")).toBe(false);
    expect(can("finance", "classes:read")).toBe(true);
    expect(can("finance", "team")).toBe(false);
    expect(can("admin", "team")).toBe(true);
    expect(can(undefined, "classes:read")).toBe(false);
  });
});
