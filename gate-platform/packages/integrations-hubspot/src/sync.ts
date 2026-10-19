import { splitName } from "./hubspot.js";
import type { CrmPort } from "./types.js";

export interface OrderPaidInput {
  orderId: string;
  buyerEmail: string;
  attendees: Array<{ email: string; name?: string | undefined; company?: string | undefined }>;
  amountMinor: number;
  currency: string;
  courseName: string;
  cohortName: string;
  cohortStartsAt: Date;
  organizationName: string;
}

export interface OrderRefundedInput {
  orderId: string;
  fully: boolean;
  buyerEmail: string;
  courseName: string;
  cohortName: string;
  /** The order's total, in minor units (kept as the deal amount). */
  amountMinor: number;
  currency: string;
  /** Amount refunded, in minor units. Defaults to `amountMinor` (i.e. a full refund). */
  refundedMinor?: number | undefined;
}

export interface CrmSyncOptions {
  /** Injectable clock for tests; defaults to `() => new Date()`. */
  now?: (() => Date) | undefined;
}

export function dealName(courseName: string, cohortName: string, buyerEmail: string): string {
  return `${courseName} — ${cohortName} — ${buyerEmail}`;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Pushes EnrollClass order lifecycle events into a CRM. Errors propagate; the caller decides. */
export class CrmSync {
  private readonly now: () => Date;

  constructor(
    private readonly crm: CrmPort,
    opts: CrmSyncOptions = {},
  ) {
    this.now = opts.now ?? (() => new Date());
  }

  async onOrderPaid(input: OrderPaidInput): Promise<{ contacts: number; dealId: string }> {
    const courseProps = {
      gate_last_course: input.courseName,
      gate_last_cohort_start: toIsoDate(input.cohortStartsAt),
    };

    const seen = new Set<string>();
    let contacts = 0;

    await this.crm.upsertContact({ email: input.buyerEmail, company: input.organizationName, properties: courseProps });
    seen.add(input.buyerEmail.toLowerCase());
    contacts++;

    for (const a of input.attendees) {
      const key = a.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const { firstName, lastName } = splitName(a.name);
      await this.crm.upsertContact({
        email: a.email,
        firstName,
        lastName,
        company: a.company ?? input.organizationName,
        properties: courseProps,
      });
      contacts++;
    }

    const deal = await this.crm.upsertDeal({
      externalId: input.orderId,
      name: dealName(input.courseName, input.cohortName, input.buyerEmail),
      amountMinor: input.amountMinor,
      currency: input.currency,
      stage: "paid",
      closeDate: this.now(),
      contactEmail: input.buyerEmail,
      properties: { gate_course: input.courseName, gate_cohort: input.cohortName },
    });

    return { contacts, dealId: deal.id };
  }

  async onOrderRefunded(input: OrderRefundedInput): Promise<{ dealId: string }> {
    const deal = await this.crm.upsertDeal({
      externalId: input.orderId,
      name: dealName(input.courseName, input.cohortName, input.buyerEmail),
      amountMinor: input.amountMinor,
      currency: input.currency,
      stage: input.fully ? "refunded" : "paid",
      contactEmail: input.buyerEmail,
      properties: { gate_refunded_minor: String(input.refundedMinor ?? input.amountMinor) },
    });
    return { dealId: deal.id };
  }
}
