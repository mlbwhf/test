import type { Currency, MinorUnits } from "./money.js";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

/**
 * Sign convention: postings are signed amounts where positive = debit,
 * negative = credit. A balance is the sum of signed postings. For display,
 * "natural" balance flips the sign for credit-normal accounts.
 */
export interface Account {
  id: string;
  /** Stable human-readable code, unique per ledger, e.g. "org:org_123:payable". */
  code: string;
  name: string;
  type: AccountType;
  currency: Currency;
  /** Owning tenant; "platform" for the platform's own books. */
  tenantId: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export interface Posting {
  accountId: string;
  /** Signed minor units: debit > 0, credit < 0. */
  amount: MinorUnits;
}

export interface JournalEntry {
  id: string;
  /** Caller-supplied key; posting the same key twice returns the original entry. */
  idempotencyKey: string;
  currency: Currency;
  description: string;
  effectiveAt: Date;
  recordedAt: Date;
  postings: readonly Posting[];
  /** Free-form correlation: orderId, paymentRef, refundId, etc. */
  metadata?: Record<string, string>;
}

export interface NewAccount {
  code: string;
  name: string;
  type: AccountType;
  currency: Currency;
  tenantId: string;
  metadata?: Record<string, string>;
}

export interface NewJournalEntry {
  idempotencyKey: string;
  currency: Currency;
  description: string;
  effectiveAt?: Date;
  postings: readonly Posting[];
  metadata?: Record<string, string>;
}

export interface Balance {
  accountId: string;
  currency: Currency;
  /** Signed sum of postings (debit-positive). */
  signed: MinorUnits;
  /** Positive number in the account's natural direction. */
  natural: MinorUnits;
}

export interface PostResult {
  entry: JournalEntry;
  /** True when this call created the entry; false when the idempotency key was already used. */
  created: boolean;
}

export interface LedgerStore {
  createAccount(account: Account): Promise<void>;
  getAccount(id: string): Promise<Account | undefined>;
  getAccountByCode(code: string): Promise<Account | undefined>;
  listAccounts(filter?: { tenantId?: string }): Promise<Account[]>;
  /**
   * Atomically persist an entry, or return the existing entry for the same
   * idempotency key. Implementations must guarantee all-or-nothing.
   */
  postEntry(entry: JournalEntry): Promise<PostResult>;
  getEntryByIdempotencyKey(key: string): Promise<JournalEntry | undefined>;
  listEntries(filter?: { accountId?: string; limit?: number }): Promise<JournalEntry[]>;
  getBalance(accountId: string): Promise<MinorUnits>;
}
