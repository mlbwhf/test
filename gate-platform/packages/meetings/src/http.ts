import type { Meeting } from "./types.js";

export const MAX_ATTEMPTS = 3;
export const BACKOFF_BASE_MS = 100;
/** Refresh cached OAuth tokens this long before they expire. */
export const TOKEN_EXPIRY_SKEW_MS = 60_000;

export type Sleep = (ms: number) => Promise<void>;

export const defaultSleep: Sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class MeetingProviderError extends Error {
  override readonly name = "MeetingProviderError";
  constructor(
    readonly provider: Meeting["provider"],
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
  get retryable(): boolean {
    return isRetryableStatus(this.status);
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export interface HttpContext {
  provider: Meeting["provider"];
  fetchImpl: typeof fetch;
  sleep: Sleep;
}

export interface JsonRequest {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  /** Used in error messages instead of the URL so query strings never leak. */
  label: string;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  /** Non-2xx statuses treated as success (e.g. 404 on delete); the call then resolves to undefined. */
  tolerate?: readonly number[] | undefined;
}

/**
 * Performs a request, retrying 429/5xx up to MAX_ATTEMPTS with exponential backoff.
 * Resolves to the parsed JSON body, or undefined when the body is empty.
 * Error messages contain only the method, label and status; never headers or credentials.
 */
export async function requestJson<T>(ctx: HttpContext, req: JsonRequest): Promise<T | undefined> {
  let lastError: MeetingProviderError | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const init: RequestInit = { method: req.method, headers: { Accept: "application/json", ...(req.headers ?? {}) } };
    if (req.body !== undefined) init.body = req.body;
    const res = await ctx.fetchImpl(req.url, init);
    if (res.ok) {
      if (res.status === 204) return undefined;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }
    if (req.tolerate?.includes(res.status)) return undefined;
    const err = await toProviderError(ctx.provider, res, req.method, req.label);
    if (!err.retryable || attempt === MAX_ATTEMPTS) throw err;
    lastError = err;
    await ctx.sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
  }
  // Unreachable: the loop either returns or throws.
  throw lastError ?? new MeetingProviderError(ctx.provider, 0, `${ctx.provider} ${req.method} ${req.label} failed`);
}

async function toProviderError(provider: Meeting["provider"], res: Response, method: string, label: string): Promise<MeetingProviderError> {
  let body: unknown;
  let message: string | undefined;
  try {
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
        message = extractMessage(body);
      } catch {
        body = text;
        message = text;
      }
    }
  } catch {
    // ignore body read failures
  }
  return new MeetingProviderError(provider, res.status, `${provider} ${method} ${label} failed with ${res.status}${message ? `: ${message}` : ""}`, body);
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as { message?: unknown; error?: unknown; error_description?: unknown };
  if (typeof b.message === "string") return b.message;
  if (typeof b.error_description === "string") return b.error_description;
  if (b.error && typeof b.error === "object" && typeof (b.error as { message?: unknown }).message === "string") {
    return (b.error as { message: string }).message;
  }
  if (typeof b.error === "string") return b.error;
  return undefined;
}

export interface IssuedToken {
  accessToken: string;
  expiresInSeconds: number;
}

/** Caches an OAuth access token until TOKEN_EXPIRY_SKEW_MS before it expires; one in-flight fetch at a time. */
export class TokenCache {
  private cached: { value: string; expiresAt: number } | undefined;
  private inFlight: Promise<string> | undefined;

  constructor(
    private readonly issue: () => Promise<IssuedToken>,
    private readonly now: () => Date,
  ) {}

  async get(): Promise<string> {
    const t = this.now().getTime();
    if (this.cached && t < this.cached.expiresAt - TOKEN_EXPIRY_SKEW_MS) return this.cached.value;
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      try {
        const issued = await this.issue();
        this.cached = { value: issued.accessToken, expiresAt: this.now().getTime() + issued.expiresInSeconds * 1000 };
        return issued.accessToken;
      } finally {
        this.inFlight = undefined;
      }
    })();
    return this.inFlight;
  }
}

/** ISO-8601 in UTC without milliseconds: "2026-11-20T14:00:00Z". */
export function toIsoSeconds(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function secondsToMinutesUp(seconds: number): number {
  return Math.ceil(Math.max(0, seconds) / 60);
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}
