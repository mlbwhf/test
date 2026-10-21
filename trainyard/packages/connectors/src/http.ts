// Small fetch wrapper shared by the tracker adapters: auth header, JSON, and retries on
// rate limits (429) and transient 5xx, honouring Retry-After.

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export class TrackerHttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`${status} from ${url}: ${body.slice(0, 300)}`);
    this.name = "TrackerHttpError";
  }
}

export interface HttpOptions {
  fetch?: FetchLike;
  authorization: string;
  maxRetries?: number;
  /** Injected in tests so retries do not wait. */
  sleep?: (ms: number) => Promise<void>;
}

export class TrackerHttp {
  private readonly fetchFn: FetchLike;
  private readonly maxRetries: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: HttpOptions) {
    this.fetchFn = opts.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.maxRetries = opts.maxRetries ?? 3;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  async request<T>(method: string, url: string, body?: unknown, contentType = "application/json"): Promise<T> {
    const headers: Record<string, string> = { Authorization: this.opts.authorization, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = contentType;
    for (let attempt = 0; ; attempt++) {
      const res = await this.fetchFn(url, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      if (res.ok) {
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
      }
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= this.maxRetries) throw new TrackerHttpError(res.status, url, await res.text());
      const after = Number(res.headers.get("Retry-After"));
      await this.sleep(Number.isFinite(after) && after > 0 ? after * 1000 : 500 * 2 ** attempt);
    }
  }
}

export function basicAuth(user: string, secret: string): string {
  return `Basic ${Buffer.from(`${user}:${secret}`).toString("base64")}`;
}
