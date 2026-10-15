import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { InMemoryNotifier, sequenceHooks } from "./notifications.js";
import { rosterCsv, splitName, stepDueAt, ROSTER_FORMATS } from "./delivery.js";
import type { MeetingProvider } from "./ports.js";

let core: Core;
let payments: FakePaymentsAdapter;
let notifier: InMemoryNotifier;
let now: Date;
let participants: Array<{ email?: string; name?: string; joinedAt: Date; leftAt: Date; durationMinutes: number }> = [];

const zoom: MeetingProvider = {
  provider: "zoom",
  async createMeeting(req) { return { provider: "zoom", meetingId: `z-${req.externalId}`, joinUrl: "https://zoom.us/j/123", hostUrl: "https://zoom.us/s/123", passcode: "9999" }; },
  async getParticipants() { return participants; },
};

beforeEach(() => {
  now = new Date("2026-10-15T12:00:00Z");
  payments = new FakePaymentsAdapter();
  notifier = new InMemoryNotifier();
  participants = [];
  core = new Core({
    repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock: { now: () => now }, meetings: { zoom },
    hooks: [sequenceHooks(notifier, { fromName: "Agile Agilist", certificateUrl: (c) => `https://api.test/public/v1/certificates/${c}/view`, seatUrl: (id, e) => `https://app.test/my/seat/${id}?email=${e}` })],
  });
});

async function cohort() {
  const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Agile Agilist", country: "CA", currency: "CAD" });
  const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe" });
  await core.updateCourse(org.id, course.id, { prework: "Watch the 20-minute SAFe overview and read the exam guide.", surveyUrl: "https://forms.example/survey" });
  const ev = await core.createEvent(org.id, { courseId: course.id, name: "Nov 20-21", timezone: "America/Toronto", sessions: [
    { startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z"), title: "Day 1" },
    { startsAt: new Date("2026-11-21T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z"), title: "Day 2" },
  ] });
  const tt = await core.createTicketType(org.id, ev.id, { name: "Std", priceMinor: 100_000, quantity: 10 });
  const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 3, buyerEmail: "b@co.com", attendees: [{ email: "ada@co.com", name: "Ada Lovelace" }, { email: "alan@co.com", name: "Alan Turing" }, { email: "grace@co.com", name: "Grace Hopper" }] });
  await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
  notifier.sent.length = 0;
  return { org, course, ev, tt, order };
}

