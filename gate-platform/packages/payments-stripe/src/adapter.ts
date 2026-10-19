import Stripe from "stripe";
import type { PaymentEvent, PaymentsPort } from "@gate/core";

export interface StripeAdapterConfig {
  /** Where Stripe sends the organizer after/if they abandon Connect onboarding. */
  onboardingReturnUrl: string;
  onboardingRefreshUrl: string;
  webhookSecret?: string;
}

/**
 * Stripe Connect adapter using "separate charges and transfers":
 * the platform charges the buyer, then transfers each party's share to
 * its connected account, all tied together by transfer_group = orderId.
 * Platform fee = what is left on the platform balance.
 */
export class StripePaymentsAdapter implements PaymentsPort {
  readonly provider = "stripe";

  constructor(
    private readonly stripe: Stripe,
    private readonly config: StripeAdapterConfig,
  ) {}

  static fromSecretKey(secretKey: string, config: StripeAdapterConfig): StripePaymentsAdapter {
    return new StripePaymentsAdapter(new Stripe(secretKey, { appInfo: { name: "EnrollClass", version: "0.1.0", url: "https://enrollclass.com" } }), config);
  }

  async createConnectedAccount(input: { organizationId: string; country: string; email?: string; businessName: string }) {
    // Connected accounts use Stripe's controller model: the platform pays Stripe's fees and
    // carries refund/dispute losses (funds are held until delivery, so the platform controls
    // the money that would cover them), Stripe collects onboarding requirements through the
    // hosted flow, and organizers get the Express dashboard for payouts and tax forms.
    const account = await this.stripe.accounts.create(
      {
        controller: {
          fees: { payer: "application" },
          losses: { payments: "application" },
          requirement_collection: "stripe",
          stripe_dashboard: { type: "express" },
        },
        country: input.country,
        ...(input.email ? { email: input.email } : {}),
        business_type: "company",
        business_profile: { name: input.businessName, mcc: "8299" }, // 8299: schools and educational services
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { organizationId: input.organizationId },
      },
      { idempotencyKey: `acct:${input.organizationId}` },
    );
    const link = await this.stripe.accountLinks.create({
      account: account.id,
      type: "account_onboarding",
      return_url: this.config.onboardingReturnUrl,
      refresh_url: this.config.onboardingRefreshUrl,
    });
    return { accountRef: account.id, onboardingUrl: link.url };
  }

  async createPayment(input: {
    orderId: string;
    amountMinor: number;
    currency: string;
    transferGroup: string;
    buyerEmail: string;
    metadata: Record<string, string>;
  }) {
    const pi = await this.stripe.paymentIntents.create(
      {
        amount: input.amountMinor,
        currency: input.currency.toLowerCase(),
        transfer_group: input.transferGroup,
        receipt_email: input.buyerEmail,
        automatic_payment_methods: { enabled: true },
        metadata: input.metadata,
      },
      { idempotencyKey: `pi:${input.orderId}` },
    );
    return {
      paymentRef: pi.id,
      clientSecret: pi.client_secret,
      status: pi.status === "succeeded" ? ("succeeded" as const) : ("requires_payment" as const),
    };
  }

  async createTransfer(input: {
    idempotencyKey: string;
    paymentRef: string;
    destinationAccountRef: string;
    amountMinor: number;
    currency: string;
    transferGroup: string;
  }) {
    // Tie the transfer to the charge so it follows the charge's funds availability; fee transfers draw on the available balance.
    let chargeId: string | undefined;
    if (input.paymentRef) {
      const pi = await this.stripe.paymentIntents.retrieve(input.paymentRef);
      chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
    }
    const transfer = await this.stripe.transfers.create(
      {
        amount: input.amountMinor,
        currency: input.currency.toLowerCase(),
        destination: input.destinationAccountRef,
        transfer_group: input.transferGroup,
        ...(chargeId ? { source_transaction: chargeId } : {}),
      },
      { idempotencyKey: input.idempotencyKey },
    );
    return { transferRef: transfer.id };
  }

  async refund(input: { idempotencyKey: string; paymentRef: string; amountMinor: number; reason: string }) {
    const refund = await this.stripe.refunds.create(
      {
        payment_intent: input.paymentRef,
        amount: input.amountMinor,
        reason: mapRefundReason(input.reason),
        metadata: { reason: input.reason.slice(0, 500) },
        // Claw the transferred shares back from connected accounts pro rata.
        reverse_transfer: true,
      },
      { idempotencyKey: input.idempotencyKey },
    );
    return { refundRef: refund.id, status: mapRefundStatus(refund.status) };
  }

  /** Verify the signature and normalize. Throws on a bad signature. */
  parseWebhook(rawBody: string | Buffer, signature: string): PaymentEvent {
    if (!this.config.webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.config.webhookSecret);
    return mapStripeEvent(event);
  }
}

function mapRefundReason(reason: string): "duplicate" | "fraudulent" | "requested_by_customer" {
  const r = reason.toLowerCase();
  if (r.includes("fraud")) return "fraudulent";
  if (r.includes("duplicate")) return "duplicate";
  return "requested_by_customer";
}

function mapRefundStatus(status: string | null): "pending" | "succeeded" | "failed" {
  if (status === "succeeded") return "succeeded";
  if (status === "failed" || status === "canceled") return "failed";
  return "pending";
}

export function mapStripeEvent(event: Stripe.Event): PaymentEvent {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      return {
        type: "payment.succeeded",
        paymentRef: pi.id,
        amountMinor: pi.amount_received,
        currency: pi.currency.toUpperCase(),
        providerEventId: event.id,
      };
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      return {
        type: "payment.failed",
        paymentRef: pi.id,
        reason: pi.last_payment_error?.message ?? pi.last_payment_error?.code ?? "payment_failed",
        providerEventId: event.id,
      };
    }
    case "refund.updated":
    case "charge.refund.updated": {
      const refund = event.data.object;
      const paymentRef = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id ?? "";
      if (refund.status === "succeeded") {
        return { type: "refund.succeeded", paymentRef, refundRef: refund.id, amountMinor: refund.amount, providerEventId: event.id };
      }
      if (refund.status === "failed" || refund.status === "canceled") {
        return { type: "refund.failed", paymentRef, refundRef: refund.id, reason: refund.failure_reason ?? refund.status, providerEventId: event.id };
      }
      return { type: "ignored", providerEventId: event.id, providerType: `${event.type}:${refund.status}` };
    }
    default:
      return { type: "ignored", providerEventId: event.id, providerType: event.type };
  }
}
