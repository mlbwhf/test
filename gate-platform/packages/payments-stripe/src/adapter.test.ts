import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { mapStripeEvent, StripePaymentsAdapter } from "./adapter.js";

function fakeStripe() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const rec = (method: string, ret: unknown) => async (...args: unknown[]) => { calls.push({ method, args }); return ret; };
  const stripe = {
    accounts: {
      create: rec("accounts.create", { id: "acct_123" }),
      retrieve: rec("accounts.retrieve", { id: "acct_123", charges_enabled: false, payouts_enabled: false, details_submitted: false, requirements: { currently_due: ["external_account", "individual.dob.day"], past_due: ["external_account"], disabled_reason: "requirements.past_due" } }),
    },
    accountLinks: { create: rec("accountLinks.create", { url: "https://connect.stripe.com/setup/x" }) },
    paymentIntents: {
      create: rec("paymentIntents.create", { id: "pi_1", client_secret: "pi_1_secret_a", status: "requires_payment_method" }),
      retrieve: rec("paymentIntents.retrieve", { id: "pi_1", latest_charge: "ch_1" }),
    },
    transfers: { create: rec("transfers.create", { id: "tr_1" }) },
    refunds: { create: rec("refunds.create", { id: "re_1", status: "succeeded" }) },
    webhooks: new Stripe("sk_test_placeholder").webhooks,
  } as unknown as Stripe;
  return { stripe, calls };
}

const config = { onboardingReturnUrl: "https://app.test/return", onboardingRefreshUrl: "https://app.test/refresh", webhookSecret: "whsec_test" };

