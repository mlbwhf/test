import { describe, expect, it } from "vitest";
import { InMemoryCrm } from "./memory.js";
import { CrmSync } from "./sync.js";

const NOW = new Date("2026-10-15T09:30:00.000Z");

function paidInput() {
  return {
    orderId: "ord_42",
    buyerEmail: "buyer@acme.test",
    attendees: [
      { email: "ada@acme.test", name: "Ada Lovelace" },
      { email: "charles@other.test", name: "Charles", company: "Difference Ltd" },
    ],
    amountMinor: 259800,
    currency: "GBP",
    courseName: "Applied Maths",
    cohortName: "Autumn 2026",
    cohortStartsAt: new Date("2026-11-02T09:00:00.000Z"),
    organizationName: "Acme Training",
  };
}

describe("CrmSync.onOrderPaid", () => {
  it("creates buyer + attendees as contacts and one paid deal", async () => {
    const crm = new InMemoryCrm();
    const sync = new CrmSync(crm, { now: () => NOW });

    const result = await sync.onOrderPaid(paidInput());
    expect(result.contacts).toBe(3);
    expect(crm.contacts.size).toBe(3);
    expect(crm.deals.size).toBe(1);

    const buyer = crm.contacts.get("buyer@acme.test")!;
    expect(buyer.company).toBe("Acme Training");
    expect(buyer.properties).toEqual({ gate_last_course: "Applied Maths", gate_last_cohort_start: "2026-11-02" });

    const ada = crm.contacts.get("ada@acme.test")!;
    expect(ada.firstName).toBe("Ada");
    expect(ada.lastName).toBe("Lovelace");
    expect(ada.company).toBe("Acme Training");
    expect(ada.properties?.["gate_last_cohort_start"]).toBe("2026-11-02");

    const charles = crm.contacts.get("charles@other.test")!;
    expect(charles.firstName).toBe("Charles");
    expect(charles.lastName).toBeUndefined();
    expect(charles.company).toBe("Difference Ltd");

    const deal = crm.deals.get("ord_42")!;
    expect(deal.id).toBe(result.dealId);
    expect(deal.name).toBe("Applied Maths — Autumn 2026 — buyer@acme.test");
    expect(deal.stage).toBe("paid");
    expect(deal.amountMinor).toBe(259800);
    expect(deal.currency).toBe("GBP");
    expect(deal.closeDate).toEqual(NOW);
    expect(deal.contactEmail).toBe("buyer@acme.test");
    expect(deal.contactId).toBe(buyer.id);
  });

  it("does not double-count a buyer who is also an attendee", async () => {
    const crm = new InMemoryCrm();
    const sync = new CrmSync(crm, { now: () => NOW });
    const input = paidInput();
    input.attendees.push({ email: "BUYER@acme.test", name: "Buyer Person" });
    const result = await sync.onOrderPaid(input);
    expect(result.contacts).toBe(3);
    expect(crm.contacts.size).toBe(3);
  });

  it("is idempotent for the same order", async () => {
    const crm = new InMemoryCrm();
    const sync = new CrmSync(crm, { now: () => NOW });
    const a = await sync.onOrderPaid(paidInput());
    const b = await sync.onOrderPaid(paidInput());
    expect(b.dealId).toBe(a.dealId);
    expect(crm.deals.size).toBe(1);
    expect(crm.contacts.size).toBe(3);
  });
});

describe("CrmSync.onOrderRefunded", () => {
  it("flips the stage to refunded on a full refund", async () => {
    const crm = new InMemoryCrm();
    const sync = new CrmSync(crm, { now: () => NOW });
    const paid = await sync.onOrderPaid(paidInput());

    const refunded = await sync.onOrderRefunded({
      orderId: "ord_42",
      fully: true,
      buyerEmail: "buyer@acme.test",
      courseName: "Applied Maths",
      cohortName: "Autumn 2026",
      amountMinor: 259800,
      currency: "GBP",
    });
    expect(refunded.dealId).toBe(paid.dealId);
    const deal = crm.deals.get("ord_42")!;
    expect(deal.stage).toBe("refunded");
    expect(deal.properties?.["gate_refunded_minor"]).toBe("259800");
    expect(deal.closeDate).toEqual(NOW);
  });

  it("keeps the stage paid on a partial refund but records the refunded amount", async () => {
    const crm = new InMemoryCrm();
    const sync = new CrmSync(crm, { now: () => NOW });
    await sync.onOrderPaid(paidInput());

    await sync.onOrderRefunded({
      orderId: "ord_42",
      fully: false,
      buyerEmail: "buyer@acme.test",
      courseName: "Applied Maths",
      cohortName: "Autumn 2026",
      amountMinor: 259800,
      currency: "GBP",
      refundedMinor: 129900,
    });
    const deal = crm.deals.get("ord_42")!;
    expect(deal.stage).toBe("paid");
    expect(deal.amountMinor).toBe(259800);
    expect(deal.properties?.["gate_refunded_minor"]).toBe("129900");
  });

  it("propagates CRM errors", async () => {
    const crm = new InMemoryCrm();
    crm.upsertDeal = async () => { throw new Error("boom"); };
    const sync = new CrmSync(crm);
    await expect(sync.onOrderPaid(paidInput())).rejects.toThrow("boom");
  });
});
