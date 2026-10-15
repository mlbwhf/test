import { assertCurrency, assertMinorUnits, type MinorUnits } from "./money.js";
import type {
  Account,
  AccountType,
  Balance,
  JournalEntry,
  LedgerStore,
  NewAccount,
  NewJournalEntry,
  PostResult,
} from "./types.js";

export class LedgerError extends Error {
  override readonly name = "LedgerError";
  constructor(message: string, readonly code: LedgerErrorCode) {
    super(message);
  }
}
export type LedgerErrorCode =
  | "UNBALANCED"
  | "TOO_FEW_POSTINGS"
  | "UNKNOWN_ACCOUNT"
  | "CURRENCY_MISMATCH"
  | "ZERO_POSTING"
  | "DUPLICATE_ACCOUNT_CODE"
  | "IDEMPOTENCY_CONFLICT";

export interface LedgerDeps {
  store: LedgerStore;
  now?: () => Date;
  newId?: (prefix: string) => string;
}

const CREDIT_NORMAL: ReadonlySet<AccountType> = new Set(["liability", "equity", "revenue"]);

export function naturalBalance(type: AccountType, signed: MinorUnits): MinorUnits {
  const v = CREDIT_NORMAL.has(type) ? -signed : signed;
  return v === 0 ? 0 : v; // normalise -0
}

/** Stable fingerprint so idempotent replays with different bodies are rejected. */
export function entryFingerprint(input: NewJournalEntry): string {
  const postings = [...input.postings]
    .map((p) => `${p.accountId}:${p.amount}`)
    .sort()
    .join("|");
  return `${input.currency}|${postings}`;
}

export class Ledger {
  private readonly store: LedgerStore;
  private readonly now: () => Date;
  private readonly newId: (prefix: string) => string;

  constructor(deps: LedgerDeps) {
    this.store = deps.store;
    this.now = deps.now ?? (() => new Date());
    this.newId = deps.newId ?? defaultId;
  }

  async createAccount(input: NewAccount): Promise<Account> {
    assertCurrency(input.currency);
    const existing = await this.store.getAccountByCode(input.code);
    if (existing) {
      throw new LedgerError(`account code already exists: ${input.code}`, "DUPLICATE_ACCOUNT_CODE");
    }
    const account: Account = {
      id: this.newId("acct"),
      code: input.code,
      name: input.name,
      type: input.type,
      currency: input.currency,
      tenantId: input.tenantId,
      createdAt: this.now(),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
    await this.store.createAccount(account);
    return account;
  }

  /** Create-or-get by code. Safe to call on every boot. */
  async ensureAccount(input: NewAccount): Promise<Account> {
    const existing = await this.store.getAccountByCode(input.code);
    if (existing) {
      if (existing.currency !== input.currency) {
        throw new LedgerError(
          `account ${input.code} exists in ${existing.currency}, requested ${input.currency}`,
          "CURRENCY_MISMATCH",
        );
      }
      return existing;
    }
    return this.createAccount(input);
  }

  getAccount(id: string): Promise<Account | undefined> {
    return this.store.getAccount(id);
  }

  getAccountByCode(code: string): Promise<Account | undefined> {
    return this.store.getAccountByCode(code);
  }

  listAccounts(filter?: { tenantId?: string }): Promise<Account[]> {
    return this.store.listAccounts(filter);
  }

  async post(input: NewJournalEntry): Promise<PostResult> {
    assertCurrency(input.currency);
    if (!input.idempotencyKey) throw new LedgerError("idempotencyKey is required", "IDEMPOTENCY_CONFLICT");
    if (input.postings.length < 2) {
      throw new LedgerError("an entry needs at least two postings", "TOO_FEW_POSTINGS");
    }
    let sum = 0;
    for (const p of input.postings) {
      assertMinorUnits(p.amount, `posting ${p.accountId}`);
      if (p.amount === 0) throw new LedgerError(`zero posting on ${p.accountId}`, "ZERO_POSTING");
      const account = await this.store.getAccount(p.accountId);
      if (!account) throw new LedgerError(`unknown account ${p.accountId}`, "UNKNOWN_ACCOUNT");
      if (account.currency !== input.currency) {
        throw new LedgerError(
          `account ${account.code} is ${account.currency}, entry is ${input.currency}`,
          "CURRENCY_MISMATCH",
        );
      }
      sum += p.amount;
    }
    if (sum !== 0) throw new LedgerError(`postings sum to ${sum}, must be 0`, "UNBALANCED");

    const prior = await this.store.getEntryByIdempotencyKey(input.idempotencyKey);
    if (prior) {
      const priorFp = entryFingerprint({ ...prior, postings: prior.postings });
      if (priorFp !== entryFingerprint(input)) {
        throw new LedgerError(
          `idempotency key ${input.idempotencyKey} reused with a different body`,
          "IDEMPOTENCY_CONFLICT",
        );
      }
      return { entry: prior, created: false };
    }

    const entry: JournalEntry = {
      id: this.newId("je"),
      idempotencyKey: input.idempotencyKey,
      currency: input.currency,
      description: input.description,
      effectiveAt: input.effectiveAt ?? this.now(),
      recordedAt: this.now(),
      postings: input.postings.map((p) => ({ accountId: p.accountId, amount: p.amount })),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };
    return this.store.postEntry(entry);
  }

  async balance(accountId: string): Promise<Balance> {
    const account = await this.store.getAccount(accountId);
    if (!account) throw new LedgerError(`unknown account ${accountId}`, "UNKNOWN_ACCOUNT");
    const signed = await this.store.getBalance(accountId);
    return { accountId, currency: account.currency, signed, natural: naturalBalance(account.type, signed) };
  }

  async balances(filter?: { tenantId?: string }): Promise<Array<Balance & { account: Account }>> {
    const accounts = await this.store.listAccounts(filter);
    const out: Array<Balance & { account: Account }> = [];
    for (const account of accounts) {
      const signed = await this.store.getBalance(account.id);
      out.push({
        account,
        accountId: account.id,
        currency: account.currency,
        signed,
        natural: naturalBalance(account.type, signed),
      });
    }
    return out;
  }

  /** Invariant: across every account in a currency, signed balances sum to zero. */
  async assertBalanced(): Promise<void> {
    const byCurrency = new Map<string, number>();
    for (const b of await this.balances()) {
      byCurrency.set(b.currency, (byCurrency.get(b.currency) ?? 0) + b.signed);
    }
    for (const [ccy, sum] of byCurrency) {
      if (sum !== 0) throw new LedgerError(`ledger out of balance in ${ccy} by ${sum}`, "UNBALANCED");
    }
  }

  listEntries(filter?: { accountId?: string; limit?: number }): Promise<JournalEntry[]> {
    return this.store.listEntries(filter);
  }
}

let counter = 0;
function defaultId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}
