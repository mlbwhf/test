import type { PaymentEvent, PaymentsPort } from "./ports.js";

/**
 * In-process payments provider for development and tests. Payments start
 * in requires_payment; call `succeed()` / `fail()` to emit the webhook
 * event a real provider would send.
 */
export class FakePaymentsAdapter implements PaymentsPort {
  readonly provider = "fake";
  readonly calls: Array<{ method: string; input: unknown }> = [];
  private seq = 0;
  private readonly run = Math.random().toString(36).slice(2, 8);

  /** Accounts whose onboarding the test has not "completed" yet (see completeOnboarding). */
  readonly pendingAccounts = new Set<string>();
  /** When true, new accounts start unfinished, like a real provider. Off by default. */
  requireOnboarding = false;
  async createConnectedAccount(input: { organizationId: string; country: string }) {
    this.calls.push({ method: "createConnectedAccount", input });
    const accountRef = `acct_fake_${input.organizationId}`;
    if (this.requireOnboarding) this.pendingAccounts.add(accountRef);
    return { accountRef, onboardingUrl: `https://fake.gate.local/onboard/${input.organizationId}` };
  }
  async getAccountStatus(accountRef: string) {
    const ready = !this.pendingAccounts.has(accountRef);
    return { chargesEnabled: ready, payoutsEnabled: ready, detailsSubmitted: ready, requirementsDue: ready ? [] : ["external_account", "individual.verification.document"] };
  }
  async createOnboardingLink(accountRef: string) {
    return this.pendingAccounts.has(accountRef) ? `https://fake.gate.local/onboard/${accountRef}?resume=1` : undefined;
  }
  completeOnboarding(accountRef: string) {
    this.pendingAccounts.delete(accountRef);
  }
  async createPayment(input: { orderId: string }) {
    this.calls.push({ method: "createPayment", input });
    const ref = `pi_fake_${this.run}_${++this.seq}`;
    return { paymentRef: ref, clientSecret: `${ref}_secret_${Math.random().toString(36).slice(2)}`, status: "requires_payment" as const };
  }
  async createTransfer(input: { idempotencyKey: string }) {
    this.calls.push({ method: "createTransfer", input });
    return { transferRef: `tr_fake_${input.idempotencyKey}` };
  }
  async refund(input: { idempotencyKey: string }) {
    this.calls.push({ method: "refund", input });
    return { refundRef: `re_fake_${input.idempotencyKey}`, status: "succeeded" as const };
  }

  succeed(paymentRef: string, amountMinor: number, currency: string): PaymentEvent {
    return { type: "payment.succeeded", paymentRef, amountMinor, currency, providerEventId: `evt_fake_${this.run}_${++this.seq}` };
  }
  fail(paymentRef: string, reason = "card_declined"): PaymentEvent {
    return { type: "payment.failed", paymentRef, reason, providerEventId: `evt_fake_${this.run}_${++this.seq}` };
  }
}