describe("meetings and attendance", () => {
  it("creates a Zoom meeting from the cohort and syncs attendance from the participant report", async () => {
    const { org, ev } = await cohort();
    const withMeeting = await core.setMeeting(org.id, ev.id, { provider: "zoom" });
    expect(withMeeting.meeting).toMatchObject({ provider: "zoom", meetingId: `z-${ev.id}`, passcode: "9999" });
    participants = [
      { email: "ADA@co.com", joinedAt: new Date("2026-11-20T13:55:00Z"), leftAt: new Date("2026-11-20T22:05:00Z"), durationMinutes: 490 },
      { email: "ada@co.com", joinedAt: new Date("2026-11-21T14:00:00Z"), leftAt: new Date("2026-11-21T22:00:00Z"), durationMinutes: 480 },
      { email: "alan@co.com", joinedAt: new Date("2026-11-20T14:00:00Z"), leftAt: new Date("2026-11-20T22:00:00Z"), durationMinutes: 480 },
      { email: "grace@co.com", joinedAt: new Date("2026-11-20T14:00:00Z"), leftAt: new Date("2026-11-20T14:20:00Z"), durationMinutes: 20 },
      { name: "Phone user", joinedAt: new Date("2026-11-20T14:00:00Z"), leftAt: new Date("2026-11-20T15:00:00Z"), durationMinutes: 60 },
    ];
    const r = await core.syncAttendance(org.id, ev.id);
    expect(r.updated).toBe(3);
    const by = Object.fromEntries(r.items.map((i) => [i.email, i]));
    expect(by["ada@co.com"]).toMatchObject({ status: "present", minutes: 960, sessionsAttended: 2, source: "provider" });
    expect(by["alan@co.com"]).toMatchObject({ status: "partial", minutes: 480, sessionsAttended: 1 });
    expect(by["grace@co.com"]).toMatchObject({ status: "absent", minutes: 20, sessionsAttended: 0 });
    // Manual override wins over later syncs.
    await core.setAttendance(org.id, ev.id, { seatId: by["grace@co.com"]!.seatId, status: "present" });
    const again = await core.syncAttendance(org.id, ev.id);
    expect(again.items.find((i) => i.email === "grace@co.com")).toMatchObject({ status: "present", source: "manual" });
  });
  it("manual links work without a provider; unknown providers fail clearly", async () => {
    const { org, ev } = await cohort();
    await expect(core.setMeeting(org.id, ev.id, { provider: "teams" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    await expect(core.setMeeting(org.id, ev.id, { provider: "manual", joinUrl: "nope" })).rejects.toMatchObject({ code: "VALIDATION" });
    const m = await core.setMeeting(org.id, ev.id, { provider: "manual", joinUrl: "https://teams.microsoft.com/l/x", passcode: "1" });
    expect(m.meeting?.provider).toBe("manual");
    await expect(core.syncAttendance(org.id, ev.id)).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});

describe("certificates", () => {
  it("issues once per seat, optionally only to present learners, emails them, and verifies publicly", async () => {
    const { org, ev } = await cohort();
    const seats = await core.listSeats(org.id, { eventId: ev.id });
    await core.setAttendance(org.id, ev.id, { seatId: seats[0]!.id, status: "present" });
    const first = await core.issueCertificates(org.id, ev.id, { onlyPresent: true });
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ attendeeName: "Ada Lovelace", courseName: "Leading SAFe" });
    expect(notifier.sent[0]?.subject).toContain("certificate of completion");
    expect(notifier.sent[0]?.text).toContain(`/public/v1/certificates/${first[0]!.verifyCode}/view`);
    const rest = await core.issueCertificates(org.id, ev.id);
    expect(rest).toHaveLength(2);
    expect(await core.issueCertificates(org.id, ev.id)).toEqual([]);
    expect((await core.listCertificates(org.id, ev.id))).toHaveLength(3);
    const v = await core.verifyCertificate(first[0]!.verifyCode);
    expect(v.valid).toBe(true);
    expect(v.organizationName).toBe("Agile Agilist");
    expect((await core.verifyCertificate("nope")).valid).toBe(false);
  });
});

describe("roster formats", () => {
  it("splits names and renders the certification body formats", async () => {
    expect(splitName("Ada Augusta Lovelace")).toEqual({ first: "Ada Augusta", last: "Lovelace" });
    expect(splitName("Cher")).toEqual({ first: "Cher", last: "" });
    const { org, ev } = await cohort();
    const safe = await core.roster(org.id, ev.id, "safe_studio");
    expect(safe.count).toBe(3);
    expect(safe.csv.split("\r\n")[0]).toBe('"First Name","Last Name","Email","Company"');
    expect(safe.csv.split("\r\n")[1]).toBe('"Ada","Lovelace","ada@co.com",""');
    const scrum = await core.roster(org.id, ev.id, "scrum_org");
    expect(scrum.csv.split("\r\n")[0]).toBe('"FirstName","LastName","Email"');
    await expect(core.roster(org.id, ev.id, "nope")).rejects.toMatchObject({ code: "VALIDATION" });
    expect(rosterCsv([], { ...ev }, ROSTER_FORMATS.default!).split("\r\n")).toHaveLength(2);
  });
});

describe("email sequences", () => {
  it("sends each due step once per learner with the right content, in cohort order", async () => {
    const { org, ev } = await cohort();
    await core.setMeeting(org.id, ev.id, { provider: "zoom" });
    expect(stepDueAt("prework_t14", ev).toISOString()).toBe("2026-11-06T14:00:00.000Z");
    expect(stepDueAt("survey", ev).toISOString()).toBe("2026-11-22T00:00:00.000Z");
    // Nothing due yet on Oct 15.
    expect((await core.runSequences()).sent).toBe(0);
    now = new Date("2026-11-07T00:00:00Z");
    const r1 = await core.runSequences();
    expect(r1.sent).toBe(3);
    expect(r1.details.every((d) => d.step === "prework_t14")).toBe(true);
    expect(notifier.sent[0]?.subject).toContain("Pre-work");
    expect(notifier.sent[0]?.text).toContain("Watch the 20-minute SAFe overview");
    expect((await core.runSequences()).sent).toBe(0); // idempotent
    now = new Date("2026-11-20T13:00:00Z");
    const r2 = await core.runSequences();
    expect(r2.details.map((d) => d.step).filter((s, i, a) => a.indexOf(s) === i).sort()).toEqual(["day_of", "reminder_t1", "reminder_t7"]);
    const dayOf = notifier.sent.find((m) => m.subject.startsWith("Today:"))!;
    expect(dayOf.text).toContain("https://zoom.us/j/123");
    expect(dayOf.text).toContain("passcode 9999");
    now = new Date("2026-11-22T06:00:00Z");
    const r3 = await core.runSequences();
    expect(r3.details.every((d) => d.step === "survey")).toBe(true);
    expect(notifier.sent.at(-1)?.text).toContain("https://forms.example/survey");
    expect((await core.listMessages(org.id, ev.id)).length).toBe(15);
    // After the window nothing more is sent.
    now = new Date("2026-12-15T00:00:00Z");
    expect((await core.runSequences()).sent).toBe(0);
  });
});
