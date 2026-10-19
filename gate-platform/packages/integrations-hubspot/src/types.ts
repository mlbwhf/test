/** A contact record in a CRM, keyed by email. */
export interface CrmContact {
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  company?: string | undefined;
  phone?: string | undefined;
  /** Extra provider-specific properties (e.g. HubSpot custom properties). */
  properties?: Record<string, string> | undefined;
}

export type CrmDealStage = "registered" | "paid" | "refunded" | "cancelled";

/** A deal (order) record in a CRM, keyed by an external id owned by EnrollClass. */
export interface CrmDeal {
  externalId: string;
  name: string;
  amountMinor: number;
  currency: string;
  stage: CrmDealStage;
  closeDate?: Date | undefined;
  contactEmail: string;
  properties?: Record<string, string> | undefined;
}

export interface CrmUpsertResult {
  id: string;
  created: boolean;
}

/** Provider-neutral CRM port. Implementations: HubSpotCrm, InMemoryCrm. */
export interface CrmPort {
  readonly provider: string;
  upsertContact(c: CrmContact): Promise<CrmUpsertResult>;
  upsertDeal(d: CrmDeal): Promise<CrmUpsertResult>;
}
