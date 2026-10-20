import { createHash, randomBytes } from "node:crypto";
import { allocate, assertCurrency, type Ledger, type MinorUnits, type Posting } from "@gate/ledger";
import { computeSplits, earlyReleaseFee, priceOrder, type PaymentMode, type PayoutDestination, type SplitRule } from "@gate/pricing";
import { ChartOfAccounts } from "./accounts.js";
import { DomainError, notFound } from "./errors.js";
import type { CoreHooks, HookFailure } from "./hooks.js";
import type { Clock, IdGenerator, MeetingProvider, PaymentEvent, PaymentsPort, Repos, TaxPort, PaymentsAccountStatus } from "./ports.js";
import { ROSTER_FORMATS, SEQUENCE_STEPS, attendanceFromMinutes, overlapMinutes, rosterCsv, stepDueAt, type RosterFormat } from "./delivery.js";
import { NO_TAX } from "./tax.js";
import { DEFAULT_CHANGE_POLICY, cancelTerms, substituteTerms, transferTerms, type ChangePolicy } from "./policy.js";
import { DEFAULT_PRICING, convertMinor, validatePricingSettings, type FxRateSource, type PricingSettings } from "./fx.js";
import { daysBetween, localDate, shiftDays } from "./zoned.js";
import { badgeSnapshot, issuesVerifiedBadge } from "./credentials.js";
import { DEFAULT_INSTRUCTOR_ACCESS, type InstructorAccess } from "./types.js";
import type { InvoiceReminderStep } from "./types.js";
import type { Attendance, AttendanceStatus, Attendee, BillingAddress, Certificate, CorporateAccount, Course, CourseBadge, DeliveryFormat, Event, Invoice, InvoicePaymentMethod, MeetingInfo, Order, Organization, Party, PartyKind, PaymentsStatus, Payout, PayoutMethod, PriceTier, Refund, ReleasePolicy, Seat, SeatTransfer, SequenceStep, Session, TicketType, WaitlistEntry } from "./types.js";

export interface CoreDeps {
  repos: Repos;
  ledger: Ledger;
  payments: PaymentsPort;
  clock?: Clock;
  ids?: IdGenerator;
  hooks?: CoreHooks[];
  onHookFailure?: (failure: HookFailure) => void;
  tax?: TaxPort;
  /** Meeting providers by name; absent providers make scheduling fail with PROVIDER_UNAVAILABLE. */
  meetings?: Partial<Record<MeetingInfo["provider"], MeetingProvider>>;
  /** Reference exchange rates for localized pricing; absent = rates are entered by hand. */
  fx?: FxRateSource;
}

/** The organization's current payment mode and the Stripe account that serves it. */
export function activePayments(org: Organization): { mode: PaymentMode; accountRef: string | undefined; status: PaymentsStatus | undefined } {
  return org.paymentMode === "direct"
    ? { mode: "direct", accountRef: org.directAccountRef, status: org.directStatus }
    : { mode: "protected", accountRef: org.paymentsAccountRef, status: org.paymentsStatus };
}

