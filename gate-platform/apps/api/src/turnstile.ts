// Cloudflare Turnstile: a browser check on the forms bots go for (sign-up, checkout).
// The browser gets a token from Cloudflare's script; we hand it to Cloudflare's siteverify,
// which answers once per token. Nothing here reads cookies or tracks visitors.

export interface Turnstile {
  /** True when Cloudflare vouches for the token. Missing, forged, expired and reused tokens fail. */
  verify(token: string | undefined): Promise<boolean>;
  /**
   * own-pages (default): checkout on EnrollClass's own pages must carry a token; the widget on an
   * organizer's website may not, because Turnstile only runs on hostnames listed in the Cloudflare
   * dashboard. always: every checkout needs one (list the organizers' hostnames first).
   */
  orders: "own-pages" | "always";
}

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileConfig {
  secret: string;
  orders?: "own-pages" | "always" | undefined;
  /** Overridable for local runs without internet access. */
  siteverifyUrl?: string | undefined;
  fetchImpl?: typeof fetch | undefined;
  log?: ((msg: string) => void) | undefined;
}

export function createTurnstile(cfg: TurnstileConfig): Turnstile {
  const fetchImpl = cfg.fetchImpl ?? fetch;
  const url = cfg.siteverifyUrl ?? SITEVERIFY_URL;
  const log = cfg.log ?? ((m) => console.warn(m));
  return {
    orders: cfg.orders ?? "own-pages",
    async verify(token) {
      if (!token || token.length > 4096) return false;
      try {
        const res = await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ secret: cfg.secret, response: token }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) {
          // Cloudflare itself is having trouble: let people through rather than lock sign-up and checkout.
          log(`[turnstile] siteverify answered ${res.status}; letting the request through`);
          return true;
        }
        const body = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
        if (body.success !== true) log(`[turnstile] rejected: ${(body["error-codes"] ?? []).join(",") || "no reason"}`);
        return body.success === true;
      } catch (err) {
        log(`[turnstile] siteverify unreachable (${err instanceof Error ? err.message : String(err)}); letting the request through`);
        return true;
      }
    },
  };
}

/** From the environment: on when TURNSTILE_SECRET_KEY is set. */
export function turnstileFromEnv(env: NodeJS.ProcessEnv): Turnstile | undefined {
  if (!env.TURNSTILE_SECRET_KEY) return undefined;
  const orders = env.TURNSTILE_ORDERS === "always" ? "always" : "own-pages";
  return createTurnstile({ secret: env.TURNSTILE_SECRET_KEY, orders, siteverifyUrl: env.TURNSTILE_SITEVERIFY_URL });
}

/** The page that sent a request, from Origin (browsers always send it on POST) or Referer. */
export function requestPageHost(headers: Record<string, string | string[] | undefined>): string | null {
  for (const name of ["origin", "referer"]) {
    const v = headers[name];
    const s = Array.isArray(v) ? v[0] : v;
    if (!s) continue;
    try {
      return new URL(s).hostname.toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

/** Hostnames of EnrollClass's own pages: the app host and the bare domain it hangs off. */
export function ownPageHosts(webUrl: string): Set<string> {
  const out = new Set<string>();
  try {
    const host = new URL(webUrl).hostname.toLowerCase();
    out.add(host);
    out.add(host.replace(/^app\./, ""));
  } catch {
    // no web URL configured: nothing is an "own page"
  }
  return out;
}

export const CHALLENGE_MESSAGE = "We couldn't confirm you're not a robot. Reload the page and try again.";
