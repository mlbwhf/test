import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { inferCategory } from "./categories.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;
let now: Date;

beforeEach(() => {
  now = new Date("2026-10-01T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, clock: { now: () => now } });
});

async function course(orgId: string, slug: string, name: string, opts: { category?: string; live?: boolean } = {}) {
  const c = await core.createCourse(orgId, { slug, name, ...(opts.category ? { category: opts.category } : {}) });
  if (opts.live !== false) {
    const ev = await core.createEvent(orgId, { name: "Nov", courseId: c.id, sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z") }] });
    await core.createTicketType(orgId, ev.id, { name: "Seat", priceMinor: 50_000, quantity: 10 });
    await core.publishEvent(orgId, ev.id);
  }
  return c;
}

async function org(name = "Agile Agilist") {
  const { organization } = await core.createOrganization({ name, country: "US", currency: "USD" });
  return organization;
}

describe("categories", () => {
  it("guesses a topic from the course name and certification body", () => {
    expect(inferCategory("Leading SAFe 6.0")).toBe("agile");
    expect(inferCategory("AI-Empowered SAFe Release Train Engineer")).toBe("agile");
    expect(inferCategory("SAFe POPM")).toBe("product");
    expect(inferCategory("PMP Exam Prep", "PMI")).toBe("project-management");
    expect(inferCategory("ITIL 4 Foundation")).toBe("it-service");
    expect(inferCategory("CISSP Boot Camp")).toBe("security");
    expect(inferCategory("Lean Six Sigma Green Belt")).toBe("quality");
    expect(inferCategory("Pottery for beginners")).toBe("other");
  });

  it("organizer's choice wins over the guess; unknown topics are rejected", async () => {
    const o = await org();
    const c = await course(o.id, "safe", "Leading SAFe", { category: "leadership" });
    await course(o.id, "pmp", "PMP Exam Prep");
    const cat = await core.publicCatalog();
    expect(cat.find((x) => x.slug === "safe")!.category).toBe("leadership");
    expect(cat.find((x) => x.slug === "pmp")!.category).toBe("project-management");
    await expect(core.updateCourse(o.id, c.id, { category: "cooking" })).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await core.updateCourse(o.id, c.id, { category: null })).category).toBeUndefined();
  });
});

describe("promotions", () => {
  it("goes live when paid, books the fee as revenue, and ends after the paid weeks", async () => {
    const o = await org();
    const c = await course(o.id, "safe", "Leading SAFe");
    expect(core.promotionPrices("USD")).toEqual({ currency: "USD", weeks: [1, 2, 4], category: [2_900, 5_800, 8_700], top: [7_900, 15_800, 23_700] });
    const { promotion, clientSecret } = await core.createPromotion(o.id, { courseId: c.id, placement: "top", weeks: 2, payerEmail: "owner@a.co" });
    expect(clientSecret).toBeTruthy();
    expect(promotion).toMatchObject({ status: "pending_payment", amountMinor: 15_800, currency: "USD" });
    expect((await core.publicCatalog())[0]!.promoted).toBeNull();

    await core.handlePaymentEvent(payments.succeed(promotion.paymentRef!, 15_800, "USD"));
    const [live] = await core.listPromotions(o.id);
    expect(live).toMatchObject({ status: "active", startsAt: now, endsAt: new Date("2026-10-15T12:00:00Z") });
    expect((await core.publicCatalog())[0]!.promoted).toBe("top");
    const fees = (await core.platformBalances()).find((b) => b.code === codes.feeRevenue("USD"))!.balanceMinor;
    expect(fees).toBe(15_800);
    await ledger.assertBalanced();

    now = new Date("2026-10-15T12:00:01Z");
    expect((await core.publicCatalog())[0]!.promoted).toBeNull();
  });

  it("needs a listed organizer and an upcoming class; a failed payment never goes live", async () => {
    const o = await org();
    const empty = await course(o.id, "draft", "Draft course", { live: false });
    await expect(core.createPromotion(o.id, { courseId: empty.id, placement: "category", weeks: 1 })).rejects.toMatchObject({ code: "INVALID_STATE" });
    const c = await course(o.id, "safe", "Leading SAFe");
    await expect(core.createPromotion(o.id, { courseId: c.id, placement: "category", weeks: 3 })).rejects.toMatchObject({ code: "VALIDATION" });
    const { promotion } = await core.createPromotion(o.id, { courseId: c.id, placement: "category", weeks: 1 });
    await core.handlePaymentEvent(payments.fail(promotion.paymentRef!));
    expect((await core.listPromotions(o.id))[0]!.status).toBe("failed");
    await core.updateOrganization(o.id, { marketplaceListing: false });
    await expect(core.createPromotion(o.id, { courseId: c.id, placement: "category", weeks: 1 })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("limits category spots per topic, not across topics", async () => {
    const o = await org();
    for (let i = 0; i < 3; i++) {
      const c = await course(o.id, `safe-${i}`, `Leading SAFe ${i}`);
      const { promotion } = await core.createPromotion(o.id, { courseId: c.id, placement: "category", weeks: 1 });
      await core.handlePaymentEvent(payments.succeed(promotion.paymentRef!, 2_900, "USD"));
    }
    const fourth = await course(o.id, "safe-4", "Leading SAFe 4");
    await expect(core.createPromotion(o.id, { courseId: fourth.id, placement: "category", weeks: 1 })).rejects.toMatchObject({ code: "CONFLICT" });
    const pmp = await course(o.id, "pmp", "PMP Exam Prep");
    await expect(core.createPromotion(o.id, { courseId: pmp.id, placement: "category", weeks: 1 })).resolves.toBeTruthy();
  });
});
