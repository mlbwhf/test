import { z } from "zod";
import type { AiGateway } from "./gateway.js";

/** Structured answers the organizer copilot returns. Schemas double as API contracts. */
export const ExplainOrderSchema = z.object({
  summary: z.string(),
  lines: z.array(z.object({ label: z.string(), amountMinor: z.number().int(), note: z.string() })),
  nextSteps: z.array(z.string()),
});
export type ExplainOrder = z.infer<typeof ExplainOrderSchema>;

export const SupportTriageSchema = z.object({
  category: z.enum(["refund", "payout", "ticket_access", "fraud", "billing", "other"]),
  urgency: z.enum(["low", "normal", "high"]),
  suggestedReply: z.string(),
  needsHuman: z.boolean(),
});
export type SupportTriage = z.infer<typeof SupportTriageSchema>;

const COPILOT_SYSTEM = `You are the organizer copilot inside Gate, an events payments platform.
Explain money precisely using the ledger facts provided. Amounts are integer minor units.
Never invent amounts. If a fact is missing, say so in nextSteps. You cannot move money;
any action that moves money must be proposed as a next step for a human to approve.`;

export class Copilot {
  constructor(private readonly gateway: AiGateway) {}

  explainOrder(tenantId: string, facts: { order: unknown; ledgerEntries: unknown; question?: string }) {
    return this.gateway.complete({
      tenantId,
      feature: "copilot.explain_order",
      tier: "reasoning",
      system: COPILOT_SYSTEM,
      schema: ExplainOrderSchema,
      messages: [
        {
          role: "user",
          content: `Order facts:\n${JSON.stringify(facts.order)}\n\nLedger entries:\n${JSON.stringify(facts.ledgerEntries)}\n\nQuestion: ${facts.question ?? "Explain where every unit of this order went."}`,
        },
      ],
    });
  }

  triageSupport(tenantId: string, message: string) {
    return this.gateway.complete({
      tenantId,
      feature: "support.triage",
      tier: "fast",
      system: "Classify an attendee or organizer support message for an events payments platform and draft a short, polite reply. Flag anything about fraud, chargebacks or legal threats as needsHuman.",
      schema: SupportTriageSchema,
      messages: [{ role: "user", content: message }],
    });
  }
}
