import { createHash, randomBytes } from "node:crypto";
import { DomainError } from "./errors.js";
import type { Clock, IdGenerator } from "./ports.js";
import type { Organization } from "./types.js";

// People and their access. A user signs in with an external identity (Google, Microsoft,
// LinkedIn, Facebook, Eventbrite) or an emailed link, and belongs to one or more
// organizations with a role. An independent instructor is an organization of one.
// Every secret handed out (session, login code, invitation, email link, OAuth state) is
// random, stored only as a SHA-256 hash, and expires.

export type Role = "owner" | "admin" | "instructor" | "finance";
export const ROLES: Role[] = ["owner", "admin", "instructor", "finance"];
export const isManager = (r: Role | undefined) => r === "owner" || r === "admin";

/**
 * What each role may do. Every authenticated API route maps to one permission; reads of
 * classes are open to every member, so finance can reconcile against rosters.
 */
export type Permission = "team" | "settings" | "classes:write" | "classes:read" | "money:read" | "money:write";
const GRANTS: Record<Role, readonly Permission[]> = {
  owner: ["team", "settings", "classes:write", "classes:read", "money:read", "money:write"],
  admin: ["team", "settings", "classes:write", "classes:read", "money:read", "money:write"],
  instructor: ["classes:write", "classes:read"],
  finance: ["classes:read", "money:read", "money:write"],
};
export const can = (role: Role | undefined, p: Permission) => Boolean(role && GRANTS[role].includes(p));
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner: everything, including other owners",
  admin: "Admin: team, settings, classes and money",
  instructor: "Instructor: courses, cohorts, check-in",
  finance: "Finance: orders, payouts, refunds, reports",
};

export interface User {
  id: string;
  /** Lower-cased. */
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Identity {
  provider: string;
  subject: string;
  userId: string;
  email?: string;
  createdAt: Date;
}

export interface Membership {
  organizationId: string;
  userId: string;
  role: Role;
  /** The instructor party used for this person's fees and cohort assignments. */
  partyId?: string;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  tokenHash: string;
  invitedByUserId?: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedByUserId?: string;
  revokedAt?: Date;
}

export interface AuthSession {
  id: string;
  tokenHash: string;
  userId: string;
  organizationId?: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
}

export type TokenKind = "oauth_state" | "login_code" | "email_link";
export interface OneTimeToken {
  hash: string;
  kind: TokenKind;
  payload: Record<string, unknown>;
  expiresAt: Date;
}

export interface UserRepo {
  create(u: User): Promise<void>;
  update(u: User): Promise<void>;
  get(id: string): Promise<User | undefined>;
  getByEmail(email: string): Promise<User | undefined>;
}
export interface IdentityRepo {
  create(i: Identity): Promise<void>;
  get(provider: string, subject: string): Promise<Identity | undefined>;
  listByUser(userId: string): Promise<Identity[]>;
}
export interface MembershipRepo {
  upsert(m: Membership): Promise<void>;
  get(organizationId: string, userId: string): Promise<Membership | undefined>;
  listByUser(userId: string): Promise<Membership[]>;
  listByOrganization(organizationId: string): Promise<Membership[]>;
  delete(organizationId: string, userId: string): Promise<void>;
}
export interface InvitationRepo {
  create(i: Invitation): Promise<void>;
  update(i: Invitation): Promise<void>;
  get(id: string): Promise<Invitation | undefined>;
  getByTokenHash(hash: string): Promise<Invitation | undefined>;
  listByOrganization(organizationId: string): Promise<Invitation[]>;
  listOpenByEmail(email: string, now: Date): Promise<Invitation[]>;
}
export interface AuthSessionRepo {
  create(s: AuthSession): Promise<void>;
  update(s: AuthSession): Promise<void>;
  getByTokenHash(hash: string): Promise<AuthSession | undefined>;
  delete(id: string): Promise<void>;
}
export interface OneTimeTokenRepo {
  put(t: OneTimeToken): Promise<void>;
  /** Atomically returns and burns an unexpired token of that kind; undefined otherwise. */
  consume(hash: string, kind: TokenKind, now: Date): Promise<Record<string, unknown> | undefined>;
}
export interface IdentityRepos {
  users: UserRepo;
  identities: IdentityRepo;
  memberships: MembershipRepo;
  invitations: InvitationRepo;
  sessions: AuthSessionRepo;
  tokens: OneTimeTokenRepo;
}

/** What a provider (or the email link) vouches for after a successful sign-in. */
export interface VerifiedProfile {
  provider: string;
  subject: string;
  email?: string | undefined;
  /** Only verified addresses link to existing accounts or accept invitations by email. */
  emailVerified: boolean;
  name?: string | undefined;
  avatarUrl?: string | undefined;
}

/** The slice of Core this module needs; keeps it testable without the whole engine. */
export interface OrganizationsPort {
  createOrganization(input: { name: string; country: string; currency: string; kind?: "company" | "individual" | undefined }): Promise<{ organization: Organization }>;
  getOrganization(id: string): Promise<Organization>;
  createParty(organizationId: string, input: { name: string; kind: "instructor" }): Promise<{ id: string }>;
}

export const SESSION_TTL_MS = 30 * 86_400_000;
export const INVITE_TTL_MS = 14 * 86_400_000;
const TTL: Record<TokenKind, number> = { oauth_state: 10 * 60_000, login_code: 2 * 60_000, email_link: 20 * 60_000 };

export const hashSecret = (raw: string) => createHash("sha256").update(raw).digest("hex");
const secret = (prefix: string) => `${prefix}_${randomBytes(32).toString("base64url")}`;
const normEmail = (e: string) => e.trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SessionContext {
  session: AuthSession;
  user: User;
  memberships: Array<Membership & { organizationName: string; organizationKind: Organization["kind"] }>;
  /** Active organization, when the user has picked or created one. */
  organization?: Organization;
  role?: Role;
}

export class Identities {
  constructor(private readonly repos: IdentityRepos, private readonly orgs: OrganizationsPort, private readonly clock: Clock, private readonly ids: IdGenerator) {}

