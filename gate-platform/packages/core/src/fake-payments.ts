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

  async createConnectedAccount(input: { organizationId: string; country: string }) {
    this.calls.push({ method: "createConnectedAccount", input });
    return { accountRef: `acct_fake_${input.organizationId}`, onboardingUrl: `https://fake.gate.local/onboard/${input.organizationId}` };
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
