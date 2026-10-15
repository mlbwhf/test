import type { Account, Currency, Ledger } from "@gate/ledger";

/** Chart of accounts. Codes are stable identifiers; never rename in place. */
export const codes = {
  clearing: (ccy: Currency) => `platform:clearing:${ccy}`,
  /** Cash received outside the card processor (bank transfer, wire, cheque). */
  bankClearing: (ccy: Currency) => `platform:clearing:bank:${ccy}`,
  /** Partial invoice payments held until the invoice is fully paid. */
  customerDeposits: (ccy: Currency) => `platform:customer_deposits:${ccy}`,
  /** Tax collected on the organizer's behalf; the organizer remits it. */
  taxPayable: (orgId: string, ccy: Currency) => `org:${orgId}:tax_payable:${ccy}`,
  feeRevenue: (ccy: Currency) => `platform:revenue:fees:${ccy}`,
  orgPayable: (orgId: string, ccy: Currency) => `org:${orgId}:payable:${ccy}`,
  partyPayable: (partyId: string, ccy: Currency) => `party:${partyId}:payable:${ccy}`,
};

export class ChartOfAccounts {
  constructor(private readonly ledger: Ledger) {}

  clearing(ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.clearing(ccy), name: `Payment provider clearing (${ccy})`, type: "asset", currency: ccy, tenantId: "platform" });
  }
  bankClearing(ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.bankClearing(ccy), name: `Bank clearing (${ccy})`, type: "asset", currency: ccy, tenantId: "platform" });
  }
  customerDeposits(ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.customerDeposits(ccy), name: `Customer deposits (${ccy})`, type: "liability", currency: ccy, tenantId: "platform" });
  }
  taxPayable(orgId: string, ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.taxPayable(orgId, ccy), name: `Tax collected, to remit (${ccy})`, type: "liability", currency: ccy, tenantId: orgId });
  }
  feeRevenue(ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.feeRevenue(ccy), name: `Platform fee revenue (${ccy})`, type: "revenue", currency: ccy, tenantId: "platform" });
  }
  orgPayable(orgId: string, ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.orgPayable(orgId, ccy), name: `Payable to organizer (${ccy})`, type: "liability", currency: ccy, tenantId: orgId });
  }
  partyPayable(orgId: string, partyId: string, ccy: Currency): Promise<Account> {
    return this.ledger.ensureAccount({ code: codes.partyPayable(partyId, ccy), name: `Payable to party ${partyId} (${ccy})`, type: "liability", currency: ccy, tenantId: orgId, metadata: { partyId } });
  }
}