  // ---------- one-time tokens ----------

  async issueToken(kind: TokenKind, payload: Record<string, unknown>): Promise<string> {
    const raw = secret(kind === "oauth_state" ? "st" : kind === "login_code" ? "lc" : "el");
    await this.repos.tokens.put({ hash: hashSecret(raw), kind, payload, expiresAt: new Date(this.clock.now().getTime() + TTL[kind]) });
    return raw;
  }

  async consumeToken(kind: TokenKind, raw: string): Promise<Record<string, unknown>> {
    const payload = raw ? await this.repos.tokens.consume(hashSecret(raw), kind, this.clock.now()) : undefined;
    if (!payload) throw new DomainError("UNAUTHORIZED", kind === "email_link" ? "this sign-in link has expired or was already used" : "sign-in expired, please try again");
    return payload;
  }

  // ---------- sign-in ----------

  /**
   * Find or create the user behind a verified external identity. A verified email links
   * to an existing account with that address; an unverified one never does (that is how
   * account takeover through a self-asserted email is prevented).
   */
  async signIn(p: VerifiedProfile): Promise<User> {
    const now = this.clock.now();
    const email = p.email ? normEmail(p.email) : undefined;
    let user: User | undefined;
    const identity = await this.repos.identities.get(p.provider, p.subject);
    if (identity) user = await this.repos.users.get(identity.userId);
    if (!user && email) {
      const existing = await this.repos.users.getByEmail(email);
      if (existing) {
        if (!p.emailVerified) throw new DomainError("CONFLICT", `an account already uses ${email}`, "sign in the way you did before; this provider did not confirm the address");
        user = existing;
      }
    }
    if (!user) {
      if (!email || !EMAIL_RE.test(email)) throw new DomainError("VALIDATION", "the provider did not share an email address", "allow email access, or sign in with an emailed link");
      user = { id: this.ids.next("usr"), email, emailVerified: p.emailVerified, ...(p.name ? { name: p.name } : {}), ...(p.avatarUrl ? { avatarUrl: p.avatarUrl } : {}), createdAt: now };
      await this.repos.users.create(user);
    }
    if (!identity) await this.repos.identities.create({ provider: p.provider, subject: p.subject, userId: user.id, ...(email ? { email } : {}), createdAt: now });
    const next: User = {
      ...user,
      lastLoginAt: now,
      emailVerified: user.emailVerified || (p.emailVerified && email === user.email),
      ...(!user.name && p.name ? { name: p.name } : {}),
      ...(!user.avatarUrl && p.avatarUrl ? { avatarUrl: p.avatarUrl } : {}),
    };
    await this.repos.users.update(next);
    if (next.emailVerified) await this.acceptOpenInvitations(next);
    return next;
  }