/** The reminder an open invoice is due for at `now`, if any. */
export function invoiceReminderStep(dueAt: Date, now: Date): InvoiceReminderStep | null {
  const days = (now.getTime() - dueAt.getTime()) / 86_400_000;
  if (days < -3) return null;
  if (days < 0) return "due_soon";
  if (days < 7) return "due";
  if (days < 14) return "overdue_7";
  if (days < 30) return "overdue_14";
  return "overdue_30";
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const defaultClock: Clock = { now: () => new Date() };
const defaultIds: IdGenerator = {
  next: (prefix) => `${prefix}_${randomBytes(9).toString("base64url")}`,
};

export class Core {
  readonly repos: Repos;
  readonly ledger: Ledger;
  readonly payments: PaymentsPort;
  readonly tax: TaxPort;
  readonly meetings: Partial<Record<MeetingInfo["provider"], MeetingProvider>>;
  readonly fx: FxRateSource | undefined;
  readonly accounts: ChartOfAccounts;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly hooks: CoreHooks[];
  private readonly onHookFailure: (failure: HookFailure) => void;
  readonly hookFailures: HookFailure[] = [];

  constructor(deps: CoreDeps) {
    this.repos = deps.repos;
    this.ledger = deps.ledger;
    this.payments = deps.payments;
    this.tax = deps.tax ?? NO_TAX;
    this.meetings = deps.meetings ?? {};
    this.fx = deps.fx;
    this.accounts = new ChartOfAccounts(deps.ledger);
    this.clock = deps.clock ?? defaultClock;
    this.ids = deps.ids ?? defaultIds;
    this.hooks = deps.hooks ?? [];
    this.onHookFailure = deps.onHookFailure ?? ((f) => { this.hookFailures.push(f); });
  }

  private async runHooks<K extends keyof CoreHooks>(name: K, orderId: string, run: (hook: NonNullable<CoreHooks[K]>) => Promise<void>): Promise<void> {
    for (const h of this.hooks) {
      const fn = h[name];
      if (!fn) continue;
      try {
        await run(fn as NonNullable<CoreHooks[K]>);
      } catch (err) {
        this.onHookFailure({ hook: name, orderId, error: (err as Error).message, at: this.clock.now() });
      }
    }
  }

  // ---------- Organizations ----------

  async createOrganization(input: {
    name: string;
    country: string;
    currency: string;
    payoutDestination?: PayoutDestination | undefined;
    passFeeToAttendee?: boolean | undefined;
    splitRules?: SplitRule[] | undefined;
    releasePolicy?: ReleasePolicy | undefined;
    kind?: "company" | "individual" | undefined;
    /** Dev/bootstrap only: fix the API key instead of generating one. */
    apiKey?: string | undefined;
  }): Promise<{ organization: Organization; apiKey: string }> {
    assertCurrency(input.currency);
    if (!/^[A-Z]{2}$/.test(input.country)) throw new DomainError("VALIDATION", "country must be ISO 3166-1 alpha-2");
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    const apiKey = input.apiKey ?? `gk_${input.country === "US" ? "us" : "x"}_${randomBytes(24).toString("base64url")}`;
    const organization: Organization = {
      id: this.ids.next("org"),
      name: input.name.trim(),
      country: input.country,
      currency: input.currency,
      payoutDestination: input.payoutDestination ?? "gate_account",
      passFeeToAttendee: input.passFeeToAttendee ?? false,
      splitRules: input.splitRules ?? [],
      releasePolicy: input.releasePolicy ?? "on_delivery",
      releaseGraceHours: 24,
      minEnrollmentDecisionDays: 7,
      ...(input.kind ? { kind: input.kind } : {}),
      apiKeyHash: hashApiKey(apiKey),
      createdAt: this.clock.now(),
    };
    await this.repos.organizations.create(organization);
    await this.accounts.orgPayable(organization.id, organization.currency);
    return { organization, apiKey };
  }

  async updateOrganization(organizationId: string, patch: { releasePolicy?: ReleasePolicy | undefined; releaseGraceHours?: number | undefined; minEnrollmentDecisionDays?: number | undefined; passFeeToAttendee?: boolean | undefined; name?: string | undefined; marketplaceListing?: boolean | undefined; flexibleTickets?: boolean | undefined }): Promise<Organization> {
    const org = await this.getOrganization(organizationId);
    if (patch.releaseGraceHours !== undefined && (!Number.isFinite(patch.releaseGraceHours) || patch.releaseGraceHours < 0 || patch.releaseGraceHours > 24 * 30)) throw new DomainError("VALIDATION", "releaseGraceHours must be 0..720");
    if (patch.minEnrollmentDecisionDays !== undefined && (!Number.isFinite(patch.minEnrollmentDecisionDays) || patch.minEnrollmentDecisionDays < 0 || patch.minEnrollmentDecisionDays > 90)) throw new DomainError("VALIDATION", "minEnrollmentDecisionDays must be 0..90");
    const next: Organization = {
      ...org,
      ...(patch.releasePolicy !== undefined ? { releasePolicy: patch.releasePolicy } : {}),
      ...(patch.releaseGraceHours !== undefined ? { releaseGraceHours: patch.releaseGraceHours } : {}),
      ...(patch.minEnrollmentDecisionDays !== undefined ? { minEnrollmentDecisionDays: patch.minEnrollmentDecisionDays } : {}),
      ...(patch.passFeeToAttendee !== undefined ? { passFeeToAttendee: patch.passFeeToAttendee } : {}),
      ...(patch.marketplaceListing !== undefined ? { marketplaceListing: patch.marketplaceListing } : {}),
      ...(patch.flexibleTickets !== undefined ? { flexibleTickets: patch.flexibleTickets } : {}),
      ...(patch.name?.trim() ? { name: patch.name.trim() } : {}),
    };
    await this.repos.organizations.update(next);
    return next;
  }

  /** Replace an organization's API key. The old key stops working immediately. */
  async rotateApiKey(organizationId: string): Promise<{ organization: Organization; apiKey: string }> {
    const org = await this.getOrganization(organizationId);
    const apiKey = `gk_${org.country === "US" ? "us" : "x"}_${randomBytes(24).toString("base64url")}`;
    const next: Organization = { ...org, apiKeyHash: hashApiKey(apiKey) };
    await this.repos.organizations.update(next);
    return { organization: next, apiKey };
  }

  async authenticate(apiKey: string | undefined): Promise<Organization> {
    if (!apiKey) throw new DomainError("UNAUTHORIZED", "missing x-api-key");
    const org = await this.repos.organizations.getByApiKeyHash(hashApiKey(apiKey));
    if (!org) throw new DomainError("UNAUTHORIZED", "invalid api key");
    return org;
  }

  async getOrganization(id: string): Promise<Organization> {
    const org = await this.repos.organizations.get(id);
    if (!org) throw notFound("organization", id);
    return org;
  }

  /**
   * Start or resume payments setup. Creates the connected account the first time; while
   * the provider has not enabled charges and payouts, returns a fresh onboarding link so
   * the organizer can finish where they left off.
   */
  async connectPayments(organizationId: string, email?: string | undefined): Promise<Organization & { onboardingUrl?: string }> {
    let org = await this.getOrganization(organizationId);
    const mode = org.paymentMode ?? "protected";
    const refKey = mode === "direct" ? "directAccountRef" : "paymentsAccountRef";
    if (!org[refKey]) {
      const res = await this.payments.createConnectedAccount({
        organizationId: org.id,
        country: org.country,
        businessName: org.name,
        businessType: org.kind === "individual" ? "individual" : "company",
        ...(email ? { email } : {}),
        ...(mode === "direct" ? { mode } : {}),
      });
      org = { ...org, [refKey]: res.accountRef };
      await this.repos.organizations.update(org);
      org = await this.refreshPaymentsStatus(org.id);
      if (!activePayments(org).status?.ready && res.onboardingUrl) return { ...org, onboardingUrl: res.onboardingUrl };
      return org;
    }
    org = await this.refreshPaymentsStatus(org.id);
    if (activePayments(org).status?.ready) return org;
    const link = await this.payments.createOnboardingLink(org[refKey]!);
    return { ...org, ...(link ? { onboardingUrl: link } : {}) };
  }

  /**
   * Choose how card payments flow. Switching never touches money already taken: held
   * Protected orders still release to the Protected account, and Direct charges stay on the
   * organizer's account. Each mode has its own Stripe account, connected separately.
   */
  async setPaymentMode(organizationId: string, mode: PaymentMode): Promise<Organization> {
    if (mode !== "protected" && mode !== "direct") throw new DomainError("VALIDATION", "mode must be protected or direct");
    const org = await this.getOrganization(organizationId);
    const next: Organization = { ...org, paymentMode: mode };
    await this.repos.organizations.update(next);
    return this.refreshPaymentsStatus(organizationId);
  }

  /** Ask the provider for the state of the organization's accounts and remember it. */
  async refreshPaymentsStatus(organizationId: string): Promise<Organization> {
    let org = await this.getOrganization(organizationId);
    if (org.paymentsAccountRef) org = await this.applyPaymentsStatus(org, org.paymentsAccountRef, await this.payments.getAccountStatus(org.paymentsAccountRef));
    if (org.directAccountRef) org = await this.applyPaymentsStatus(org, org.directAccountRef, await this.payments.getAccountStatus(org.directAccountRef));
    return org;
  }

  private async applyPaymentsStatus(org: Organization, accountRef: string, s: PaymentsAccountStatus): Promise<Organization> {
    const status: PaymentsStatus = {
      ready: s.chargesEnabled && s.payoutsEnabled, chargesEnabled: s.chargesEnabled, payoutsEnabled: s.payoutsEnabled, detailsSubmitted: s.detailsSubmitted,
      requirementsDue: s.requirementsDue.slice(0, 20), ...(s.disabledReason ? { disabledReason: s.disabledReason } : {}), checkedAt: this.clock.now(),
    };
    const next: Organization = { ...org, ...(accountRef === org.directAccountRef ? { directStatus: status } : { paymentsStatus: status }) };
    await this.repos.organizations.update(next);
    return next;
  }

  async createParty(organizationId: string, input: { name: string; kind: PartyKind; paymentsAccountRef?: string | undefined }): Promise<Party> {
    await this.getOrganization(organizationId);
    const party: Party = {
      id: this.ids.next("party"),
      organizationId,
      name: input.name,
      kind: input.kind,
      ...(input.paymentsAccountRef ? { paymentsAccountRef: input.paymentsAccountRef } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.parties.create(party);
    return party;
  }

  listParties(organizationId: string): Promise<Party[]> {
    return this.repos.parties.listByOrganization(organizationId);
  }

  // ---------- Courses ----------

  async createCourse(organizationId: string, input: { slug: string; name: string; description?: string | undefined; certificationBody?: string | undefined; durationDays?: number | undefined }): Promise<Course> {
    await this.getOrganization(organizationId);
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new DomainError("VALIDATION", "slug must be lowercase letters, digits and hyphens");
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    if (await this.repos.courses.getBySlug(organizationId, slug)) throw new DomainError("CONFLICT", `course slug ${slug} already exists`);
    if (input.durationDays !== undefined && (!Number.isSafeInteger(input.durationDays) || input.durationDays <= 0)) throw new DomainError("VALIDATION", "durationDays must be a positive integer");
    const course: Course = {
      id: this.ids.next("crs"),
      organizationId,
      slug,
      name: input.name.trim(),
      ...(input.description ? { description: input.description } : {}),
      ...(input.certificationBody ? { certificationBody: input.certificationBody } : {}),
      ...(input.durationDays !== undefined ? { durationDays: input.durationDays } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.courses.create(course);
    return course;
  }

  async updateCourse(organizationId: string, courseId: string, patch: { description?: string | undefined; prework?: string | undefined; surveyUrl?: string | undefined; certificationBody?: string | undefined; durationDays?: number | undefined; imageUrl?: string | undefined; badge?: CourseBadge | null | undefined }): Promise<Course> {
    const course = await this.getCourse(organizationId, courseId);
    if (patch.badge) {
      if (!["credly", "accredible", "badgr", "certopus", "other", "own"].includes(patch.badge.platform)) throw new DomainError("VALIDATION", "unknown badge platform");
      if (!patch.badge.name.trim()) throw new DomainError("VALIDATION", "badge name is required");
      if (patch.badge.platform === "own" ? !patch.badge.imageUrl : !patch.badge.url) throw new DomainError("VALIDATION", patch.badge.platform === "own" ? "upload the badge image" : "the badge page link is required");
      if ((patch.badge.url && !/^https:\/\//.test(patch.badge.url)) || (patch.badge.imageUrl && !/^https?:\/\//.test(patch.badge.imageUrl))) throw new DomainError("VALIDATION", "badge links must be https URLs");
    }
    if (patch.surveyUrl && !/^https?:\/\//.test(patch.surveyUrl)) throw new DomainError("VALIDATION", "surveyUrl must be an http(s) URL");
    if (patch.imageUrl && !/^https?:\/\//.test(patch.imageUrl)) throw new DomainError("VALIDATION", "imageUrl must be an http(s) URL");
    const next: Course = { ...course };
    const set = <K extends keyof Course>(k: K, v: Course[K] | undefined) => { if (v === undefined) return; if (v === "" || v === null) delete next[k]; else next[k] = v; };
    set("description", patch.description); set("prework", patch.prework); set("surveyUrl", patch.surveyUrl); set("certificationBody", patch.certificationBody); set("durationDays", patch.durationDays); set("imageUrl", patch.imageUrl);
    if (patch.badge === null) delete next.badge;
    else if (patch.badge) next.badge = { platform: patch.badge.platform, name: patch.badge.name.trim(), ...(patch.badge.url ? { url: patch.badge.url } : {}), ...(patch.badge.imageUrl ? { imageUrl: patch.badge.imageUrl } : {}) };
    await this.repos.courses.update(next);
    return next;
  }

  async getCourse(organizationId: string, courseId: string): Promise<Course> {
    const c = await this.repos.courses.get(courseId);
    if (!c || c.organizationId !== organizationId) throw notFound("course", courseId);
    return c;
  }

  async getCourseBySlug(organizationId: string, slug: string): Promise<Course> {
    const c = await this.repos.courses.getBySlug(organizationId, slug);
    if (!c) throw notFound("course", slug);
    return c;
  }

  listCourses(organizationId: string): Promise<Course[]> {
    return this.repos.courses.listByOrganization(organizationId);
  }

  async listCohorts(organizationId: string, courseId: string): Promise<Event[]> {
    await this.getCourse(organizationId, courseId);
    return this.repos.events.listByCourse(courseId);
  }

  // ---------- Events (cohorts) & tickets ----------

  async createEvent(
    organizationId: string,
    input: {
      name: string;
      startsAt?: Date | undefined;
      currency?: string | undefined;
      splitRules?: SplitRule[] | undefined;
      courseId?: string | undefined;
      timezone?: string | undefined;
      format?: DeliveryFormat | undefined;
      sessions?: Session[] | undefined;
      instructorIds?: string[] | undefined;
      minEnrollment?: number | undefined;
      /** "draft" keeps it off sale until published (instructor classes awaiting approval). */
      status?: "draft" | "live" | undefined;
    },
  ): Promise<Event> {
    const org = await this.getOrganization(organizationId);
    const currency = input.currency ?? org.currency;
    assertCurrency(currency);
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    const sessions = [...(input.sessions ?? [])].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (const s of sessions) {
      if (Number.isNaN(s.startsAt.getTime()) || Number.isNaN(s.endsAt.getTime())) throw new DomainError("VALIDATION", "session dates must be valid");
      if (s.endsAt <= s.startsAt) throw new DomainError("VALIDATION", "session endsAt must be after startsAt");
    }
    const startsAt = input.startsAt ?? sessions[0]?.startsAt;
    if (!startsAt || Number.isNaN(startsAt.getTime())) throw new DomainError("VALIDATION", "startsAt or at least one session is required");
    const endsAt = sessions.length ? sessions[sessions.length - 1]!.endsAt : undefined;
    const timezone = input.timezone ?? "UTC";
    if (!isValidTimeZone(timezone)) throw new DomainError("VALIDATION", `unknown time zone ${timezone}`);
    if (input.courseId) await this.getCourse(organizationId, input.courseId);
    if (input.minEnrollment !== undefined && (!Number.isSafeInteger(input.minEnrollment) || input.minEnrollment < 0)) throw new DomainError("VALIDATION", "minEnrollment must be a non-negative integer");
    for (const id of input.instructorIds ?? []) {
      const party = await this.repos.parties.get(id);
      if (!party || party.organizationId !== organizationId || party.kind !== "instructor") throw new DomainError("VALIDATION", `unknown instructor ${id}`);
    }
    if (input.splitRules) {
      for (const r of input.splitRules) {
        const party = await this.repos.parties.get(r.partyId);
        if (!party || party.organizationId !== organizationId) throw new DomainError("VALIDATION", `unknown split party ${r.partyId}`);
      }
    }
    const event: Event = {
      id: this.ids.next("evt"),
      organizationId,
      ...(input.courseId ? { courseId: input.courseId } : {}),
      name: input.name.trim(),
      startsAt,
      ...(endsAt ? { endsAt } : {}),
      timezone,
      format: input.format ?? "live_virtual",
      sessions,
      instructorIds: input.instructorIds ?? [],
      ...(input.minEnrollment !== undefined ? { minEnrollment: input.minEnrollment } : {}),
      currency,
      status: input.status ?? "live",
      ...(input.splitRules ? { splitRules: input.splitRules } : {}),
      createdAt: this.clock.now(),
    };
    await this.repos.events.create(event);
    await this.runHooks("eventCreated", event.id, (hook) => hook({ event }));
    return event;
  }

  async getEvent(organizationId: string, eventId: string): Promise<Event> {
    const e = await this.repos.events.get(eventId);
    if (!e || e.organizationId !== organizationId) throw notFound("event", eventId);
    return e;
  }

  listEvents(organizationId: string): Promise<Event[]> {
    return this.repos.events.listByOrganization(organizationId);
  }

  /**
   * Copy a cohort: same course, format, time zone, instructors, minimum, splits and ticket types
   * (nothing sold). With `startDate` (YYYY-MM-DD in the cohort's zone) every session moves by the
   * same number of days at the same local times; without it the copy keeps the dates.
   */
  async duplicateEvent(organizationId: string, eventId: string, opts: { startDate?: string | undefined; name?: string | undefined; status?: "draft" | "live" | undefined } = {}): Promise<{ event: Event; ticketTypes: TicketType[] }> {
    const src = await this.getEvent(organizationId, eventId);
    if (opts.startDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(opts.startDate)) throw new DomainError("VALIDATION", "startDate must be YYYY-MM-DD");
    const offset = opts.startDate ? daysBetween(localDate(src.startsAt, src.timezone), opts.startDate) : 0;
    const move = (d: Date) => (offset ? shiftDays(d, offset, src.timezone) : d);
    const sessions = src.sessions.map((x) => ({ ...x, startsAt: move(x.startsAt), endsAt: move(x.endsAt) }));
    const event = await this.createEvent(organizationId, {
      name: opts.name?.trim() || src.name,
      ...(sessions.length ? { sessions } : { startsAt: move(src.startsAt) }),
      currency: src.currency,
      ...(src.courseId ? { courseId: src.courseId } : {}),
      timezone: src.timezone,
      format: src.format,
      instructorIds: src.instructorIds,
      ...(src.minEnrollment !== undefined ? { minEnrollment: src.minEnrollment } : {}),
      ...(src.splitRules ? { splitRules: src.splitRules } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    });
    const copy = src.instructorFees?.length ? { ...event, instructorFees: src.instructorFees } : event;
    if (copy !== event) await this.repos.events.update(copy);
    const now = this.clock.now();
    const ticketTypes: TicketType[] = [];
    for (const t of await this.repos.ticketTypes.listByEvent(src.id)) {
      const until = t.earlyBird ? move(t.earlyBird.until) : undefined;
      ticketTypes.push(await this.createTicketType(organizationId, event.id, {
        name: t.name, priceMinor: t.priceMinor, quantity: t.quantity, prices: t.prices,
        // An early-bird window that has already closed for the new dates is dropped.
        ...(t.earlyBird && until && until > now ? { earlyBird: { ...t.earlyBird, until } } : {}),
      }));
    }
    return { event: copy, ticketTypes };
  }

  /** A draft class goes on sale. */
  async publishEvent(organizationId: string, eventId: string): Promise<Event> {
    const event = await this.getEvent(organizationId, eventId);
    if (event.status === "live") return event;
    if (event.status !== "draft") throw new DomainError("INVALID_STATE", `event is ${event.status}`);
    const next: Event = { ...event, status: "live" };
    await this.repos.events.update(next);
    await this.runHooks("eventPublished", next.id, (hook) => hook({ event: next }));
    return next;
  }

  /** Who teaches a class (instructor parties). */
  async setEventInstructors(organizationId: string, eventId: string, instructorIds: string[]): Promise<Event> {
    const event = await this.getEvent(organizationId, eventId);
    const ids = [...new Set(instructorIds)];
    for (const id of ids) {
      const party = await this.repos.parties.get(id);
      if (!party || party.organizationId !== organizationId || party.kind !== "instructor") throw new DomainError("VALIDATION", `unknown instructor ${id}`);
    }
    const next: Event = { ...event, instructorIds: ids };
    await this.repos.events.update(next);
    return next;
  }

  async updateInstructorAccess(organizationId: string, input: { scope?: InstructorAccess["scope"] | undefined; publish?: InstructorAccess["publish"] | undefined }): Promise<Organization> {
    const org = await this.getOrganization(organizationId);
    const current = org.instructorAccess ?? DEFAULT_INSTRUCTOR_ACCESS;
    const next: InstructorAccess = { scope: input.scope ?? current.scope, publish: input.publish ?? current.publish };
    if (!["own", "all"].includes(next.scope) || !["direct", "approval"].includes(next.publish)) throw new DomainError("VALIDATION", "unknown instructor access setting");
    const updated: Organization = { ...org, instructorAccess: next };
    await this.repos.organizations.update(updated);
    return updated;
  }

  async createTicketType(
    organizationId: string,
    eventId: string,
    input: { name: string; priceMinor: MinorUnits; quantity: number; prices?: Record<string, MinorUnits> | undefined; earlyBird?: PriceTier | undefined },
  ): Promise<TicketType> {
    await this.getEvent(organizationId, eventId);
    if (!Number.isSafeInteger(input.priceMinor) || input.priceMinor < 0) throw new DomainError("VALIDATION", "priceMinor must be a non-negative integer");
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new DomainError("VALIDATION", "quantity must be a positive integer");
    const prices = validatePriceList(input.prices);
    const earlyBird = input.earlyBird
      ? { until: input.earlyBird.until, priceMinor: input.earlyBird.priceMinor, ...(validatePriceList(input.earlyBird.prices) ? { prices: validatePriceList(input.earlyBird.prices)! } : {}) }
      : undefined;
    if (earlyBird) {
      if (Number.isNaN(earlyBird.until.getTime())) throw new DomainError("VALIDATION", "earlyBird.until must be a valid date");
      if (!Number.isSafeInteger(earlyBird.priceMinor) || earlyBird.priceMinor < 0) throw new DomainError("VALIDATION", "earlyBird.priceMinor must be a non-negative integer");
    }
    const t: TicketType = {
      id: this.ids.next("tt"), eventId, organizationId, name: input.name, priceMinor: input.priceMinor,
      ...(prices ? { prices } : {}), ...(earlyBird ? { earlyBird } : {}), quantity: input.quantity, sold: 0,
    };
    await this.repos.ticketTypes.create(t);
    return t;
  }

  /**
   * The unit price a buyer pays right now in a currency: early-bird tier while
   * its window is open, else the list price. Base currency always resolves;
   * other currencies only when the ticket lists them (no silent FX).
   */
  resolveUnitPrice(ticketType: TicketType, event: Event, currency: string, now = this.clock.now(), pricing?: PricingSettings): MinorUnits {
    assertCurrency(currency);
    const pick = (base: MinorUnits, prices?: Record<string, MinorUnits>): MinorUnits | undefined => {
      if (currency === event.currency) return prices?.[currency] ?? base;
      return prices?.[currency];
    };
    let price: MinorUnits | undefined;
    if (ticketType.earlyBird && now < ticketType.earlyBird.until) price = pick(ticketType.earlyBird.priceMinor, ticketType.earlyBird.prices);
    if (price === undefined) price = pick(ticketType.priceMinor, ticketType.prices);
    if (price === undefined) {
      // Organizer-enabled currency without an explicit price: convert the base price with the stored rate.
      const base = ticketType.earlyBird && now < ticketType.earlyBird.until ? ticketType.earlyBird.priceMinor : ticketType.priceMinor;
      const rate = pricing?.rates[currency];
      if (pricing?.fxFallback && pricing.currencies.includes(currency) && rate) return convertMinor(base, event.currency, currency, rate, pricing.rounding);
      throw new DomainError("VALIDATION", `ticket ${ticketType.id} is not sold in ${currency}`, `available: ${[event.currency, ...Object.keys(ticketType.prices ?? {})].join(", ")}`);
    }
    return price;
  }

  /** True when the price shown in `currency` is a conversion rather than a listed price. */
  isConvertedPrice(ticketType: TicketType, event: Event, currency: string, now = this.clock.now()): boolean {
    if (currency === event.currency) return false;
    const early = ticketType.earlyBird && now < ticketType.earlyBird.until;
    return !(early ? ticketType.earlyBird!.prices?.[currency] : undefined) && !ticketType.prices?.[currency];
  }

  pricingOf(org: Organization): PricingSettings {
    return org.pricing ?? DEFAULT_PRICING;
  }

  /** Replace the organization's localized-pricing settings (currencies, fallback, rounding, manual rates). */
  async updatePricing(organizationId: string, input: { [K in keyof PricingSettings]?: PricingSettings[K] | undefined }): Promise<Organization> {
    const org = await this.getOrganization(organizationId);
    const current = this.pricingOf(org);
    const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<PricingSettings>;
    const merged = validatePricingSettings({ ...current, ...patch, rates: patch.rates ? { ...current.rates, ...patch.rates } : current.rates }, org.currency);
    if (patch.rates) { merged.ratesUpdatedAt = this.clock.now(); merged.ratesSource = "manual"; }
    const next: Organization = { ...org, pricing: merged };
    await this.repos.organizations.update(next);
    return next;
  }

  /** Pull reference rates for every enabled currency from the configured source. */
  async refreshFxRates(organizationId: string): Promise<Organization> {
    const org = await this.getOrganization(organizationId);
    if (!this.fx) throw new DomainError("INVALID_STATE", "no exchange-rate source configured", "enter rates by hand in pricing settings");
    const current = this.pricingOf(org);
    if (current.currencies.length === 0) throw new DomainError("VALIDATION", "enable at least one presentment currency first");
    const fetched = await this.fx.latest(org.currency, current.currencies);
    const missing = current.currencies.filter((c) => !fetched[c]);
    const next: Organization = { ...org, pricing: { ...current, rates: { ...current.rates, ...fetched }, ratesUpdatedAt: this.clock.now(), ratesSource: this.fx.name } };
    await this.repos.organizations.update(next);
    if (missing.length) throw new DomainError("VALIDATION", `no reference rate for ${missing.join(", ")}`, "enter those by hand; the others were updated");
    return next;
  }

  /**
   * Every course with an upcoming live class, across organizations, for sitemaps and AI
   * crawlers. Only what the public course pages already show.
   */
  /** Courses with upcoming classes. `listed`: shown in EnrollClass's class finder (the organizer can opt out). */
  async publicCatalog(limit = 5000): Promise<Array<{ organizationId: string; organizationName: string; slug: string; name: string; nextStartsAt: Date; classes: number; listed: boolean }>> {
    const now = this.clock.now();
    const out: Array<{ organizationId: string; organizationName: string; slug: string; name: string; nextStartsAt: Date; classes: number; listed: boolean }> = [];
    for (const org of await this.repos.organizations.list()) {
      for (const course of await this.repos.courses.listByOrganization(org.id)) {
        const upcoming = (await this.repos.events.listByCourse(course.id)).filter((e) => e.status === "live" && (e.endsAt ?? e.startsAt) >= now);
        if (!upcoming.length) continue;
        const next = upcoming.reduce((a, e) => (e.startsAt < a ? e.startsAt : a), upcoming[0]!.startsAt);
        out.push({ organizationId: org.id, organizationName: org.name, slug: course.slug, name: course.name, nextStartsAt: next, classes: upcoming.length, listed: org.marketplaceListing !== false });
        if (out.length >= limit) return out;
      }
    }
    return out.sort((a, b) => a.nextStartsAt.getTime() - b.nextStartsAt.getTime());
  }

  /** Public catalogue view of a course: cohorts with resolved prices per currency. */
  async publicCourse(organizationId: string, slug: string) {
    const org = await this.getOrganization(organizationId);
    const pricing = this.pricingOf(org);
    const course = await this.getCourseBySlug(organizationId, slug);
    const now = this.clock.now();
    const cohorts = (await this.repos.events.listByCourse(course.id)).filter((e) => e.status === "live" && (e.endsAt ?? e.startsAt) >= now);
    const out = [];
    for (const event of cohorts) {
      const ticketTypes = await this.repos.ticketTypes.listByEvent(event.id);
      out.push({
        event,
        ticketTypes: ticketTypes.map((t) => {
          const currencies = [event.currency, ...Object.keys(t.prices ?? {}), ...Object.keys(t.earlyBird?.prices ?? {}), ...(pricing.fxFallback ? pricing.currencies : [])];
          const prices: Record<string, MinorUnits> = {};
          const converted: string[] = [];
          for (const c of new Set(currencies)) {
            try {
              prices[c] = this.resolveUnitPrice(t, event, c, now, pricing);
              if (this.isConvertedPrice(t, event, c, now)) converted.push(c);
            } catch { /* not sold in c */ }
          }
          return { id: t.id, name: t.name, quantity: t.quantity, remaining: t.quantity - t.sold, prices, converted, earlyBirdUntil: t.earlyBird && now < t.earlyBird.until ? t.earlyBird.until : null };
        }),
      });
    }
    return {
      organization: { id: org.id, name: org.name, country: org.country, currency: org.currency, currencies: [org.currency, ...pricing.currencies], ratesUpdatedAt: pricing.ratesUpdatedAt ?? null, paymentMode: org.paymentMode ?? "protected", flexibleTickets: org.flexibleTickets === true },
      course, cohorts: out,
    };
  }

  async listTicketTypes(organizationId: string, eventId: string): Promise<TicketType[]> {
    await this.getEvent(organizationId, eventId);
    return this.repos.ticketTypes.listByEvent(eventId);
  }

  // ---------- Checkout ----------

  async createOrder(
    organizationId: string,
    input: {
      ticketTypeId: string;
      quantity: number;
      buyerEmail: string;
      /** Currency the buyer pays in; defaults to the cohort's base currency. */
      currency?: string | undefined;
      /** One per seat, in order. Missing entries default to the buyer. */
      attendees?: Attendee[] | undefined;
      /** Enables tax calculation; without it tax is not calculated. */
      billingAddress?: BillingAddress | undefined;
      /** Claiming an offered waitlist seat: capacity is already held for this entry. */
      waitlistEntryId?: string | undefined;
      idempotencyKey?: string | undefined;
      dryRun?: boolean | undefined;
      /** "marketplace": the learner came through EnrollClass's class finder (referral fee). */
      source?: "marketplace" | undefined;
      /** The flexible-ticket upgrade, when the organizer offers it. */
      flexible?: boolean | undefined;
    },
  ): Promise<{ order: Order; clientSecret: string | null; created: boolean }> {
    const org = await this.getOrganization(organizationId);
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > 100) {
      throw new DomainError("VALIDATION", "quantity must be an integer between 1 and 100");
    }
    if (!isEmail(input.buyerEmail)) throw new DomainError("VALIDATION", "buyerEmail is invalid");
    if (input.attendees && input.attendees.length > input.quantity) throw new DomainError("VALIDATION", "more attendees than seats");
    for (const a of input.attendees ?? []) if (!isEmail(a.email)) throw new DomainError("VALIDATION", `attendee email ${a.email} is invalid`);

    if (input.idempotencyKey) {
      const prior = await this.repos.orders.getByIdempotencyKey(organizationId, input.idempotencyKey);
      if (prior) return { order: prior, clientSecret: null, created: false };
    }

    const ticketType = await this.repos.ticketTypes.get(input.ticketTypeId);
    if (!ticketType || ticketType.organizationId !== organizationId) throw notFound("ticketType", input.ticketTypeId);
    const event = await this.getEvent(organizationId, ticketType.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);

    const currency = input.currency ?? event.currency;
    const unitPriceMinor = this.resolveUnitPrice(ticketType, event, currency, this.clock.now(), this.pricingOf(org));
    const direct = org.paymentMode === "direct";
    const verifiedBadge = await this.issuesVerifiedBadge(event);
    if (input.flexible && org.flexibleTickets !== true) throw new DomainError("VALIDATION", "this organizer doesn't offer flexible tickets");
    const pricing = await this.priceWithTax({
      org, currency, unitPriceMinor, quantity: input.quantity, billingAddress: input.billingAddress, businessCustomer: false, direct, verifiedBadge,
      converted: this.isConvertedPrice(ticketType, event, currency, this.clock.now()),
      marketplace: input.source === "marketplace" && org.marketplaceListing !== false,
      flexible: input.flexible === true,
    });
    const splits = computeSplits(pricing.organizerNetMinor, org.id, event.splitRules ?? org.splitRules);
    const attendees: Attendee[] = Array.from({ length: input.quantity }, (_, i) => input.attendees?.[i] ?? { email: input.buyerEmail });
    // Direct: learners pay the organizer's own Stripe account, which must be able to take charges.
    const chargeAccount = direct && pricing.totalMinor > 0 && !input.dryRun ? this.directChargeAccount(org) : undefined;

    const order: Order = {
      id: this.ids.next("ord"),
      organizationId,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
      buyerEmail: input.buyerEmail,
      attendees,
      currency,
      status: "pending",
      paymentMethod: "card",
      ...(input.billingAddress ? { billingAddress: input.billingAddress } : {}),
      pricing,
      splits,
      ...(chargeAccount ? { settlement: "direct" as const, chargeAccountRef: chargeAccount } : {}),
      transferRefs: {},
      refundedMinor: 0,
      heldMinor: 0,
      fundsStatus: "none",
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      createdAt: this.clock.now(),
    };

    if (input.dryRun) return { order, clientSecret: null, created: false };

    let claim: WaitlistEntry | undefined;
    if (input.waitlistEntryId) {
      claim = await this.repos.waitlist.get(input.waitlistEntryId);
      if (!claim || claim.organizationId !== organizationId || claim.ticketTypeId !== ticketType.id) throw notFound("waitlistEntry", input.waitlistEntryId);
      if (claim.status !== "offered") throw new DomainError("INVALID_STATE", `waitlist offer is ${claim.status}`, "join the waitlist again if the offer expired");
      if (claim.offerExpiresAt && claim.offerExpiresAt < this.clock.now()) throw new DomainError("INVALID_STATE", "waitlist offer has expired");
      if (claim.email !== input.buyerEmail.toLowerCase() && !input.attendees?.some((a) => a.email.toLowerCase() === claim!.email)) {
        throw new DomainError("VALIDATION", "the offer belongs to a different email address");
      }
      if (input.quantity > claim.quantity) throw new DomainError("VALIDATION", `the offer holds ${claim.quantity} seat(s)`);
    }
    // Offers already hold their capacity; everyone else reserves now.
    const reserved = claim ? true : await this.repos.ticketTypes.reserve(ticketType.id, input.quantity);
    if (!reserved) throw new DomainError("SOLD_OUT", `only ${ticketType.quantity - ticketType.sold} left`, "join the waitlist");
    if (claim && claim.quantity > input.quantity) await this.repos.ticketTypes.release(ticketType.id, claim.quantity - input.quantity);

    let paymentRef: string;
    let clientSecret: string | null;
    try {
      if (pricing.totalMinor === 0) {
        // Free order: no payment needed, settle immediately.
        paymentRef = `free_${order.id}`;
        clientSecret = null;
      } else {
        const p = await this.payments.createPayment({
          orderId: order.id,
          amountMinor: pricing.totalMinor,
          currency: order.currency,
          transferGroup: order.id,
          buyerEmail: input.buyerEmail,
          metadata: { orderId: order.id, organizationId, eventId: event.id },
          ...(chargeAccount ? { direct: { accountRef: chargeAccount, applicationFeeMinor: pricing.platformFeeMinor } } : {}),
        });
        paymentRef = p.paymentRef;
        clientSecret = p.clientSecret;
      }
    } catch (err) {
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw new DomainError("PAYMENTS_UPSTREAM", `payments provider error: ${(err as Error).message}`);
    }

    order.paymentRef = paymentRef;
    try {
      await this.repos.orders.create(order);
    } catch (err) {
      // Never leak reserved inventory: a failed persist gives the seats back.
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw err;
    }
    if (claim) await this.repos.waitlist.update({ ...claim, status: "converted", convertedOrderId: order.id });
    if (pricing.totalMinor === 0) await this.markPaid(order);
    return { order: (await this.repos.orders.get(order.id)) ?? order, clientSecret, created: true };
  }

  async getOrder(organizationId: string, orderId: string): Promise<Order> {
    const o = await this.repos.orders.get(orderId);
    if (!o || o.organizationId !== organizationId) throw notFound("order", orderId);
    return o;
  }

  listOrders(organizationId: string, limit?: number): Promise<Order[]> {
    return this.repos.orders.listByOrganization(organizationId, limit);
  }

  // ---------- Provider events (webhooks) ----------

  async handlePaymentEvent(event: PaymentEvent): Promise<{ handled: boolean; reason?: string }> {
    if (event.type === "account.updated") {
      const org = (await this.repos.organizations.list()).find((o) => o.paymentsAccountRef === event.accountRef || o.directAccountRef === event.accountRef);
      if (!org) return { handled: false, reason: "unknown account" };
      await this.applyPaymentsStatus(org, event.accountRef, event.status);
      return { handled: true };
    }
    const fresh = await this.repos.processedEvents.record(event.providerEventId);
    if (!fresh) return { handled: false, reason: "duplicate" };
    switch (event.type) {
      case "payment.succeeded": {
        const transfer = await this.repos.seatTransfers.getByPaymentRef(event.paymentRef);
        if (transfer) {
          if (transfer.status !== "pending_payment") return { handled: false, reason: `transfer is ${transfer.status}` };
          if (event.amountMinor !== transfer.feeMinor || event.currency !== transfer.currency) throw new DomainError("CONFLICT", `transfer fee mismatch on ${event.paymentRef}`);
          await this.completeTransfer(transfer, { paid: true });
          return { handled: true };
        }
        const invoice = await this.repos.invoices.getByCardPaymentRef(event.paymentRef);
        if (invoice) {
          if (invoice.status === "paid" || invoice.status === "void") return { handled: false, reason: `invoice is ${invoice.status}` };
          await this.recordInvoicePayment(invoice.organizationId, { invoiceId: invoice.id, amountMinor: event.amountMinor, method: "card", reference: event.paymentRef, viaCardRef: event.paymentRef });
          return { handled: true };
        }
        const order = await this.repos.orders.getByPaymentRef(event.paymentRef);
        if (!order) return { handled: false, reason: "unknown payment" };
        if (order.status !== "pending") return { handled: false, reason: `order is ${order.status}` };
        if (event.amountMinor !== order.pricing.totalMinor || event.currency !== order.currency) {
          throw new DomainError("CONFLICT", `payment ${event.paymentRef} amount ${event.amountMinor} ${event.currency} does not match order ${order.pricing.totalMinor} ${order.currency}`);
        }
        await this.markPaid(order);
        return { handled: true };
      }
      case "payment.failed": {
        const transfer = await this.repos.seatTransfers.getByPaymentRef(event.paymentRef);
        if (transfer) {
          if (transfer.status === "pending_payment") {
            await this.repos.ticketTypes.release(transfer.toTicketTypeId, 1);
            await this.repos.seatTransfers.update({ ...transfer, status: "failed" });
            await this.offerWaitlist(transfer.toEventId);
          }
          return { handled: true };
        }
        const invoice = await this.repos.invoices.getByCardPaymentRef(event.paymentRef);
        if (invoice) {
          const { cardPaymentRef: _drop, ...rest } = invoice;
          await this.repos.invoices.update(rest as Invoice);
          return { handled: true };
        }
        const order = await this.repos.orders.getByPaymentRef(event.paymentRef);
        if (!order || order.status !== "pending") return { handled: false, reason: "no pending order" };
        await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
        await this.repos.orders.update({ ...order, status: "failed" });
        await this.offerWaitlist(order.eventId);
        return { handled: true };
      }
      case "refund.succeeded": {
        const refund = await this.repos.refunds.getByProviderRef(event.refundRef);
        if (!refund) return { handled: false, reason: "unknown refund" };
        if (refund.status === "succeeded") return { handled: false, reason: "already settled" };
        await this.settleRefund(refund);
        return { handled: true };
      }
      case "refund.failed": {
        const refund = await this.repos.refunds.getByProviderRef(event.refundRef);
        if (!refund) return { handled: false, reason: "unknown refund" };
        await this.repos.refunds.update({ ...refund, status: "failed" });
        return { handled: true };
      }
      case "ignored":
        return { handled: false, reason: `ignored ${event.providerType}` };
    }
  }

  /**
   * Settle a paid order into the ledger. `cash` describes where the money
   * sits: the card processor's clearing account by default, or a mix of bank
   * clearing and previously held customer deposits for invoice payments.
   */
  private async markPaid(order: Order, cash?: Posting[]): Promise<void> {
    const ccy = order.currency;
    const org = await this.getOrganization(order.organizationId);
    const clearing = await this.accounts.clearing(ccy);
    const fees = await this.accounts.feeRevenue(ccy);
    const orgPayable = await this.accounts.orgPayable(org.id, ccy);

    const postings: Posting[] = cash ?? [{ accountId: clearing.id, amount: order.pricing.totalMinor }];
    const organizerSide = order.splits.organizerMinor + order.splits.lines.reduce((a, l) => a + l.amountMinor, 0);
    // Direct: the organizer's own Stripe account already has the money; only the application fee reaches the platform.
    const direct = order.settlement === "direct";
    const hold = !direct && org.releasePolicy === "on_delivery" && organizerSide > 0;
    if (hold) {
      postings.push({ accountId: (await this.accounts.orgHeld(org.id, ccy)).id, amount: -organizerSide });
    } else {
      if (order.splits.organizerMinor > 0) postings.push({ accountId: orgPayable.id, amount: -order.splits.organizerMinor });
      for (const line of order.splits.lines) {
        if (line.amountMinor === 0) continue;
        const acct = await this.accounts.partyPayable(org.id, line.partyId, ccy);
        postings.push({ accountId: acct.id, amount: -line.amountMinor });
      }
    }
    if (order.pricing.platformFeeMinor > 0) postings.push({ accountId: fees.id, amount: -order.pricing.platformFeeMinor });
    if (order.pricing.taxMinor > 0) postings.push({ accountId: (await this.accounts.taxPayable(org.id, ccy)).id, amount: -order.pricing.taxMinor });

    if (direct) {
      if (order.pricing.platformFeeMinor > 0) {
        await this.ledger.post({
          idempotencyKey: `order:${order.id}:paid`,
          currency: ccy,
          description: `Application fee on direct order ${order.id} (${order.quantity} x ${order.ticketTypeId})`,
          postings: [{ accountId: clearing.id, amount: order.pricing.platformFeeMinor }, { accountId: fees.id, amount: -order.pricing.platformFeeMinor }],
          metadata: { orderId: order.id, organizationId: org.id, eventId: order.eventId, paymentRef: order.paymentRef ?? "", settlement: "direct", grossMinor: String(order.pricing.totalMinor) },
        });
      }
    } else if (order.pricing.totalMinor > 0) {
      await this.ledger.post({
        idempotencyKey: `order:${order.id}:paid`,
        currency: ccy,
        description: `Order ${order.id} paid (${order.quantity} x ${order.ticketTypeId})`,
        postings,
        metadata: { orderId: order.id, organizationId: org.id, eventId: order.eventId, paymentRef: order.paymentRef ?? "" },
      });
    }

    // Immediate policy: move each party's share to its connected account now. On-delivery: at release.
    const transferRefs = hold || direct ? { ...order.transferRefs } : await this.transferShares({ ...order, transferRefs: { ...order.transferRefs } }, org);
    const fundsStatus = organizerSide > 0 ? (hold ? "held" : "released") : "none";
    await this.repos.orders.update({ ...order, status: "paid", paidAt: this.clock.now(), transferRefs, heldMinor: hold ? organizerSide : 0, fundsStatus, ...(fundsStatus === "released" ? { releasedAt: this.clock.now() } : {}) });

    // One confirmed seat per learner (invoice orders reserved them at creation).
    const seats: Seat[] = await this.repos.seats.listByOrder(order.id);
    for (const [i, seat] of seats.entries()) {
      if (seat.status === "reserved") {
        const confirmed: Seat = { ...seat, status: "confirmed", confirmedAt: this.clock.now() };
        await this.repos.seats.update(confirmed);
        seats[i] = confirmed;
      }
    }
    if (seats.length === 0) {
      for (const attendee of order.attendees) {
        const seat: Seat = {
          id: this.ids.next("seat"),
          organizationId: order.organizationId,
          orderId: order.id,
          eventId: order.eventId,
          ticketTypeId: order.ticketTypeId,
          attendee,
          status: "confirmed",
          createdAt: this.clock.now(),
          confirmedAt: this.clock.now(),
        };
        await this.repos.seats.create(seat);
        seats.push(seat);
      }
    }

    const paidOrder = (await this.repos.orders.get(order.id)) ?? order;
    const event = await this.repos.events.get(order.eventId);
    const ticketType = await this.repos.ticketTypes.get(order.ticketTypeId);
    if (event && ticketType) {
      const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
      await this.runHooks("orderPaid", order.id, (hook) => hook({ organization: org, order: paidOrder, event, course, ticketType, seats }));
    }
  }

  /** Stripe separate charges and transfers for card-funded orders; invoice cash pays out by bank instead. */
  private async transferShares(order: Order, org: Organization, shares?: { organizerMinor: number; lines: Array<{ partyId: string; amountMinor: number }> }): Promise<Record<string, string>> {
    const transferRefs: Record<string, string> = { ...order.transferRefs };
    if (!order.paymentRef || order.pricing.totalMinor <= 0 || order.paymentMethod !== "card") return transferRefs;
    const split = shares ?? order.splits;
    const targets: Array<{ key: string; accountRef: string | undefined; amount: number }> = [{ key: org.id, accountRef: org.paymentsAccountRef, amount: split.organizerMinor }];
    for (const line of split.lines) {
      const party = await this.repos.parties.get(line.partyId);
      targets.push({ key: line.partyId, accountRef: party?.paymentsAccountRef, amount: line.amountMinor });
    }
    for (const t of targets) {
      if (!t.accountRef || t.amount <= 0 || transferRefs[t.key]) continue;
      const res = await this.payments.createTransfer({ idempotencyKey: `transfer:${order.id}:${t.key}`, paymentRef: order.paymentRef, destinationAccountRef: t.accountRef, amountMinor: t.amount, currency: order.currency, transferGroup: order.id });
      transferRefs[t.key] = res.transferRef;
    }
    return transferRefs;
  }

  /**
   * Door check-in for one seat. Idempotent: checking in twice keeps the first time and
   * reports alreadyCheckedIn. `undo` clears it (a mistaken tap).
   */
  async checkIn(organizationId: string, seatId: string, opts: { undo?: boolean | undefined } = {}): Promise<{ seat: Seat; alreadyCheckedIn: boolean }> {
    const seat = await this.repos.seats.get(seatId);
    if (!seat || seat.organizationId !== organizationId) throw notFound("seat", seatId);
    if (opts.undo) {
      if (!seat.checkedInAt) return { seat, alreadyCheckedIn: false };
      const next: Seat = { ...seat };
      delete next.checkedInAt;
      await this.repos.seats.update(next);
      return { seat: next, alreadyCheckedIn: false };
    }
    if (seat.status !== "confirmed") {
      const why = seat.status === "reserved" ? "is not paid yet" : seat.status === "transferred" ? "was moved to another cohort" : "was cancelled";
      throw new DomainError("INVALID_STATE", `this ticket ${why}`, seat.status === "transferred" && seat.transferredToSeatId ? `the attendee's current seat is ${seat.transferredToSeatId}` : undefined);
    }
    if (seat.checkedInAt) return { seat, alreadyCheckedIn: true };
    const next: Seat = { ...seat, checkedInAt: this.clock.now() };
    await this.repos.seats.update(next);
    await this.runHooks("checkedIn", next.orderId, (hook) => hook({ seat: next }));
    return { seat: next, alreadyCheckedIn: false };
  }

  async listSeats(organizationId: string, filter: { eventId?: string | undefined; orderId?: string | undefined }): Promise<Seat[]> {
    if (filter.orderId) {
      await this.getOrder(organizationId, filter.orderId);
      return this.repos.seats.listByOrder(filter.orderId);
    }
    if (filter.eventId) {
      await this.getEvent(organizationId, filter.eventId);
      return this.repos.seats.listByEvent(filter.eventId);
    }
    throw new DomainError("VALIDATION", "eventId or orderId is required");
  }

  // ---------- Refunds ----------

  async refundOrder(organizationId: string, input: { orderId: string; amountMinor?: MinorUnits | undefined; reason: string; idempotencyKey?: string | undefined }): Promise<Refund> {
    const order = await this.getOrder(organizationId, input.orderId);
    if (order.status !== "paid" && order.status !== "partially_refunded") {
      throw new DomainError("INVALID_STATE", `order is ${order.status}, only paid orders can be refunded`);
    }
    const refundable = order.pricing.totalMinor - order.refundedMinor;
    const amount = input.amountMinor ?? refundable;
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new DomainError("VALIDATION", "amountMinor must be a positive integer");
    if (amount > refundable) throw new DomainError("VALIDATION", `amount exceeds refundable ${refundable}`);
    if (!input.reason.trim()) throw new DomainError("VALIDATION", "reason is required");

    const refund: Refund = {
      id: this.ids.next("rf"),
      orderId: order.id,
      organizationId,
      amountMinor: amount,
      reason: input.reason.trim(),
      status: "pending",
      createdAt: this.clock.now(),
    };
    await this.repos.refunds.create(refund);

    if (!order.paymentRef || order.paymentRef.startsWith("free_") || order.paymentMethod === "invoice") {
      // Free or invoice-paid: the organizer returns the money by bank transfer; the ledger records it now.
      await this.settleRefund(refund);
      return (await this.repos.refunds.get(refund.id)) ?? refund;
    }
    const res = await this.payments.refund({
      idempotencyKey: input.idempotencyKey ?? `refund:${refund.id}`,
      paymentRef: order.paymentRef,
      amountMinor: amount,
      reason: refund.reason,
      ...(order.chargeAccountRef ? { accountRef: order.chargeAccountRef } : {}),
    });
    const withRef: Refund = { ...refund, paymentRefundRef: res.refundRef };
    await this.repos.refunds.update(withRef);
    if (res.status === "succeeded") await this.settleRefund(withRef);
    if (res.status === "failed") await this.repos.refunds.update({ ...withRef, status: "failed" });
    return (await this.repos.refunds.get(refund.id)) ?? withRef;
  }

  /** Reverse the paid entry pro rata and mark the refund settled. */
  private async settleRefund(refund: Refund): Promise<void> {
    const order = await this.repos.orders.get(refund.orderId);
    if (!order) throw notFound("order", refund.orderId);
    const ccy = order.currency;
    const total = order.pricing.totalMinor;

    if (total > 0 && order.settlement === "direct") {
      // Stripe returns the application fee pro rata; the rest of the refund comes from the organizer's account.
      const feeShare = allocate(refund.amountMinor, [total - order.pricing.platformFeeMinor, order.pricing.platformFeeMinor])[1] ?? 0;
      if (feeShare > 0) {
        await this.ledger.post({
          idempotencyKey: `refund:${refund.id}:settled`,
          currency: ccy,
          description: `Application fee returned with refund ${refund.id} for direct order ${order.id}`,
          postings: [{ accountId: (await this.accounts.clearing(ccy)).id, amount: -feeShare }, { accountId: (await this.accounts.feeRevenue(ccy)).id, amount: feeShare }],
          metadata: { orderId: order.id, refundId: refund.id, organizationId: order.organizationId, settlement: "direct" },
        });
      }
    } else if (total > 0) {
      // Buckets in the same order as the paid entry: organizer side (held or payable + parties), platform fee, tax.
      const buckets: Array<{ accountId: string; paid: number }> = [];
      const organizerSide = order.splits.organizerMinor + order.splits.lines.reduce((a, l) => a + l.amountMinor, 0);
      if (order.fundsStatus === "held") {
        buckets.push({ accountId: (await this.accounts.orgHeld(order.organizationId, ccy)).id, paid: organizerSide });
      } else {
        const orgPayable = await this.accounts.orgPayable(order.organizationId, ccy);
        buckets.push({ accountId: orgPayable.id, paid: order.splits.organizerMinor });
        for (const line of order.splits.lines) {
          const acct = await this.accounts.partyPayable(order.organizationId, line.partyId, ccy);
          buckets.push({ accountId: acct.id, paid: line.amountMinor });
        }
      }
      const fees = await this.accounts.feeRevenue(ccy);
      buckets.push({ accountId: fees.id, paid: order.pricing.platformFeeMinor });
      if (order.pricing.taxMinor > 0) buckets.push({ accountId: (await this.accounts.taxPayable(order.organizationId, ccy)).id, paid: order.pricing.taxMinor });

      const shares = allocate(refund.amountMinor, buckets.map((b) => b.paid));
      const cashAccount = order.paymentMethod === "invoice" ? await this.accounts.bankClearing(ccy) : await this.accounts.clearing(ccy);
      const postings: Posting[] = [{ accountId: cashAccount.id, amount: -refund.amountMinor }];
      buckets.forEach((b, i) => {
        const amt = shares[i] ?? 0;
        if (amt !== 0) postings.push({ accountId: b.accountId, amount: amt });
      });
      if (order.fundsStatus === "held") order.heldMinor = Math.max(0, order.heldMinor - (shares[0] ?? 0));
      await this.ledger.post({
        idempotencyKey: `refund:${refund.id}:settled`,
        currency: ccy,
        description: `Refund ${refund.id} for order ${order.id}: ${refund.reason}`,
        postings,
        metadata: { orderId: order.id, refundId: refund.id, organizationId: order.organizationId },
      });
    }

    const refunded = order.refundedMinor + refund.amountMinor;
    const fully = refunded >= total;
    await this.repos.orders.update({ ...order, refundedMinor: refunded, status: fully ? "refunded" : "partially_refunded", heldMinor: fully ? 0 : order.heldMinor });
    await this.repos.refunds.update({ ...refund, status: "succeeded" });
    if (fully) {
      for (const seat of await this.repos.seats.listByOrder(order.id)) {
        if (seat.status === "confirmed" || seat.status === "reserved") await this.repos.seats.update({ ...seat, status: "cancelled" });
      }
      await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
      await this.offerWaitlist(order.eventId);
    }
    const settled = (await this.repos.refunds.get(refund.id)) ?? refund;
    const event = await this.repos.events.get(order.eventId);
    if (event) {
      const org = await this.getOrganization(order.organizationId);
      const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
      const latest = (await this.repos.orders.get(order.id)) ?? order;
      await this.runHooks("orderRefunded", order.id, (hook) => hook({ organization: org, order: latest, refund: settled, fully, event, course }));
    }
  }

  // ---------- Tax ----------

  private async priceWithTax(input: { org: Organization; currency: string; unitPriceMinor: MinorUnits; quantity: number; billingAddress?: BillingAddress | undefined; businessCustomer: boolean; direct?: boolean | undefined; verifiedBadge?: boolean | undefined; converted?: boolean | undefined; marketplace?: boolean | undefined; flexible?: boolean | undefined }) {
    const common = {
      currency: input.currency, unitPriceMinor: input.unitPriceMinor, quantity: input.quantity, destination: input.org.payoutDestination, passFeeToAttendee: input.org.passFeeToAttendee,
      ...(input.direct ? { mode: "direct" as const } : {}), ...(input.verifiedBadge ? { verifiedBadge: true } : {}),
      ...(input.converted ? { converted: true } : {}), ...(input.marketplace ? { marketplace: true } : {}), ...(input.flexible ? { flexible: true } : {}),
    };
    const base = priceOrder(common);
    if (!input.billingAddress) return base;
    const taxable = base.subtotalMinor + base.attendeeFeeMinor;
    const tax = await this.tax.calculate({ currency: input.currency, amountMinor: taxable, sellerCountry: input.org.country, buyer: input.billingAddress, businessCustomer: input.businessCustomer });
    return priceOrder({ ...common, taxMinor: tax.taxMinor });
  }

  /** Courses with an EnrollClass verified badge add its per-seat fee to paid seats. */
  private async issuesVerifiedBadge(event: Event): Promise<boolean> {
    return event.courseId ? issuesVerifiedBadge(await this.repos.courses.get(event.courseId)) : false;
  }

  /** The organizer's own Stripe account for a Direct charge; refuses until Stripe lets it take payments. */
  private directChargeAccount(org: Organization): string {
    if (!org.directAccountRef || !org.directStatus?.chargesEnabled) {
      throw new DomainError("INVALID_STATE", `${org.name} can't take card payments yet`, "the organizer needs to finish connecting their Stripe account");
    }
    return org.directAccountRef;
  }

  // ---------- Corporate accounts & invoices ----------

  async createCorporateAccount(organizationId: string, input: { name: string; billingEmail: string; address: BillingAddress; poRequired?: boolean | undefined; netTermsDays?: number | undefined; currency?: string | undefined }): Promise<CorporateAccount> {
    const org = await this.getOrganization(organizationId);
    if (!input.name.trim()) throw new DomainError("VALIDATION", "name is required");
    if (!isEmail(input.billingEmail)) throw new DomainError("VALIDATION", "billingEmail is invalid");
    if (!/^[A-Z]{2}$/.test(input.address.country)) throw new DomainError("VALIDATION", "address.country must be ISO 3166-1 alpha-2");
    const netTermsDays = input.netTermsDays ?? 30;
    if (!Number.isSafeInteger(netTermsDays) || netTermsDays < 0 || netTermsDays > 180) throw new DomainError("VALIDATION", "netTermsDays must be between 0 and 180");
    const currency = input.currency ?? org.currency;
    assertCurrency(currency);
    const account: CorporateAccount = {
      id: this.ids.next("corp"), organizationId, name: input.name.trim(), billingEmail: input.billingEmail.toLowerCase(), address: input.address,
      poRequired: input.poRequired ?? false, netTermsDays, currency, createdAt: this.clock.now(),
    };
    await this.repos.corporateAccounts.create(account);
    return account;
  }

  async getCorporateAccount(organizationId: string, id: string): Promise<CorporateAccount> {
    const a = await this.repos.corporateAccounts.get(id);
    if (!a || a.organizationId !== organizationId) throw notFound("corporateAccount", id);
    return a;
  }

  listCorporateAccounts(organizationId: string): Promise<CorporateAccount[]> {
    return this.repos.corporateAccounts.listByOrganization(organizationId);
  }

  /**
   * Quote-to-invoice in one step: seats are held, an invoice is issued with
   * the account's net terms, and the order settles when the invoice is paid
   * (bank transfer recorded by the organizer, or card against the invoice).
   */
  async createInvoiceOrder(
    organizationId: string,
    input: {
      corporateAccountId: string;
      ticketTypeId: string;
      quantity: number;
      attendees?: Attendee[] | undefined;
      poNumber?: string | undefined;
      currency?: string | undefined;
      dueDays?: number | undefined;
      idempotencyKey?: string | undefined;
      dryRun?: boolean | undefined;
    },
  ): Promise<{ order: Order; invoice: Invoice; created: boolean }> {
    const org = await this.getOrganization(organizationId);
    const account = await this.getCorporateAccount(organizationId, input.corporateAccountId);
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || input.quantity > 500) throw new DomainError("VALIDATION", "quantity must be an integer between 1 and 500");
    if (account.poRequired && !input.poNumber?.trim()) throw new DomainError("VALIDATION", `${account.name} requires a PO number`, "ask the buyer for their purchase order number");
    if (input.attendees && input.attendees.length > input.quantity) throw new DomainError("VALIDATION", "more attendees than seats");
    for (const a of input.attendees ?? []) if (!isEmail(a.email)) throw new DomainError("VALIDATION", `attendee email ${a.email} is invalid`);

    if (input.idempotencyKey) {
      const prior = await this.repos.orders.getByIdempotencyKey(organizationId, input.idempotencyKey);
      if (prior) {
        const inv = await this.repos.invoices.getByOrder(prior.id);
        if (inv) return { order: prior, invoice: inv, created: false };
      }
    }

    const ticketType = await this.repos.ticketTypes.get(input.ticketTypeId);
    if (!ticketType || ticketType.organizationId !== organizationId) throw notFound("ticketType", input.ticketTypeId);
    const event = await this.getEvent(organizationId, ticketType.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);

    const currency = input.currency ?? account.currency;
    const unitPriceMinor = this.resolveUnitPrice(ticketType, event, currency, this.clock.now(), this.pricingOf(org));
    const pricing = await this.priceWithTax({ org, currency, unitPriceMinor, quantity: input.quantity, billingAddress: account.address, businessCustomer: true, verifiedBadge: await this.issuesVerifiedBadge(event) });
    const splits = computeSplits(pricing.organizerNetMinor, org.id, event.splitRules ?? org.splitRules);
    const attendees: Attendee[] = Array.from({ length: input.quantity }, (_, i) => input.attendees?.[i] ?? { email: account.billingEmail, company: account.name });
    const now = this.clock.now();
    const dueDays = input.dueDays ?? account.netTermsDays;
    const dueAt = new Date(now.getTime() + dueDays * 86_400_000);

    const order: Order = {
      id: this.ids.next("ord"), organizationId, eventId: event.id, ticketTypeId: ticketType.id, quantity: input.quantity,
      buyerEmail: account.billingEmail, attendees, currency, status: "pending", paymentMethod: "invoice", corporateAccountId: account.id,
      billingAddress: account.address, pricing, splits, transferRefs: {}, refundedMinor: 0, heldMinor: 0, fundsStatus: "none",
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}), createdAt: now,
    };
    const invoiceId = this.ids.next("inv");
    const invoice: Invoice = {
      id: invoiceId, organizationId, orderId: order.id, corporateAccountId: account.id,
      number: "", ...(input.poNumber?.trim() ? { poNumber: input.poNumber.trim() } : {}), currency,
      subtotalMinor: pricing.subtotalMinor + pricing.attendeeFeeMinor, taxMinor: pricing.taxMinor, totalMinor: pricing.totalMinor, paidMinor: 0,
      status: "issued", issuedAt: now, dueAt, payments: [], createdAt: now,
    };
    if (input.dryRun) return { order, invoice, created: false };

    const reserved = await this.repos.ticketTypes.reserve(ticketType.id, input.quantity);
    if (!reserved) throw new DomainError("SOLD_OUT", `only ${ticketType.quantity - ticketType.sold} left`, "lower the quantity");
    order.paymentRef = `inv_${invoiceId}`;
    try {
      await this.repos.orders.create(order);
      const seq = await this.repos.invoices.nextNumber(organizationId, now.getUTCFullYear());
      invoice.number = `INV-${now.getUTCFullYear()}-${String(seq).padStart(4, "0")}`;
      await this.repos.invoices.create(invoice);
      for (const attendee of attendees) {
        await this.repos.seats.create({ id: this.ids.next("seat"), organizationId, orderId: order.id, eventId: event.id, ticketTypeId: ticketType.id, attendee, status: "reserved", createdAt: now });
      }
    } catch (err) {
      await this.repos.ticketTypes.release(ticketType.id, input.quantity);
      throw err;
    }
    if (pricing.totalMinor === 0) await this.recordInvoicePayment(organizationId, { invoiceId, amountMinor: 0, method: "other", reference: "free" });
    const finalInvoice = (await this.repos.invoices.get(invoiceId)) ?? invoice;
    await this.runHooks("invoiceIssued", order.id, (hook) => hook({ organization: org, order, invoice: finalInvoice, account, event }));
    return { order: (await this.repos.orders.get(order.id)) ?? order, invoice: finalInvoice, created: true };
  }

  async getInvoice(organizationId: string, invoiceId: string): Promise<Invoice> {
    const i = await this.repos.invoices.get(invoiceId);
    if (!i || i.organizationId !== organizationId) throw notFound("invoice", invoiceId);
    return i;
  }

  listInvoices(organizationId: string, filter?: { status?: Invoice["status"][] | undefined }): Promise<Invoice[]> {
    return this.repos.invoices.listByOrganization(organizationId, filter);
  }

  /** Cash against an invoice. Partial payments are held as customer deposits; the last one settles the order. */
  async recordInvoicePayment(
    organizationId: string,
    input: { invoiceId: string; amountMinor: MinorUnits; method: InvoicePaymentMethod; reference?: string | undefined; receivedAt?: Date | undefined; viaCardRef?: string | undefined },
  ): Promise<Invoice> {
    const invoice = await this.getInvoice(organizationId, input.invoiceId);
    if (invoice.status === "paid" || invoice.status === "void") throw new DomainError("INVALID_STATE", `invoice is ${invoice.status}`);
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) throw new DomainError("VALIDATION", "amountMinor must be a non-negative integer");
    const outstanding = invoice.totalMinor - invoice.paidMinor;
    if (input.amountMinor > outstanding) throw new DomainError("VALIDATION", `amount exceeds outstanding ${outstanding}`, "record the overpayment separately");
    const order = await this.repos.orders.get(invoice.orderId);
    if (!order) throw notFound("order", invoice.orderId);
    const ccy = invoice.currency;
    const receivedAt = input.receivedAt ?? this.clock.now();
    const payment = { id: this.ids.next("ip"), amountMinor: input.amountMinor, method: input.method, ...(input.reference ? { reference: input.reference } : {}), receivedAt };
    const paidMinor = invoice.paidMinor + input.amountMinor;
    const complete = paidMinor >= invoice.totalMinor;
    const cashAccount = input.method === "card" ? await this.accounts.clearing(ccy) : await this.accounts.bankClearing(ccy);

    if (!complete) {
      if (input.amountMinor > 0) {
        const deposits = await this.accounts.customerDeposits(ccy);
        await this.ledger.post({
          idempotencyKey: `invoice:${invoice.id}:payment:${payment.id}`, currency: ccy, description: `Partial payment on ${invoice.number}`,
          postings: [{ accountId: cashAccount.id, amount: input.amountMinor }, { accountId: deposits.id, amount: -input.amountMinor }],
          metadata: { invoiceId: invoice.id, orderId: order.id, organizationId },
        });
      }
      const { cardPaymentRef: _drop, ...rest } = invoice;
      const updated: Invoice = { ...(rest as Invoice), paidMinor, status: "partially_paid", payments: [...invoice.payments, payment] };
      await this.repos.invoices.update(updated);
      return updated;
    }

    // Final payment: release held deposits and settle the order with the full cash picture.
    const cash: Posting[] = [];
    if (input.amountMinor > 0) cash.push({ accountId: cashAccount.id, amount: input.amountMinor });
    if (invoice.paidMinor > 0) cash.push({ accountId: (await this.accounts.customerDeposits(ccy)).id, amount: invoice.paidMinor });
    const { cardPaymentRef: _drop2, ...rest2 } = invoice;
    const settled: Invoice = { ...(rest2 as Invoice), paidMinor, status: "paid", payments: [...invoice.payments, payment] };
    await this.repos.invoices.update(settled);
    if (order.status === "pending") await this.markPaid(order, cash.length ? cash : undefined);
    return settled;
  }

  /** Let the buyer pay an open invoice by card: returns a client secret for the outstanding amount. */
  async createInvoiceCardPayment(organizationId: string, invoiceId: string): Promise<{ invoice: Invoice; clientSecret: string | null; paymentRef: string }> {
    const invoice = await this.getInvoice(organizationId, invoiceId);
    if (invoice.status === "paid" || invoice.status === "void") throw new DomainError("INVALID_STATE", `invoice is ${invoice.status}`);
    const order = await this.repos.orders.get(invoice.orderId);
    if (!order) throw notFound("order", invoice.orderId);
    const outstanding = invoice.totalMinor - invoice.paidMinor;
    const p = await this.payments.createPayment({
      orderId: `${order.id}:${invoice.id}:${invoice.payments.length}`, amountMinor: outstanding, currency: invoice.currency, transferGroup: order.id, buyerEmail: order.buyerEmail,
      metadata: { orderId: order.id, invoiceId: invoice.id, organizationId },
    });
    const updated: Invoice = { ...invoice, cardPaymentRef: p.paymentRef };
    await this.repos.invoices.update(updated);
    return { invoice: updated, clientSecret: p.clientSecret, paymentRef: p.paymentRef };
  }

  /**
   * Chase open invoices on the organizer's behalf: one email per reminder step (3 days before
   * the due date, on it, then 7, 14 and 30 days late). Only the latest step that applies is
   * sent, and never twice. Runs from the scheduler.
   */
  async runInvoiceReminders(now = this.clock.now()): Promise<{ sent: number }> {
    let sent = 0;
    for (const org of await this.repos.organizations.list()) {
      for (const invoice of await this.repos.invoices.listByOrganization(org.id, { status: ["issued", "partially_paid"] })) {
        const step = invoiceReminderStep(invoice.dueAt, now);
        if (!step || invoice.reminders?.some((r) => r.step === step)) continue;
        const order = await this.repos.orders.get(invoice.orderId);
        const account = invoice.corporateAccountId ? await this.repos.corporateAccounts.get(invoice.corporateAccountId) : undefined;
        const event = order ? await this.repos.events.get(order.eventId) : undefined;
        if (!order || !account || !event) continue;
        const next: Invoice = { ...invoice, reminders: [...(invoice.reminders ?? []), { step, sentAt: now }] };
        await this.repos.invoices.update(next);
        await this.runHooks("invoiceReminder", order.id, (hook) => hook({ organization: org, order, invoice: next, account, event, step }));
        sent += 1;
      }
    }
    return { sent };
  }

  /** An invoice by id, for its public payment page (the caller proves access with a signed link). */
  async invoiceForPayment(invoiceId: string): Promise<{ invoice: Invoice; organization: Organization; account?: CorporateAccount | undefined; order: Order; event: Event; course?: Course | undefined } | null> {
    const invoice = await this.repos.invoices.get(invoiceId);
    if (!invoice) return null;
    const order = await this.repos.orders.get(invoice.orderId);
    const event = order ? await this.repos.events.get(order.eventId) : undefined;
    if (!order || !event) return null;
    const account = invoice.corporateAccountId ? await this.repos.corporateAccounts.get(invoice.corporateAccountId) : undefined;
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    return { invoice, organization: await this.getOrganization(invoice.organizationId), account, order, event, course };
  }

  async voidInvoice(organizationId: string, invoiceId: string, reason: string): Promise<Invoice> {
    const invoice = await this.getInvoice(organizationId, invoiceId);
    if (invoice.status === "paid") throw new DomainError("INVALID_STATE", "paid invoices are refunded, not voided");
    if (invoice.status === "void") return invoice;
    if (invoice.paidMinor > 0) throw new DomainError("INVALID_STATE", "invoice has partial payments; refund them first");
    const order = await this.repos.orders.get(invoice.orderId);
    if (order && order.status === "pending") {
      await this.repos.orders.update({ ...order, status: "cancelled" });
      await this.repos.ticketTypes.release(order.ticketTypeId, order.quantity);
      for (const seat of await this.repos.seats.listByOrder(order.id)) await this.repos.seats.update({ ...seat, status: "cancelled" });
    }
    const voided: Invoice = { ...invoice, status: "void" };
    await this.repos.invoices.update(voided);
    void reason;
    return voided;
  }

  /** Receivables ageing as of a date: what corporate buyers still owe, bucketed by days past due. */
  async receivablesAgeing(organizationId: string, asOf = this.clock.now()) {
    const open = await this.repos.invoices.listByOrganization(organizationId, { status: ["issued", "partially_paid"] });
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 } as Record<"current" | "d1_30" | "d31_60" | "d61_90" | "d90_plus", number>;
    const byCurrency: Record<string, typeof buckets> = {};
    const items = open.map((i) => {
      const outstanding = i.totalMinor - i.paidMinor;
      const daysPastDue = Math.floor((asOf.getTime() - i.dueAt.getTime()) / 86_400_000);
      const bucket = daysPastDue <= 0 ? "current" : daysPastDue <= 30 ? "d1_30" : daysPastDue <= 60 ? "d31_60" : daysPastDue <= 90 ? "d61_90" : "d90_plus";
      byCurrency[i.currency] ??= { ...buckets };
      byCurrency[i.currency]![bucket] += outstanding;
      return { invoiceId: i.id, number: i.number, corporateAccountId: i.corporateAccountId, currency: i.currency, outstandingMinor: outstanding, dueAt: i.dueAt, daysPastDue: Math.max(0, daysPastDue), bucket };
    });
    return { asOf, byCurrency, items };
  }

  // ---------- Change policy, seat self-service ----------

  async policyFor(organizationId: string, courseId: string | undefined): Promise<ChangePolicy> {
    const org = await this.getOrganization(organizationId);
    const course = courseId ? await this.repos.courses.get(courseId) : undefined;
    return course?.changePolicy ?? org.changePolicy ?? DEFAULT_CHANGE_POLICY;
  }

  async setChangePolicy(organizationId: string, policy: ChangePolicy, courseId?: string | undefined): Promise<ChangePolicy> {
    validatePolicy(policy);
    if (courseId) {
      const course = await this.getCourse(organizationId, courseId);
      await this.repos.courses.update({ ...course, changePolicy: policy });
    } else {
      const org = await this.getOrganization(organizationId);
      await this.repos.organizations.update({ ...org, changePolicy: policy });
    }
    return policy;
  }

  private async loadSeat(seatId: string, organizationId?: string | undefined, attendeeEmail?: string | undefined) {
    const seat = await this.repos.seats.get(seatId);
    if (!seat || (organizationId && seat.organizationId !== organizationId)) throw notFound("seat", seatId);
    if (attendeeEmail !== undefined && seat.attendee.email.toLowerCase() !== attendeeEmail.trim().toLowerCase()) throw notFound("seat", seatId);
    const event = await this.repos.events.get(seat.eventId);
    const order = await this.repos.orders.get(seat.orderId);
    const ticketType = await this.repos.ticketTypes.get(seat.ticketTypeId);
    if (!event || !order || !ticketType) throw notFound("seat", seatId);
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    const organization = await this.getOrganization(seat.organizationId);
    const policy = course?.changePolicy ?? organization.changePolicy ?? DEFAULT_CHANGE_POLICY;
    return { seat, event, order, ticketType, course, organization, policy };
  }

  /** The seat's share of what was paid: unit price plus its share of the attendee fee, net of refunds. */
  private seatValue(order: Order): MinorUnits {
    const gross = order.pricing.subtotalMinor + order.pricing.attendeeFeeMinor + order.pricing.taxMinor;
    const perSeat = allocate(gross, Array.from({ length: order.quantity }, () => 1))[0] ?? 0;
    return Math.max(0, Math.min(perSeat, order.pricing.totalMinor - order.refundedMinor));
  }

  /** What a learner can do with a seat right now, plus the cohorts they could move to. */
  async seatOptions(seatId: string, opts: { organizationId?: string | undefined; attendeeEmail?: string | undefined }) {
    const ctx = await this.loadSeat(seatId, opts.organizationId, opts.attendeeEmail);
    const now = this.clock.now();
    const ended = ctx.event.status === "ended" || ctx.event.status === "cancelled";
    const active = ctx.seat.status === "confirmed";
    const unit = ctx.order.pricing.unitPriceMinor;
    const transfer = active ? transferTerms(ctx.policy, ctx.event.startsAt, now, unit, ended) : { allowed: false, feeMinor: 0, freeUntil: ctx.event.startsAt, reason: `seat is ${ctx.seat.status}` };
    let cancel = active ? cancelTerms(ctx.policy, ctx.event.startsAt, now, this.seatValue(ctx.order), ended) : { allowed: false, refundBps: 0, refundMinor: 0, fullRefundUntil: ctx.event.startsAt, reason: `seat is ${ctx.seat.status}` };
    // Flexible ticket: a full refund (of the seat, not the upgrade) until 24 hours before the start, whatever the policy says.
    const flexibleUntil = new Date(ctx.event.startsAt.getTime() - 24 * 3_600_000);
    if (active && (ctx.order.pricing.flexibleMinor ?? 0) > 0 && !ended && now < flexibleUntil && cancel.refundBps < 10_000) {
      cancel = { allowed: true, refundBps: 10_000, refundMinor: this.seatValue(ctx.order), fullRefundUntil: flexibleUntil };
    }
    const substitute = active ? substituteTerms(ctx.policy, ctx.event.startsAt, now, ended) : { allowed: false, until: ctx.event.startsAt, reason: `seat is ${ctx.seat.status}` };
    const transferOptions = [];
    if (transfer.allowed && ctx.event.courseId) {
      for (const target of await this.repos.events.listByCourse(ctx.event.courseId)) {
        if (target.id === ctx.event.id || target.status !== "live" || target.startsAt <= now) continue;
        const types = await this.repos.ticketTypes.listByEvent(target.id);
        const same = types.find((t) => t.name === ctx.ticketType.name) ?? types[0];
        if (!same) continue;
        let priceDelta = 0;
        try { priceDelta = Math.max(0, this.resolveUnitPrice(same, target, ctx.order.currency, now) - unit); } catch { continue; }
        transferOptions.push({ eventId: target.id, ticketTypeId: same.id, name: target.name, startsAt: target.startsAt, endsAt: target.endsAt, timezone: target.timezone, remaining: same.quantity - same.sold, priceDeltaMinor: priceDelta, feeMinor: transfer.feeMinor + priceDelta });
      }
    }
    return { ...ctx, policyTerms: { transfer, cancel, substitute }, transferOptions };
  }

  async substituteSeat(seatId: string, attendee: Attendee, opts: { organizationId?: string | undefined; attendeeEmail?: string | undefined }): Promise<Seat> {
    const { seat, policyTerms } = await this.seatOptions(seatId, opts);
    if (!policyTerms.substitute.allowed) throw new DomainError("INVALID_STATE", policyTerms.substitute.reason ?? "substitution not allowed");
    if (!isEmail(attendee.email)) throw new DomainError("VALIDATION", "attendee email is invalid");
    const updated: Seat = { ...seat, attendee, substitutions: [...(seat.substitutions ?? []), { from: seat.attendee, at: this.clock.now() }] };
    await this.repos.seats.update(updated);
    await this.runHooks("seatChanged", seat.orderId, (hook) => hook({ kind: "substituted", seat: updated, previousAttendee: seat.attendee }));
    return updated;
  }

  async transferSeat(seatId: string, toEventId: string, opts: { organizationId?: string | undefined; attendeeEmail?: string | undefined }): Promise<{ transfer: SeatTransfer; seat: Seat | null; clientSecret: string | null }> {
    const ctx = await this.seatOptions(seatId, opts);
    if (!ctx.policyTerms.transfer.allowed) throw new DomainError("INVALID_STATE", ctx.policyTerms.transfer.reason ?? "transfer not allowed");
    const option = ctx.transferOptions.find((o) => o.eventId === toEventId);
    if (!option) throw new DomainError("VALIDATION", `cohort ${toEventId} is not available for transfer`);
    if (option.remaining <= 0) throw new DomainError("SOLD_OUT", `${option.name} is sold out`, "join its waitlist");
    const reserved = await this.repos.ticketTypes.reserve(option.ticketTypeId, 1);
    if (!reserved) throw new DomainError("SOLD_OUT", `${option.name} is sold out`);
    const now = this.clock.now();
    const transfer: SeatTransfer = {
      id: this.ids.next("xfer"), organizationId: ctx.seat.organizationId, fromSeatId: ctx.seat.id, toEventId, toTicketTypeId: option.ticketTypeId,
      feeMinor: option.feeMinor, currency: ctx.order.currency, status: option.feeMinor > 0 ? "pending_payment" : "completed", createdAt: now,
    };
    if (option.feeMinor === 0) {
      await this.repos.seatTransfers.create(transfer);
      const seat = await this.completeTransfer(transfer, { paid: false });
      return { transfer: (await this.repos.seatTransfers.get(transfer.id)) ?? transfer, seat, clientSecret: null };
    }
    let p;
    try {
      // Direct mode: the change fee is the organizer's money, charged on their own account with no fee.
      const org = await this.getOrganization(ctx.seat.organizationId);
      const chargeAccount = org.paymentMode === "direct" ? this.directChargeAccount(org) : undefined;
      if (chargeAccount) transfer.chargeAccountRef = chargeAccount;
      p = await this.payments.createPayment({ orderId: `${ctx.order.id}:${transfer.id}`, amountMinor: option.feeMinor, currency: ctx.order.currency, transferGroup: ctx.order.id, buyerEmail: ctx.seat.attendee.email, metadata: { orderId: ctx.order.id, transferId: transfer.id, organizationId: ctx.seat.organizationId }, ...(chargeAccount ? { direct: { accountRef: chargeAccount, applicationFeeMinor: 0 } } : {}) });
    } catch (err) {
      if (err instanceof DomainError) {
        await this.repos.ticketTypes.release(option.ticketTypeId, 1);
        throw err;
      }
      await this.repos.ticketTypes.release(option.ticketTypeId, 1);
      throw new DomainError("PAYMENTS_UPSTREAM", `payments provider error: ${(err as Error).message}`);
    }
    transfer.paymentRef = p.paymentRef;
    await this.repos.seatTransfers.create(transfer);
    return { transfer, seat: null, clientSecret: p.clientSecret };
  }

  /** Move the seat: new seat on the target cohort, old seat marked transferred, source capacity released, fee settled to the organizer. */
  private async completeTransfer(transfer: SeatTransfer, opts: { paid: boolean }): Promise<Seat> {
    const old = await this.repos.seats.get(transfer.fromSeatId);
    if (!old) throw notFound("seat", transfer.fromSeatId);
    const now = this.clock.now();
    const seat: Seat = { id: this.ids.next("seat"), organizationId: old.organizationId, orderId: old.orderId, eventId: transfer.toEventId, ticketTypeId: transfer.toTicketTypeId, attendee: old.attendee, status: "confirmed", createdAt: now, confirmedAt: now, transferredFromSeatId: old.id };
    await this.repos.seats.create(seat);
    await this.repos.seats.update({ ...old, status: "transferred", transferredToSeatId: seat.id });
    await this.repos.ticketTypes.release(old.ticketTypeId, 1);
    await this.repos.seatTransfers.update({ ...transfer, status: "completed", toSeatId: seat.id, completedAt: now });
    if (opts.paid && transfer.feeMinor > 0 && !transfer.chargeAccountRef) {
      const clearing = await this.accounts.clearing(transfer.currency);
      const payable = await this.accounts.orgPayable(old.organizationId, transfer.currency);
      await this.ledger.post({
        idempotencyKey: `transfer:${transfer.id}:fee`, currency: transfer.currency, description: `Transfer fee for seat ${old.id}`,
        postings: [{ accountId: clearing.id, amount: transfer.feeMinor }, { accountId: payable.id, amount: -transfer.feeMinor }],
        metadata: { orderId: old.orderId, transferId: transfer.id, organizationId: old.organizationId },
      });
    }
    await this.offerWaitlist(old.eventId);
    await this.runHooks("seatChanged", old.orderId, (hook) => hook({ kind: "transferred", seat, previousSeat: old }));
    return seat;
  }

  async cancelSeat(seatId: string, reason: string, opts: { organizationId?: string | undefined; attendeeEmail?: string | undefined }): Promise<{ seat: Seat; refund: Refund | null }> {
    const ctx = await this.seatOptions(seatId, opts);
    if (!ctx.policyTerms.cancel.allowed) throw new DomainError("INVALID_STATE", ctx.policyTerms.cancel.reason ?? "cancellation not allowed");
    const now = this.clock.now();
    const cancelled: Seat = { ...ctx.seat, status: "cancelled", cancelledAt: now };
    await this.repos.seats.update(cancelled);
    await this.repos.ticketTypes.release(ctx.seat.ticketTypeId, 1);
    let refund: Refund | null = null;
    const amount = ctx.policyTerms.cancel.refundMinor;
    if (amount > 0) {
      refund = await this.refundOrder(ctx.seat.organizationId, { orderId: ctx.order.id, amountMinor: amount, reason: `seat ${ctx.seat.id} cancelled: ${reason || "no reason given"}`, idempotencyKey: `refund:seat:${ctx.seat.id}` });
    }
    await this.offerWaitlist(ctx.seat.eventId);
    await this.runHooks("seatChanged", ctx.seat.orderId, (hook) => hook({ kind: "cancelled", seat: cancelled, refund }));
    return { seat: cancelled, refund };
  }

  // ---------- Waitlist ----------

  async joinWaitlist(organizationId: string, input: { eventId: string; ticketTypeId?: string | undefined; email: string; name?: string | undefined; quantity?: number | undefined }): Promise<{ entry: WaitlistEntry; position: number }> {
    const event = await this.getEvent(organizationId, input.eventId);
    if (event.status !== "live") throw new DomainError("INVALID_STATE", `event is ${event.status}`);
    if (!isEmail(input.email)) throw new DomainError("VALIDATION", "email is invalid");
    const quantity = input.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) throw new DomainError("VALIDATION", "quantity must be between 1 and 10");
    const types = await this.repos.ticketTypes.listByEvent(event.id);
    const ticketType = input.ticketTypeId ? types.find((t) => t.id === input.ticketTypeId) : types[0];
    if (!ticketType) throw notFound("ticketType", input.ticketTypeId ?? "(none)");
    const email = input.email.toLowerCase();
    const existing = await this.repos.waitlist.findOpen(event.id, email);
    if (existing) throw new DomainError("CONFLICT", "you are already on this waitlist", "we will email you when a seat opens");
    const entry: WaitlistEntry = { id: this.ids.next("wl"), organizationId, eventId: event.id, ticketTypeId: ticketType.id, email, ...(input.name ? { name: input.name } : {}), quantity, status: "waiting", createdAt: this.clock.now() };
    await this.repos.waitlist.create(entry);
    const open = await this.repos.waitlist.listOpenByEvent(event.id);
    const position = open.findIndex((e) => e.id === entry.id) + 1;
    // Seats may already be free (e.g. capacity raised): offer immediately.
    await this.offerWaitlist(event.id);
    const fresh = (await this.repos.waitlist.get(entry.id)) ?? entry;
    return { entry: fresh, position };
  }

  /** Offer freed capacity to the oldest waiting entries; each offer holds its seats until it expires. */
  async offerWaitlist(eventId: string): Promise<WaitlistEntry[]> {
    const open = await this.repos.waitlist.listOpenByEvent(eventId);
    const waiting = open.filter((e) => e.status === "waiting");
    if (!waiting.length) return [];
    const event = await this.repos.events.get(eventId);
    if (!event || event.status !== "live") return [];
    const policy = await this.policyFor(event.organizationId, event.courseId);
    const offered: WaitlistEntry[] = [];
    const now = this.clock.now();
    for (const entry of waiting) {
      const held = await this.repos.ticketTypes.reserve(entry.ticketTypeId, entry.quantity);
      if (!held) continue;
      const updated: WaitlistEntry = { ...entry, status: "offered", offeredAt: now, offerExpiresAt: new Date(now.getTime() + policy.waitlistOfferHours * 3_600_000) };
      await this.repos.waitlist.update(updated);
      offered.push(updated);
      await this.runHooks("waitlistOffered", entry.id, (hook) => hook({ entry: updated, event, organization: null }));
    }
    return offered;
  }

  /** Release holds on offers nobody claimed; run from a scheduler. */
  async expireWaitlistOffers(now = this.clock.now()): Promise<WaitlistEntry[]> {
    const expired: WaitlistEntry[] = [];
    for (const entry of await this.repos.waitlist.listOffered()) {
      if (!entry.offerExpiresAt || entry.offerExpiresAt > now) continue;
      await this.repos.ticketTypes.release(entry.ticketTypeId, entry.quantity);
      const updated: WaitlistEntry = { ...entry, status: "expired" };
      await this.repos.waitlist.update(updated);
      expired.push(updated);
      await this.offerWaitlist(entry.eventId);
    }
    return expired;
  }

  async listWaitlist(organizationId: string, eventId: string): Promise<WaitlistEntry[]> {
    await this.getEvent(organizationId, eventId);
    return this.repos.waitlist.listOpenByEvent(eventId);
  }

  // ---------- Delivery: meetings, attendance, certificates, roster, sequences ----------

  async setMeeting(organizationId: string, eventId: string, input: { provider: MeetingInfo["provider"]; joinUrl?: string | undefined; hostUrl?: string | undefined; passcode?: string | undefined }): Promise<Event> {
    const event = await this.getEvent(organizationId, eventId);
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    let meeting: MeetingInfo;
    if (input.provider === "manual") {
      if (!input.joinUrl || !/^https?:\/\//.test(input.joinUrl)) throw new DomainError("VALIDATION", "joinUrl must be an http(s) URL");
      meeting = { provider: "manual", meetingId: `manual_${event.id}`, joinUrl: input.joinUrl, hostUrl: input.hostUrl, passcode: input.passcode };
    } else {
      const provider = this.meetings[input.provider];
      if (!provider) throw new DomainError("INVALID_STATE", `${input.provider} is not configured`, `set the ${input.provider.toUpperCase()}_* environment variables or use a manual link`);
      const minutes = Math.max(30, Math.round(((event.endsAt ?? new Date(event.startsAt.getTime() + 8 * 3_600_000)).getTime() - event.startsAt.getTime()) / 60_000));
      try {
        meeting = await provider.createMeeting({ topic: course ? `${course.name} — ${event.name}` : event.name, startsAt: event.startsAt, durationMinutes: Math.min(minutes, 24 * 60), timezone: event.timezone, externalId: event.id, agenda: course?.description });
      } catch (err) {
        throw new DomainError("PAYMENTS_UPSTREAM", `${input.provider} error: ${(err as Error).message}`);
      }
    }
    const updated: Event = { ...event, meeting };
    await this.repos.events.update(updated);
    return updated;
  }

  async listAttendance(organizationId: string, eventId: string) {
    await this.getEvent(organizationId, eventId);
    const seats = (await this.repos.seats.listByEvent(eventId)).filter((s) => s.status === "confirmed");
    return seats.map((s) => this.attendanceRow(s));
  }

  private attendanceRow(s: Seat) {
    const a: Attendance = s.attendance ?? { status: "unknown", minutes: 0, sessionsAttended: 0, source: "none", updatedAt: s.createdAt };
    return { seatId: s.id, email: s.attendee.email, name: s.attendee.name ?? null, ...a };
  }

  /** Pull the meeting participant report and mark each confirmed seat present / partial / absent. */
  async syncAttendance(organizationId: string, eventId: string): Promise<{ updated: number; items: ReturnType<Core["attendanceRow"]>[] }> {
    const event = await this.getEvent(organizationId, eventId);
    if (!event.meeting || event.meeting.provider === "manual") throw new DomainError("INVALID_STATE", "no meeting provider to sync from", "create a Zoom or Teams meeting, or mark attendance manually");
    const provider = this.meetings[event.meeting.provider];
    if (!provider) throw new DomainError("INVALID_STATE", `${event.meeting.provider} is not configured`);
    const records = await provider.getParticipants(event.meeting.meetingId);
    const sessions = event.sessions.length ? event.sessions : [{ startsAt: event.startsAt, endsAt: event.endsAt ?? new Date(event.startsAt.getTime() + 8 * 3_600_000) }];
    const scheduled = sessions.reduce((a, s) => a + (s.endsAt.getTime() - s.startsAt.getTime()) / 60_000, 0);
    const byEmail = new Map<string, { minutes: number; touched: Set<number> }>();
    for (const r of records) {
      if (!r.email) continue;
      const key = r.email.toLowerCase();
      const o = overlapMinutes(r.joinedAt, r.leftAt, sessions);
      const cur = byEmail.get(key) ?? { minutes: 0, touched: new Set<number>() };
      cur.minutes += o.minutes;
      for (const i of o.sessionsTouched) cur.touched.add(i);
      byEmail.set(key, cur);
    }
    const now = this.clock.now();
    let updated = 0;
    const seats = (await this.repos.seats.listByEvent(eventId)).filter((s) => s.status === "confirmed");
    for (const seat of seats) {
      if (seat.attendance?.source === "manual") continue;
      const m = byEmail.get(seat.attendee.email.toLowerCase());
      const attendance = m ? attendanceFromMinutes(m.minutes, scheduled, m.touched.size, now) : { status: "absent" as const, minutes: 0, sessionsAttended: 0, source: "provider" as const, updatedAt: now };
      await this.repos.seats.update({ ...seat, attendance });
      updated += 1;
    }
    return { updated, items: await this.listAttendance(organizationId, eventId) };
  }

  async setAttendance(organizationId: string, eventId: string, input: { seatId: string; status: AttendanceStatus; minutes?: number | undefined }) {
    await this.getEvent(organizationId, eventId);
    const seat = await this.repos.seats.get(input.seatId);
    if (!seat || seat.eventId !== eventId) throw notFound("seat", input.seatId);
    const attendance: Attendance = { status: input.status, minutes: input.minutes ?? seat.attendance?.minutes ?? 0, sessionsAttended: seat.attendance?.sessionsAttended ?? 0, source: "manual", updatedAt: this.clock.now() };
    const updated: Seat = { ...seat, attendance };
    await this.repos.seats.update(updated);
    return this.attendanceRow(updated);
  }

  /**
   * Certificates for a cohort's confirmed seats (once per seat). `onlyPresent`: marked present in
   * attendance; `onlyCheckedIn`: checked in at the door. Hours are the scheduled session time.
   */
  async issueCertificates(organizationId: string, eventId: string, opts: { onlyPresent?: boolean | undefined; onlyCheckedIn?: boolean | undefined; kind?: "attendance" | "completion" | undefined } = {}): Promise<Certificate[]> {
    const event = await this.getEvent(organizationId, eventId);
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    const seats = (await this.repos.seats.listByEvent(eventId)).filter((s) => s.status === "confirmed");
    const hours = Math.round(event.sessions.reduce((a, x) => a + (x.endsAt.getTime() - x.startsAt.getTime()), 0) / 360_000) / 10;
    const badge = course && issuesVerifiedBadge(course) ? badgeSnapshot(course, await this.getOrganization(organizationId)) : undefined;
    const issued: Certificate[] = [];
    for (const seat of seats) {
      if (opts.onlyPresent && seat.attendance?.status !== "present") continue;
      if (opts.onlyCheckedIn && !seat.checkedInAt) continue;
      if (await this.repos.certificates.getBySeat(seat.id)) continue;
      const cert: Certificate = {
        id: this.ids.next("cert"), organizationId, seatId: seat.id, eventId, courseName: course?.name ?? event.name,
        attendeeName: seat.attendee.name ?? seat.attendee.email, attendeeEmail: seat.attendee.email, issuedAt: this.clock.now(),
        verifyCode: randomBytes(12).toString("base64url"),
        kind: opts.kind ?? "completion",
        ...(hours > 0 ? { hours } : {}),
        ...(badge ? { badge } : {}),
      };
      await this.repos.certificates.create(cert);
      issued.push(cert);
      await this.runHooks("certificateIssued", seat.orderId, (hook) => hook({ certificate: cert, seat, event, course }));
    }
    return issued;
  }

  /**
   * Awards the course's EnrollClass verified badge to learners who already hold a certificate
   * for it (issued before the course had the badge, or while it used Credly or another
   * platform). With notify, each learner gets the certificate email again, now with the badge.
   */
  async awardBadgeToPastLearners(organizationId: string, courseId: string, opts: { notify?: boolean | undefined } = {}): Promise<{ awarded: number }> {
    const course = await this.getCourse(organizationId, courseId);
    if (!issuesVerifiedBadge(course)) throw new DomainError("INVALID_STATE", "this course has no EnrollClass verified badge", "move its badge to EnrollClass or design one first");
    const badge = badgeSnapshot(course, await this.getOrganization(organizationId));
    let awarded = 0;
    for (const event of await this.repos.events.listByCourse(courseId)) {
      if (event.organizationId !== organizationId) continue;
      for (const cert of await this.repos.certificates.listByEvent(event.id)) {
        if (cert.badge || cert.revokedAt) continue;
        const next: Certificate = { ...cert, badge };
        await this.repos.certificates.update(next);
        awarded += 1;
        if (opts.notify) {
          const seat = await this.repos.seats.get(cert.seatId);
          if (seat) await this.runHooks("certificateIssued", seat.orderId, (hook) => hook({ certificate: next, seat, event, course }));
        }
      }
    }
    return { awarded };
  }

  /** Every course's badge: where it lives, and how many learners hold the verified one or could. */
  async badgeOverview(organizationId: string): Promise<Array<{ course: Course; verified: boolean; issued: number; awaiting: number }>> {
    const out = [];
    for (const course of await this.repos.courses.listByOrganization(organizationId)) {
      let issued = 0, awaiting = 0;
      for (const event of await this.repos.events.listByCourse(course.id)) {
        for (const cert of await this.repos.certificates.listByEvent(event.id)) {
          if (cert.revokedAt) continue;
          if (cert.badge) issued += 1;
          else awaiting += 1;
        }
      }
      out.push({ course, verified: issuesVerifiedBadge(course), issued, awaiting });
    }
    return out;
  }

  async listCertificates(organizationId: string, eventId: string): Promise<Certificate[]> {
    await this.getEvent(organizationId, eventId);
    return this.repos.certificates.listByEvent(eventId);
  }

  async verifyCertificate(code: string): Promise<{ valid: boolean; certificate?: Certificate | undefined; organizationName?: string | undefined; cohort?: Event | undefined; course?: Course | undefined; instructors?: string[] }> {
    const cert = await this.repos.certificates.getByCode(code);
    if (!cert || cert.revokedAt) return { valid: false, ...(cert ? { certificate: cert } : {}) };
    const org = await this.repos.organizations.get(cert.organizationId);
    const cohort = await this.repos.events.get(cert.eventId);
    const course = cohort?.courseId ? await this.repos.courses.get(cohort.courseId) : undefined;
    const instructors = cohort ? (await Promise.all(cohort.instructorIds.map((id) => this.repos.parties.get(id)))).filter((p): p is Party => Boolean(p)).map((p) => p.name) : [];
    return { valid: true, certificate: cert, organizationName: org?.name, ...(cohort ? { cohort } : {}), ...(course ? { course } : {}), instructors };
  }

  async roster(organizationId: string, eventId: string, format = "default"): Promise<{ csv: string; format: RosterFormat; count: number }> {
    const event = await this.getEvent(organizationId, eventId);
    const fmt = ROSTER_FORMATS[format];
    if (!fmt) throw new DomainError("VALIDATION", `unknown roster format ${format}`, `one of: ${Object.keys(ROSTER_FORMATS).join(", ")}`);
    const seats = (await this.repos.seats.listByEvent(eventId)).filter((s) => s.status === "confirmed");
    return { csv: rosterCsv(seats, event, fmt), format: fmt, count: seats.length };
  }

  listMessages(organizationId: string, eventId: string) {
    return this.getEvent(organizationId, eventId).then(() => this.repos.messageLog.listByEvent(eventId));
  }

  /**
   * Send every sequence step that is due and not yet sent, for every live or
   * recently ended cohort. Idempotent through the message log; safe to run
   * from a cron every few minutes.
   */
  async runSequences(now = this.clock.now(), organizationId?: string | undefined): Promise<{ sent: number; details: Array<{ step: SequenceStep; eventId: string; to: string }> }> {
    const orgs = organizationId ? [await this.getOrganization(organizationId)] : await this.repos.organizations.list();
    const details: Array<{ step: SequenceStep; eventId: string; to: string }> = [];
    for (const org of orgs) {
      for (const event of await this.repos.events.listByOrganization(org.id)) {
        if (event.status !== "live" && event.status !== "ended") continue;
        const end = (event.endsAt ?? event.startsAt).getTime();
        if (end + 3 * 86_400_000 < now.getTime()) continue; // nothing left to send after 3 days
        const seats = (await this.repos.seats.listByEvent(event.id)).filter((s) => s.status === "confirmed");
        if (!seats.length) continue;
        const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
        for (const step of SEQUENCE_STEPS) {
          if (stepDueAt(step, event) > now) continue;
          if (step === "certificate") continue; // certificates are issued explicitly; the hook emails them
          if (step === "survey" && !course?.surveyUrl) continue;
          if (step === "prework_t14" && !course?.prework) continue;
          for (const seat of seats) {
            const key = `seq:${step}:${seat.id}`;
            const fresh = await this.repos.messageLog.record({ key, step, organizationId: org.id, eventId: event.id, seatId: seat.id, to: seat.attendee.email, sentAt: now });
            if (!fresh) continue;
            await this.runHooks("sequenceStep", seat.orderId, (hook) => hook({ step, seat, event, course, organization: org }));
            details.push({ step, eventId: event.id, to: seat.attendee.email });
          }
        }
      }
    }
    return { sent: details.length, details };
  }

  // ---------- Release, payouts, cohort economics ----------

  /** Move an order's held organizer-side funds to payable accounts (pro rata to the original split) and run transfers. An early-release fee comes out of the organizer's own share. */
  private async releaseOrder(order: Order, org: Organization, earlyFeeMinor = 0): Promise<number> {
    if (order.fundsStatus !== "held" || order.heldMinor <= 0) {
      if (order.fundsStatus === "held") await this.repos.orders.update({ ...order, fundsStatus: "released", releasedAt: this.clock.now() });
      return 0;
    }
    const ccy = order.currency;
    const weights = [order.splits.organizerMinor, ...order.splits.lines.map((l) => l.amountMinor)];
    const parts = weights.some((w) => w > 0) ? allocate(order.heldMinor, weights) : [order.heldMinor, ...order.splits.lines.map(() => 0)];
    const fee = Math.min(earlyFeeMinor, parts[0] ?? 0);
    const shares = { organizerMinor: (parts[0] ?? 0) - fee, lines: order.splits.lines.map((l, i) => ({ partyId: l.partyId, amountMinor: parts[i + 1] ?? 0 })) };
    const postings: Posting[] = [{ accountId: (await this.accounts.orgHeld(org.id, ccy)).id, amount: order.heldMinor }];
    if (fee > 0) postings.push({ accountId: (await this.accounts.feeRevenue(ccy)).id, amount: -fee });
    if (shares.organizerMinor > 0) postings.push({ accountId: (await this.accounts.orgPayable(org.id, ccy)).id, amount: -shares.organizerMinor });
    for (const l of shares.lines) if (l.amountMinor > 0) postings.push({ accountId: (await this.accounts.partyPayable(org.id, l.partyId, ccy)).id, amount: -l.amountMinor });
    await this.ledger.post({ idempotencyKey: `order:${order.id}:release`, currency: ccy, description: `Release held funds for order ${order.id}`, postings, metadata: { orderId: order.id, organizationId: org.id, eventId: order.eventId } });
    const transferRefs = await this.transferShares(order, org, shares);
    await this.repos.orders.update({ ...order, fundsStatus: "released", releasedAt: this.clock.now(), transferRefs, heldMinor: 0 });
    return order.heldMinor;
  }

  /** Pay the cohort's flat instructor fees out of the organizer's payable, once, and transfer where connected. */
  private async settleInstructorFees(event: Event, org: Organization): Promise<number> {
    const fees = (event.instructorFees ?? []).filter((f) => f.amountMinor > 0);
    if (!fees.length) return 0;
    const ccy = event.currency;
    const total = fees.reduce((a, f) => a + f.amountMinor, 0);
    const postings: Posting[] = [{ accountId: (await this.accounts.orgPayable(org.id, ccy)).id, amount: total }];
    for (const f of fees) postings.push({ accountId: (await this.accounts.partyPayable(org.id, f.partyId, ccy)).id, amount: -f.amountMinor });
    const res = await this.ledger.post({ idempotencyKey: `cohort:${event.id}:instructor_fees`, currency: ccy, description: `Instructor fees for ${event.name}`, postings, metadata: { eventId: event.id, organizationId: org.id } });
    if (!res.created) return 0;
    for (const f of fees) {
      const party = await this.repos.parties.get(f.partyId);
      if (!party?.paymentsAccountRef) continue;
      try {
        await this.payments.createTransfer({ idempotencyKey: `transfer:cohort:${event.id}:${f.partyId}`, paymentRef: "", destinationAccountRef: party.paymentsAccountRef, amountMinor: f.amountMinor, currency: ccy, transferGroup: event.id });
      } catch (err) {
        this.onHookFailure({ hook: "orderPaid", orderId: event.id, error: `instructor fee transfer failed: ${(err as Error).message}`, at: this.clock.now() });
      }
    }
    return total;
  }

  /**
   * Getting paid before delivery (Protected mode): the held organizer share of a class that
   * hasn't ended, less the early-release fee. Offered once the organizer has delivered a class
   * through EnrollClass, since EnrollClass then carries the refunds if the class is cancelled.
   */
  async earlyReleaseQuote(organizationId: string, eventId: string): Promise<{ eligible: boolean; reason?: string; currency: string; heldMinor: number; feeMinor: number; netMinor: number }> {
    const org = await this.getOrganization(organizationId);
    const event = await this.getEvent(organizationId, eventId);
    const orders = (await this.repos.orders.listByOrganization(organizationId, 10_000)).filter((o) => o.eventId === eventId && o.fundsStatus === "held");
    const held = orders.reduce((a, o) => a + o.heldMinor, 0);
    const fee = earlyReleaseFee(held, event.currency);
    const base = { currency: event.currency, heldMinor: held, feeMinor: fee, netMinor: held - fee };
    if (event.status === "cancelled") return { ...base, eligible: false, reason: "the class was cancelled" };
    if ((event.endsAt ?? event.startsAt) <= this.clock.now()) return { ...base, feeMinor: 0, netMinor: held, eligible: false, reason: "the class is over: release it for free" };
    if (held <= 0) return { ...base, eligible: false, reason: "nothing is held for this class" };
    const track = (await this.repos.orders.listByOrganization(organizationId, 10_000)).some((o) => o.fundsStatus === "released" && o.settlement !== "direct" && o.paidAt && o.releasedAt && o.releasedAt.getTime() - o.paidAt.getTime() > 0);
    const delivered = track && (await this.repos.events.listByOrganization(organizationId)).some((e) => e.status === "ended");
    if (!delivered) return { ...base, eligible: false, reason: `available once ${org.name} has delivered a class through EnrollClass` };
    return { ...base, eligible: true };
  }

  async releaseEventEarly(organizationId: string, eventId: string): Promise<{ released: number; amountMinor: number; feeMinor: number }> {
    const quote = await this.earlyReleaseQuote(organizationId, eventId);
    if (!quote.eligible) throw new DomainError("INVALID_STATE", `early release isn't available: ${quote.reason}`);
    const org = await this.getOrganization(organizationId);
    const orders = (await this.repos.orders.listByOrganization(organizationId, 10_000)).filter((o) => o.eventId === eventId && o.fundsStatus === "held" && o.heldMinor > 0);
    // Spread the fee over the orders by how much each holds.
    const fees = allocate(quote.feeMinor, orders.map((o) => o.heldMinor));
    let amount = 0;
    for (const [i, order] of orders.entries()) amount += await this.releaseOrder(order, org, fees[i] ?? 0);
    return { released: orders.length, amountMinor: amount - quote.feeMinor, feeMinor: quote.feeMinor };
  }

  /** Release every delivered cohort past its grace period; run from the scheduler. */
  async releaseDelivered(now = this.clock.now()): Promise<{ events: number; orders: number; amountMinor: number }> {
    let events = 0, orders = 0, amount = 0;
    for (const org of await this.repos.organizations.list()) {
      for (const event of await this.repos.events.listByOrganization(org.id)) {
        if (event.status !== "live" && event.status !== "ended") continue;
        const end = (event.endsAt ?? event.startsAt).getTime() + org.releaseGraceHours * 3_600_000;
        if (end > now.getTime()) continue;
        const r = await this.releaseEvent(org.id, event.id);
        if (r.released || event.status === "live") events += 1;
        orders += r.released;
        amount += r.amountMinor;
      }
    }
    return { events, orders, amountMinor: amount };
  }

  /** Release a specific cohort's held funds now (end of grace, or organizer-initiated early release). */
  async releaseEvent(organizationId: string, eventId: string): Promise<{ released: number; amountMinor: number }> {
    const org = await this.getOrganization(organizationId);
    const event = await this.getEvent(organizationId, eventId);
    if (event.status === "cancelled") throw new DomainError("INVALID_STATE", "cancelled cohorts refund instead of releasing");
    let released = 0, amount = 0, platformCollected = false;
    for (const order of await this.repos.orders.listByOrganization(organizationId, 10_000)) {
      if (order.eventId !== eventId) continue;
      if (order.settlement !== "direct" && order.pricing.totalMinor > 0 && order.status !== "pending" && order.status !== "failed") platformCollected = true;
      if (order.fundsStatus !== "held") continue;
      const fresh = (await this.repos.orders.get(order.id)) ?? order;
      amount += await this.releaseOrder(fresh, org);
      released += 1;
    }
    // Instructor fees are paid from money the platform holds; with Direct payments the organizer pays instructors.
    if (platformCollected || org.paymentMode !== "direct") await this.settleInstructorFees(event, org);
    if (event.status === "live" && (event.endsAt ?? event.startsAt) <= this.clock.now()) await this.repos.events.update({ ...event, status: "ended" });
    return { released, amountMinor: amount };
  }

  async setInstructorFees(organizationId: string, eventId: string, fees: Array<{ partyId: string; amountMinor: MinorUnits }>): Promise<Event> {
    const event = await this.getEvent(organizationId, eventId);
    for (const f of fees) {
      const party = await this.repos.parties.get(f.partyId);
      if (!party || party.organizationId !== organizationId) throw new DomainError("VALIDATION", `unknown party ${f.partyId}`);
      if (!Number.isSafeInteger(f.amountMinor) || f.amountMinor < 0) throw new DomainError("VALIDATION", "amountMinor must be a non-negative integer");
    }
    const updated: Event = { ...event, instructorFees: fees };
    await this.repos.events.update(updated);
    return updated;
  }

  async recordPayout(organizationId: string, input: { partyId?: string | undefined; currency: string; amountMinor: MinorUnits; method: PayoutMethod; reference?: string | undefined }): Promise<Payout> {
    const org = await this.getOrganization(organizationId);
    assertCurrency(input.currency);
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) throw new DomainError("VALIDATION", "amountMinor must be a positive integer");
    let payable;
    if (input.partyId) {
      const party = await this.repos.parties.get(input.partyId);
      if (!party || party.organizationId !== organizationId) throw notFound("party", input.partyId);
      payable = await this.accounts.partyPayable(org.id, party.id, input.currency);
    } else {
      payable = await this.accounts.orgPayable(org.id, input.currency);
    }
    const available = (await this.ledger.balance(payable.id)).natural;
    if (input.amountMinor > available) throw new DomainError("VALIDATION", `only ${available} ${input.currency} is payable`, "held funds release after delivery");
    const payout: Payout = { id: this.ids.next("po"), organizationId, ...(input.partyId ? { partyId: input.partyId } : {}), currency: input.currency, amountMinor: input.amountMinor, method: input.method, ...(input.reference ? { reference: input.reference } : {}), createdAt: this.clock.now() };
    await this.ledger.post({
      idempotencyKey: `payout:${payout.id}`, currency: input.currency, description: `Payout ${payout.id} (${input.method})`,
      postings: [{ accountId: payable.id, amount: input.amountMinor }, { accountId: (await this.accounts.bankClearing(input.currency)).id, amount: -input.amountMinor }],
      metadata: { payoutId: payout.id, organizationId, ...(input.partyId ? { partyId: input.partyId } : {}) },
    });
    await this.repos.payouts.create(payout);
    return payout;
  }

  listPayouts(organizationId: string): Promise<Payout[]> {
    return this.repos.payouts.listByOrganization(organizationId);
  }

  /** What is payable now and what is still held, for the organizer and each party. */
  async payables(organizationId: string) {
    const org = await this.getOrganization(organizationId);
    const balances = await this.ledger.balances({ tenantId: organizationId });
    const parties = new Map((await this.repos.parties.listByOrganization(organizationId)).map((p) => [p.id, p]));
    const items = new Map<string, { partyId: string | null; name: string; kind: string | null; currency: string; payableMinor: number; heldMinor: number }>();
    for (const b of balances) {
      const code = b.account.code;
      const m = code.match(/^(org|party):([^:]+):(payable|held):([A-Z]{3})$/);
      if (!m) continue;
      const [, scope, id, kind, ccy] = m as unknown as [string, string, string, string, string];
      const partyId = scope === "party" ? id : null;
      const key = `${partyId ?? "org"}:${ccy}`;
      const cur = items.get(key) ?? { partyId, name: partyId ? parties.get(partyId)?.name ?? partyId : org.name, kind: partyId ? parties.get(partyId)?.kind ?? null : null, currency: ccy, payableMinor: 0, heldMinor: 0 };
      if (kind === "payable") cur.payableMinor += b.natural; else cur.heldMinor += b.natural;
      items.set(key, cur);
    }
    return [...items.values()];
  }

  // ---------- Minimum enrolment and cohort cancellation ----------

  /** Flag cohorts below minimum enrolment at the decision point; run from the scheduler. */
  async reviewMinEnrollment(now = this.clock.now()): Promise<Event[]> {
    const flagged: Event[] = [];
    for (const org of await this.repos.organizations.list()) {
      for (const event of await this.repos.events.listByOrganization(org.id)) {
        if (event.status !== "live" || !event.minEnrollment || event.atRiskAt) continue;
        if (event.startsAt.getTime() - org.minEnrollmentDecisionDays * 86_400_000 > now.getTime()) continue;
        const confirmed = (await this.repos.seats.listByEvent(event.id)).filter((s) => s.status === "confirmed" || s.status === "reserved").length;
        if (confirmed >= event.minEnrollment) continue;
        const updated: Event = { ...event, atRiskAt: now };
        await this.repos.events.update(updated);
        flagged.push(updated);
        await this.runHooks("cohortAtRisk", event.id, (hook) => hook({ event: updated, organization: org, confirmed, minimum: event.minEnrollment! }));
      }
    }
    return flagged;
  }

  /** Cancel a cohort: refund every paid order in full (or move its seats to another cohort), void open invoices, clear the waitlist. */
  async cancelCohort(organizationId: string, eventId: string, input: { reason: string; transferToEventId?: string | undefined }): Promise<{ event: Event; refunded: number; transferred: number; voided: number }> {
    const org = await this.getOrganization(organizationId);
    const event = await this.getEvent(organizationId, eventId);
    if (event.status === "cancelled") throw new DomainError("INVALID_STATE", "cohort is already cancelled");
    if (!input.reason.trim()) throw new DomainError("VALIDATION", "reason is required");
    let target: Event | undefined;
    if (input.transferToEventId) {
      target = await this.getEvent(organizationId, input.transferToEventId);
      if (target.status !== "live" || target.courseId !== event.courseId || target.id === event.id) throw new DomainError("VALIDATION", "transfer target must be a live cohort of the same course");
    }
    let refunded = 0, transferred = 0, voided = 0;
    for (const order of await this.repos.orders.listByOrganization(organizationId, 10_000)) {
      if (order.eventId !== eventId) continue;
      if (order.status === "pending" && order.paymentMethod === "invoice") {
        const inv = await this.repos.invoices.getByOrder(order.id);
        if (inv && (inv.status === "issued" || inv.status === "partially_paid") && inv.paidMinor === 0) { await this.voidInvoice(organizationId, inv.id, input.reason); voided += 1; }
        continue;
      }
      if (order.status !== "paid" && order.status !== "partially_refunded") continue;
      const seats = (await this.repos.seats.listByOrder(order.id)).filter((s) => s.eventId === eventId && s.status === "confirmed");
      if (target) {
        const types = await this.repos.ticketTypes.listByEvent(target.id);
        const tt = types[0];
        if (!tt) throw new DomainError("INVALID_STATE", "transfer target has no ticket type");
        for (const seat of seats) {
          if (!(await this.repos.ticketTypes.reserve(tt.id, 1))) throw new DomainError("SOLD_OUT", `${target.name} cannot take all learners`, "pick another cohort or refund");
          const now = this.clock.now();
          const moved: Seat = { id: this.ids.next("seat"), organizationId, orderId: order.id, eventId: target.id, ticketTypeId: tt.id, attendee: seat.attendee, status: "confirmed", createdAt: now, confirmedAt: now, transferredFromSeatId: seat.id };
          await this.repos.seats.create(moved);
          await this.repos.seats.update({ ...seat, status: "transferred", transferredToSeatId: moved.id });
          transferred += 1;
          await this.runHooks("seatChanged", order.id, (hook) => hook({ kind: "transferred", seat: moved, previousSeat: seat }));
        }
        // The money follows the learners: re-point the order at the new cohort.
        await this.repos.orders.update({ ...((await this.repos.orders.get(order.id)) ?? order), eventId: target.id, ticketTypeId: tt.id });
      } else {
        const fresh = (await this.repos.orders.get(order.id)) ?? order;
        const refundable = fresh.pricing.totalMinor - fresh.refundedMinor;
        if (refundable > 0) { await this.refundOrder(organizationId, { orderId: order.id, amountMinor: refundable, reason: `cohort cancelled: ${input.reason}`, idempotencyKey: `refund:cohort:${eventId}:${order.id}` }); refunded += 1; }
      }
    }
    for (const entry of await this.repos.waitlist.listOpenByEvent(eventId)) {
      if (entry.status === "offered") await this.repos.ticketTypes.release(entry.ticketTypeId, entry.quantity);
      await this.repos.waitlist.update({ ...entry, status: "cancelled" });
    }
    const cancelled: Event = { ...event, status: "cancelled", cancelledAt: this.clock.now(), cancelReason: input.reason.trim() };
    await this.repos.events.update(cancelled);
    await this.runHooks("cohortCancelled", event.id, (hook) => hook({ event: cancelled, organization: org, target, refunded, transferred }));
    return { event: cancelled, refunded, transferred, voided };
  }

  // ---------- Revenue recognition ----------

  /** Revenue recognised on delivery: cohorts ending in the window count; paid cohorts ending later are deferred. */
  async revenueReport(organizationId: string, range: { from: Date; to: Date }) {
    await this.getOrganization(organizationId);
    const events = await this.repos.events.listByOrganization(organizationId);
    const orders = (await this.repos.orders.listByOrganization(organizationId, 100_000)).filter((o) => o.status === "paid" || o.status === "partially_refunded" || o.status === "refunded");
    const byEvent = new Map<string, Order[]>();
    for (const o of orders) byEvent.set(o.eventId, [...(byEvent.get(o.eventId) ?? []), o]);
    const byCurrency: Record<string, { recognizedMinor: number; deferredMinor: number; refundedMinor: number }> = {};
    const cohorts = [];
    for (const event of events) {
      const list = byEvent.get(event.id) ?? [];
      if (!list.length && event.status !== "cancelled") continue;
      const end = event.endsAt ?? event.startsAt;
      const recognized = event.status !== "cancelled" && end >= range.from && end <= range.to;
      const deferred = event.status !== "cancelled" && end > range.to;
      let gross = 0, fees = 0, tax = 0, net = 0, refunded = 0, seats = 0;
      const statuses = new Set<string>();
      for (const o of list) {
        gross += o.pricing.totalMinor; fees += o.pricing.platformFeeMinor; tax += o.pricing.taxMinor; net += o.pricing.organizerNetMinor; refunded += o.refundedMinor; seats += o.quantity;
        statuses.add(o.fundsStatus);
      }
      const instructorFees = (event.instructorFees ?? []).reduce((a, f) => a + f.amountMinor, 0);
      const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
      const fundsStatus: "held" | "released" | "mixed" | "none" = statuses.size === 0 ? "none" : statuses.size > 1 ? "mixed" : (statuses.values().next().value as "held" | "released" | "none");
      // Organizer net after refunds, pro rata to the organizer share of each refund.
      const netAfterRefunds = list.reduce((a, o) => a + o.pricing.organizerNetMinor - (o.pricing.totalMinor > 0 ? Math.round((o.refundedMinor * o.pricing.organizerNetMinor) / o.pricing.totalMinor) : 0), 0);
      const ccy = event.currency;
      byCurrency[ccy] ??= { recognizedMinor: 0, deferredMinor: 0, refundedMinor: 0 };
      if (recognized) byCurrency[ccy]!.recognizedMinor += netAfterRefunds - instructorFees;
      if (deferred) byCurrency[ccy]!.deferredMinor += netAfterRefunds;
      if (recognized || deferred) byCurrency[ccy]!.refundedMinor += refunded;
      cohorts.push({ eventId: event.id, name: event.name, courseName: course?.name ?? null, startsAt: event.startsAt, endsAt: event.endsAt ?? null, currency: ccy, status: event.status, seats, grossMinor: gross, platformFeeMinor: fees, taxMinor: tax, organizerNetMinor: net, refundedMinor: refunded, instructorFeesMinor: instructorFees, marginMinor: netAfterRefunds - instructorFees, fundsStatus, recognized });
    }
    cohorts.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return { from: range.from, to: range.to, byCurrency, cohorts };
  }

  // ---------- Public (buyer-facing) reads ----------

  /** Order status for the buyer who placed it: id + buyer email act as the credential. */
  async publicOrder(orderId: string, buyerEmail: string): Promise<Order> {
    const o = await this.repos.orders.get(orderId);
    if (!o || o.buyerEmail.toLowerCase() !== buyerEmail.trim().toLowerCase()) throw notFound("order", orderId);
    return o;
  }

  /** Everything needed to render a seat's calendar or ticket; seat ids are unguessable. */
  async publicSeat(seatId: string): Promise<{ seat: Seat; event: Event; course?: Course | undefined; organization: Organization }> {
    const seat = await this.repos.seats.get(seatId);
    if (!seat) throw notFound("seat", seatId);
    const event = await this.repos.events.get(seat.eventId);
    if (!event) throw notFound("event", seat.eventId);
    const organization = await this.getOrganization(seat.organizationId);
    const course = event.courseId ? await this.repos.courses.get(event.courseId) : undefined;
    return { seat, event, course, organization };
  }

  // ---------- Reporting ----------

  async balancesFor(organizationId: string) {
    const all = await this.ledger.balances();
    return all
      .filter((b) => b.account.tenantId === organizationId)
      .map((b) => ({ code: b.account.code, name: b.account.name, type: b.account.type, currency: b.currency, balanceMinor: b.natural }));
  }

  async platformBalances() {
    const all = await this.ledger.balances({ tenantId: "platform" });
    return all.map((b) => ({ code: b.account.code, name: b.account.name, type: b.account.type, currency: b.currency, balanceMinor: b.natural }));
  }
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function validatePriceList(prices: Record<string, MinorUnits> | undefined): Record<string, MinorUnits> | undefined {
  if (!prices) return undefined;
  const out: Record<string, MinorUnits> = {};
  for (const [ccy, amount] of Object.entries(prices)) {
    assertCurrency(ccy, `price list currency ${ccy}`);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new DomainError("VALIDATION", `price for ${ccy} must be a non-negative integer`);
    out[ccy] = amount;
  }
  return Object.keys(out).length ? out : undefined;
}

function validatePolicy(p: ChangePolicy): void {
  const nonNeg = (v: number, name: string) => { if (!Number.isFinite(v) || v < 0) throw new DomainError("VALIDATION", `${name} must be >= 0`); };
  nonNeg(p.transferFreeUntilDays, "transferFreeUntilDays"); nonNeg(p.transferCutoffDays, "transferCutoffDays"); nonNeg(p.cancelFullRefundUntilDays, "cancelFullRefundUntilDays");
  nonNeg(p.cancelNoRefundWithinDays, "cancelNoRefundWithinDays"); nonNeg(p.substituteCutoffHours, "substituteCutoffHours"); nonNeg(p.waitlistOfferHours, "waitlistOfferHours");
  if (p.transferFeeBps < 0 || p.transferFeeBps > 10_000) throw new DomainError("VALIDATION", "transferFeeBps must be 0..10000");
  if (p.cancelPartialRefundBps < 0 || p.cancelPartialRefundBps > 10_000) throw new DomainError("VALIDATION", "cancelPartialRefundBps must be 0..10000");
  if (p.cancelNoRefundWithinDays > p.cancelFullRefundUntilDays) throw new DomainError("VALIDATION", "cancelNoRefundWithinDays must not exceed cancelFullRefundUntilDays");
}