describe("StripePaymentsAdapter", () => {
  it("creates an Express connected account with platform liability and an onboarding link", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    const res = await a.createConnectedAccount({ organizationId: "org_1", country: "US", businessName: "Agile Agilist" });
    expect(res).toEqual({ accountRef: "acct_123", onboardingUrl: "https://connect.stripe.com/setup/x" });
    const [params, opts] = calls[0]!.args as [Record<string, unknown>, Record<string, unknown>];
    expect(params.type).toBeUndefined();
    expect(params.controller).toEqual({
      fees: { payer: "application" },
      losses: { payments: "application" },
      requirement_collection: "stripe",
      stripe_dashboard: { type: "express" },
    });
    expect((params.business_profile as { mcc: string }).mcc).toBe("8299");
    expect(params.country).toBe("US");
    expect(opts.idempotencyKey).toBe("acct:org_1");
  });

  it("creates a payment intent in the transfer group with idempotency", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    const res = await a.createPayment({ orderId: "ord_1", amountMinor: 10_000, currency: "USD", transferGroup: "ord_1", buyerEmail: "a@b.co", metadata: { orderId: "ord_1" } });
    expect(res).toEqual({ paymentRef: "pi_1", clientSecret: "pi_1_secret_a", status: "requires_payment" });
    const [params, opts] = calls[0]!.args as [Record<string, unknown>, Record<string, unknown>];
    expect(params).toMatchObject({ amount: 10_000, currency: "usd", transfer_group: "ord_1", receipt_email: "a@b.co" });
    expect(opts.idempotencyKey).toBe("pi:ord_1");
  });

  it("ties transfers to the charge and reverses transfers on refund", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    await a.createTransfer({ idempotencyKey: "t1", paymentRef: "pi_1", destinationAccountRef: "acct_v", amountMinor: 500, currency: "USD", transferGroup: "ord_1" });
    const t = calls.find((c) => c.method === "transfers.create")!.args[0] as Record<string, unknown>;
    expect(t).toMatchObject({ amount: 500, destination: "acct_v", source_transaction: "ch_1", transfer_group: "ord_1" });
    const r = await a.refund({ idempotencyKey: "r1", paymentRef: "pi_1", amountMinor: 500, reason: "customer asked" });
    expect(r).toEqual({ refundRef: "re_1", status: "succeeded" });
    const rp = calls.find((c) => c.method === "refunds.create")!.args[0] as Record<string, unknown>;
    expect(rp).toMatchObject({ payment_intent: "pi_1", amount: 500, reason: "requested_by_customer", reverse_transfer: true });
  });

  it("Direct mode: the organizer's own full-dashboard account that pays its own fees and carries losses", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    await a.createConnectedAccount({ organizationId: "org_1", country: "US", businessName: "Agile Agilist", mode: "direct" });
    const [params, opts] = calls[0]!.args as [Record<string, unknown>, Record<string, unknown>];
    expect(params.controller).toEqual({ fees: { payer: "account" }, losses: { payments: "stripe" }, requirement_collection: "stripe", stripe_dashboard: { type: "full" } });
    expect(opts.idempotencyKey).toBe("acct:direct:org_1");
  });

  it("Direct mode: charges on the organizer's account with an application fee and refunds there", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    await a.createPayment({ orderId: "ord_1", amountMinor: 129_500, currency: "USD", transferGroup: "ord_1", buyerEmail: "a@b.co", metadata: { orderId: "ord_1" }, direct: { accountRef: "acct_org", applicationFeeMinor: 1_993 } });
    const [params, opts] = calls[0]!.args as [Record<string, unknown>, Record<string, unknown>];
    expect(params).toMatchObject({ amount: 129_500, currency: "usd", application_fee_amount: 1_993 });
    expect(params.transfer_group).toBeUndefined();
    expect(opts).toEqual({ idempotencyKey: "pi:ord_1", stripeAccount: "acct_org" });
    await a.createPayment({ orderId: "ord_2", amountMinor: 2_000, currency: "USD", transferGroup: "ord_2", buyerEmail: "a@b.co", metadata: {}, direct: { accountRef: "acct_org", applicationFeeMinor: 0 } });
    expect((calls[1]!.args[0] as Record<string, unknown>).application_fee_amount).toBeUndefined();

    await a.refund({ idempotencyKey: "r1", paymentRef: "pi_1", amountMinor: 500, reason: "customer asked", accountRef: "acct_org" });
    const [rp, ro] = calls.find((c) => c.method === "refunds.create")!.args as [Record<string, unknown>, Record<string, unknown>];
    expect(rp).toMatchObject({ payment_intent: "pi_1", amount: 500, refund_application_fee: true });
    expect(rp.reverse_transfer).toBeUndefined();
    expect(ro).toEqual({ idempotencyKey: "r1", stripeAccount: "acct_org" });
  });

  it("verifies webhook signatures and maps events", () => {
    const { stripe } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    const payload = JSON.stringify({
      id: "evt_1", object: "event", type: "payment_intent.succeeded",
      data: { object: { id: "pi_1", object: "payment_intent", amount_received: 10_000, currency: "usd" } },
    });
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });
    expect(a.parseWebhook(payload, sig)).toEqual({ type: "payment.succeeded", paymentRef: "pi_1", amountMinor: 10_000, currency: "USD", providerEventId: "evt_1" });
    expect(() => a.parseWebhook(payload, "t=1,v1=bad")).toThrow();
  });

  it("maps failures, refunds and unknown events", () => {
    const failed = mapStripeEvent({ id: "evt_2", type: "payment_intent.payment_failed", data: { object: { id: "pi_2", last_payment_error: { message: "Your card was declined." } } } } as unknown as Stripe.Event);
    expect(failed).toMatchObject({ type: "payment.failed", paymentRef: "pi_2", reason: "Your card was declined." });
    const refunded = mapStripeEvent({ id: "evt_3", type: "refund.updated", data: { object: { id: "re_9", status: "succeeded", amount: 100, payment_intent: "pi_2" } } } as unknown as Stripe.Event);
    expect(refunded).toMatchObject({ type: "refund.succeeded", refundRef: "re_9", paymentRef: "pi_2", amountMinor: 100 });
    const other = mapStripeEvent({ id: "evt_4", type: "customer.created", data: { object: {} } } as unknown as Stripe.Event);
    expect(other).toMatchObject({ type: "ignored", providerType: "customer.created" });
  });

  it("reports an unfinished account as not ready, creates individuals for instructors, and resumes onboarding", async () => {
    const { stripe, calls } = fakeStripe();
    const a = new StripePaymentsAdapter(stripe, config);
    await a.createConnectedAccount({ organizationId: "org_1", country: "CA", businessName: "Alex", businessType: "individual" });
    expect((calls.find((c) => c.method === "accounts.create")!.args[0] as { business_type: string }).business_type).toBe("individual");
    expect(await a.getAccountStatus("acct_123")).toEqual({ chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false, requirementsDue: ["external_account", "individual.dob.day"], disabledReason: "requirements.past_due" });
    expect(await a.createOnboardingLink("acct_123")).toBe("https://connect.stripe.com/setup/x");
    expect(calls.filter((c) => c.method === "accountLinks.create")).toHaveLength(2);
  });

  it("maps account.updated webhooks", () => {
    const ev = mapStripeEvent({ id: "evt_a", type: "account.updated", data: { object: { id: "acct_9", charges_enabled: true, payouts_enabled: true, details_submitted: true, requirements: { currently_due: [], past_due: [] } } } } as unknown as Stripe.Event);
    expect(ev).toEqual({ type: "account.updated", accountRef: "acct_9", providerEventId: "evt_a", status: { chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true, requirementsDue: [] } });
  });
});