  /** Short-lived code that the web app trades for a session (keeps tokens out of URLs). */
  issueLoginCode(userId: string, returnTo?: string): Promise<string> {
    return this.issueToken("login_code", { userId, ...(returnTo ? { returnTo } : {}) });
  }

  async exchangeLoginCode(raw: string): Promise<{ token: string; context: SessionContext; returnTo?: string }> {
    const payload = await this.consumeToken("login_code", raw);
    const userId = String(payload.userId);
    const memberships = await this.repos.memberships.listByUser(userId);
    const { token } = await this.createSession(userId, memberships[0]?.organizationId);
    const context = await this.resolveSession(token);
    return { token, context: context!, ...(typeof payload.returnTo === "string" ? { returnTo: payload.returnTo } : {}) };
  }

  async createSession(userId: string, organizationId?: string): Promise<{ token: string; session: AuthSession }> {
    const now = this.clock.now();
    const token = secret("ses");
    const session: AuthSession = { id: this.ids.next("sess"), tokenHash: hashSecret(token), userId, ...(organizationId ? { organizationId } : {}), createdAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS), lastSeenAt: now };
    await this.repos.sessions.create(session);
    return { token, session };
  }

  /** Undefined for unknown or expired tokens. Extends the session when used after a day. */
  async resolveSession(token: string | undefined): Promise<SessionContext | undefined> {
    if (!token || !token.startsWith("ses_")) return undefined;
    const now = this.clock.now();
    let session = await this.repos.sessions.getByTokenHash(hashSecret(token));
    if (!session || session.expiresAt <= now) return undefined;
    const user = await this.repos.users.get(session.userId);
    if (!user) return undefined;
    if (now.getTime() - session.lastSeenAt.getTime() > 86_400_000) {
      session = { ...session, lastSeenAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) };
      await this.repos.sessions.update(session);
    }
    const raw = await this.repos.memberships.listByUser(user.id);
    const memberships: SessionContext["memberships"] = [];
    let organization: Organization | undefined;
    for (const m of raw) {
      const org = await this.orgs.getOrganization(m.organizationId);
      memberships.push({ ...m, organizationName: org.name, organizationKind: org.kind });
      if (m.organizationId === session.organizationId) organization = org;
    }
    const role = organization ? raw.find((m) => m.organizationId === organization!.id)?.role : undefined;
    return { session, user, memberships, ...(organization ? { organization } : {}), ...(role ? { role } : {}) };
  }

  async switchOrganization(token: string, organizationId: string): Promise<SessionContext> {
    const ctx = await this.resolveSession(token);
    if (!ctx) throw new DomainError("UNAUTHORIZED", "not signed in");
    if (!ctx.memberships.some((m) => m.organizationId === organizationId)) throw new DomainError("NOT_FOUND", "you are not a member of that organization");
    await this.repos.sessions.update({ ...ctx.session, organizationId });
    return (await this.resolveSession(token))!;
  }

  async signOut(token: string): Promise<void> {
    const s = token ? await this.repos.sessions.getByTokenHash(hashSecret(token)) : undefined;
    if (s) await this.repos.sessions.delete(s.id);
  }

  // ---------- organizations ----------

  /**
   * Self-serve: anyone signed in can create an organization (a training company) or an
   * individual practice (one instructor). The creator becomes its owner; an individual
   * is also registered as the practice's instructor.
   */
  async createOrganizationFor(userId: string, input: { kind: "company" | "individual"; name?: string | undefined; country: string; currency: string }): Promise<{ organization: Organization; membership: Membership }> {
    const user = await this.repos.users.get(userId);
    if (!user) throw new DomainError("UNAUTHORIZED", "not signed in");
    const name = (input.name?.trim() || (input.kind === "individual" ? user.name ?? user.email.split("@")[0]! : "")).slice(0, 120);
    if (!name) throw new DomainError("VALIDATION", "organization name is required");
    const owned = (await this.repos.memberships.listByUser(userId)).filter((m) => m.role === "owner").length;
    if (owned >= 5) throw new DomainError("CONFLICT", "you already own 5 organizations", "contact support to raise the limit");
    const { organization: org } = await this.orgs.createOrganization({ name, country: input.country.toUpperCase(), currency: input.currency.toUpperCase(), kind: input.kind });
    let partyId: string | undefined;
    if (input.kind === "individual") partyId = (await this.orgs.createParty(org.id, { name: user.name ?? name, kind: "instructor" })).id;
    const membership: Membership = { organizationId: org.id, userId, role: "owner", ...(partyId ? { partyId } : {}), createdAt: this.clock.now() };
    await this.repos.memberships.upsert(membership);
    return { organization: org, membership };
  }

  // ---------- team ----------

  async listMembers(organizationId: string): Promise<Array<Membership & { user: Pick<User, "id" | "email" | "name" | "avatarUrl"> }>> {
    const out = [];
    for (const m of await this.repos.memberships.listByOrganization(organizationId)) {
      const u = await this.repos.users.get(m.userId);
      if (u) out.push({ ...m, user: { id: u.id, email: u.email, ...(u.name ? { name: u.name } : {}), ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}) } });
    }
    return out;
  }

  async listInvitations(organizationId: string): Promise<Invitation[]> {
    const now = this.clock.now();
    return (await this.repos.invitations.listByOrganization(organizationId)).filter((i) => !i.acceptedAt && !i.revokedAt && i.expiresAt > now);
  }

  /** Returns the raw token for the email link; only owners can invite owners. */
  async invite(organizationId: string, by: { userId?: string | undefined; role: Role }, input: { email: string; role: Role }): Promise<{ invitation: Invitation; token: string }> {
    if (!isManager(by.role)) throw new DomainError("FORBIDDEN", "only owners and admins can invite");
    if (input.role === "owner" && by.role !== "owner") throw new DomainError("FORBIDDEN", "only an owner can invite another owner");
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email)) throw new DomainError("VALIDATION", "invalid email address");
    const existing = await this.repos.users.getByEmail(email);
    if (existing && (await this.repos.memberships.get(organizationId, existing.id))) throw new DomainError("CONFLICT", `${email} is already a member`);
    const now = this.clock.now();
    for (const open of await this.listInvitations(organizationId)) if (open.email === email) await this.repos.invitations.update({ ...open, revokedAt: now });
    const token = secret("inv");
    const invitation: Invitation = { id: this.ids.next("inv"), organizationId, email, role: input.role, tokenHash: hashSecret(token), ...(by.userId ? { invitedByUserId: by.userId } : {}), createdAt: now, expiresAt: new Date(now.getTime() + INVITE_TTL_MS) };
    await this.repos.invitations.create(invitation);
    return { invitation, token };
  }

  async revokeInvitation(organizationId: string, invitationId: string): Promise<void> {
    const inv = await this.repos.invitations.get(invitationId);
    if (!inv || inv.organizationId !== organizationId) throw new DomainError("NOT_FOUND", "invitation not found");
    await this.repos.invitations.update({ ...inv, revokedAt: this.clock.now() });
  }

  /** The emailed token proves control of the invited address; any signed-in user holding it may accept. */
  async acceptInvitation(token: string, userId: string): Promise<Membership> {
    const inv = token ? await this.repos.invitations.getByTokenHash(hashSecret(token)) : undefined;
    const now = this.clock.now();
    if (!inv || inv.revokedAt || inv.expiresAt <= now) throw new DomainError("NOT_FOUND", "this invitation has expired or was withdrawn", "ask for a new one");
    if (inv.acceptedAt) {
      if (inv.acceptedByUserId === userId) return (await this.repos.memberships.get(inv.organizationId, userId))!;
      throw new DomainError("CONFLICT", "this invitation was already used");
    }
    return this.join(inv, userId);
  }

  async changeRole(organizationId: string, by: Role, userId: string, role: Role): Promise<Membership> {
    if (!isManager(by)) throw new DomainError("FORBIDDEN", "only owners and admins can change roles");
    const m = await this.repos.memberships.get(organizationId, userId);
    if (!m) throw new DomainError("NOT_FOUND", "member not found");
    if ((role === "owner" || m.role === "owner") && by !== "owner") throw new DomainError("FORBIDDEN", "only an owner can change an owner's role or make someone owner");
    if (m.role === "owner" && role !== "owner") await this.assertAnotherOwner(organizationId, userId);
    let partyId = m.partyId;
    // Someone becoming an instructor gets an instructor profile so classes can be assigned to them.
    if (!partyId && role === "instructor") {
      const u = await this.repos.users.get(userId);
      partyId = (await this.orgs.createParty(organizationId, { name: u?.name ?? u?.email ?? "Instructor", kind: "instructor" })).id;
    }
    const next = { ...m, role, ...(partyId ? { partyId } : {}) };
    await this.repos.memberships.upsert(next);
    return next;
  }

  async removeMember(organizationId: string, by: Role, userId: string): Promise<void> {
    if (!isManager(by)) throw new DomainError("FORBIDDEN", "only owners and admins can remove members");
    const m = await this.repos.memberships.get(organizationId, userId);
    if (!m) throw new DomainError("NOT_FOUND", "member not found");
    if (m.role === "owner") {
      if (by !== "owner") throw new DomainError("FORBIDDEN", "only an owner can remove an owner");
      await this.assertAnotherOwner(organizationId, userId);
    }
    await this.repos.memberships.delete(organizationId, userId);
  }

  private async assertAnotherOwner(organizationId: string, userId: string) {
    const owners = (await this.repos.memberships.listByOrganization(organizationId)).filter((x) => x.role === "owner" && x.userId !== userId);
    if (owners.length === 0) throw new DomainError("CONFLICT", "an organization needs at least one owner", "make someone else owner first");
  }

  private async acceptOpenInvitations(user: User) {
    for (const inv of await this.repos.invitations.listOpenByEmail(user.email, this.clock.now())) {
      if (!(await this.repos.memberships.get(inv.organizationId, user.id))) await this.join(inv, user.id);
      else await this.repos.invitations.update({ ...inv, acceptedAt: this.clock.now(), acceptedByUserId: user.id });
    }
  }

  private async join(inv: Invitation, userId: string): Promise<Membership> {
    const now = this.clock.now();
    const existing = await this.repos.memberships.get(inv.organizationId, userId);
    let partyId = existing?.partyId;
    if (!partyId && inv.role === "instructor") {
      const u = await this.repos.users.get(userId);
      partyId = (await this.orgs.createParty(inv.organizationId, { name: u?.name ?? u?.email ?? inv.email, kind: "instructor" })).id;
    }
    const membership: Membership = { organizationId: inv.organizationId, userId, role: existing && existing.role === "owner" ? "owner" : inv.role, ...(partyId ? { partyId } : {}), createdAt: existing?.createdAt ?? now };
    await this.repos.memberships.upsert(membership);
    await this.repos.invitations.update({ ...inv, acceptedAt: now, acceptedByUserId: userId });
    return membership;
  }
}
