import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { homeSummary } from "./home.js";

describe("instructor control", () => {
  it("drafts wait for approval, can be assigned and published, and Home lists them for managers", async () => {
    const payments = new FakePaymentsAdapter();
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock: { now: () => new Date("2026-10-01T12:00:00Z") } });
    const { organization: org } = await core.createOrganization({ name: "A", country: "CA", currency: "CAD" });
    await core.connectPayments(org.id);
    expect((await core.updateInstructorAccess(org.id, { publish: "approval" })).instructorAccess).toEqual({ scope: "own", publish: "approval" });
    await expect(core.updateInstructorAccess(org.id, { scope: "some" as "own" })).rejects.toThrow(/unknown/);

    const pat = await core.createParty(org.id, { name: "Pat", kind: "instructor" });
    const venue = await core.createParty(org.id, { name: "Hall", kind: "venue" });
    const draft = await core.createEvent(org.id, { name: "Draft class", startsAt: new Date("2026-11-02T14:00:00Z"), instructorIds: [pat.id], status: "draft" });
    const tt = await core.createTicketType(org.id, draft.id, { name: "Seat", priceMinor: 1000, quantity: 5 });
    await expect(core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@x.co" })).rejects.toThrow(/draft/);

    const home = await homeSummary(core, org.id, { money: false, settings: true, now: new Date("2026-10-01T12:00:00Z") });
    expect(home.attention.find((a) => a.kind === "approval")).toMatchObject({ id: `approval:${draft.id}`, title: "Approve · Draft class" });
    const other = await core.createEvent(org.id, { name: "Not mine", startsAt: new Date("2026-11-03T14:00:00Z") });
    const mine = await homeSummary(core, org.id, { money: false, settings: false, eventFilter: (e) => e.instructorIds.includes(pat.id) });
    expect(mine.setup.steps.find((s) => s.key === "cohort")!.done).toBe(true);
    expect(mine.attention.some((a) => a.title.includes("Not mine"))).toBe(false);

    await expect(core.setEventInstructors(org.id, other.id, [venue.id])).rejects.toThrow(/unknown instructor/);
    expect((await core.setEventInstructors(org.id, other.id, [pat.id, pat.id])).instructorIds).toEqual([pat.id]);
    expect((await core.publishEvent(org.id, draft.id)).status).toBe("live");
    await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@x.co" });
  });
});
