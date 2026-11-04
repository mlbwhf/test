"use client";

import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    __TRAINYARD_API__?: string;
  }
}
const BASE = (typeof window !== "undefined" && window.__TRAINYARD_API__) || process.env.NEXT_PUBLIC_TRAINYARD_API_URL || "http://localhost:4100";
const KEY_STORAGE = "trainyard.apiKey";
const WORKSPACE_STORAGE = "trainyard.workspace";

/** Platform admins supporting a customer: the workspace every request is sent to. */
export function getSupportWorkspace(): string | null {
  try {
    return localStorage.getItem(WORKSPACE_STORAGE);
  } catch {
    return null;
  }
}
export function setSupportWorkspace(id: string | null): void {
  try {
    if (id) localStorage.setItem(WORKSPACE_STORAGE, id);
    else localStorage.removeItem(WORKSPACE_STORAGE);
  } catch {
    /* storage blocked */
  }
}

export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/** The API key for this browser. Kept in localStorage; never sent anywhere but the API. */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE) || process.env.NEXT_PUBLIC_TRAINYARD_API_KEY || null;
  } catch {
    return process.env.NEXT_PUBLIC_TRAINYARD_API_KEY ?? null;
  }
}

export function setApiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* private window or blocked storage: the key lives for this page only */
  }
}

/**
 * Pages people use without signing in (the website, sign-up, the welcome page Stripe returns to,
 * class links): a "not signed in" answer there is shown on the page, never a jump to Sign in.
 */
const SIGNED_OUT_PAGE = /^\/(login|welcome|join|pricing|book|support|privacy|terms)?(\/|$)/;

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  const key = getApiKey();
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(getSupportWorkspace() ? { "x-trainyard-workspace": getSupportWorkspace()! } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // People see this; only a local setup needs to be told to start the API.
    const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
    throw new ApiFailure(0, "OFFLINE", local ? `Cannot reach the Trainyard API at ${BASE}. Start it with "pnpm dev:api".` : "Trainyard did not answer just now. Check your connection and try again in a moment; nothing you entered is lost.");
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined" && !SIGNED_OUT_PAGE.test(window.location.pathname)) {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok) throw new ApiFailure(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? res.statusText, json?.error?.details);
  return json as T;
}

/** Fetch on mount and expose a reload function. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>("GET", path));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiFailure ? e : new ApiFailure(0, "ERROR", String(e)));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export interface Me {
  principal: { userId: string; name: string; role: string; personId?: string; anonymous: boolean; workspaceId: string; platformAdmin: boolean; support?: boolean; guestBoardId?: string };
  open: boolean;
  permissions: Record<string, boolean>;
  workspace: { id: string; name: string; plan: "practice" | "trainer" | "academy" | "insights" | "platform"; seats: number; status: "active" | "frozen"; frozenReason?: string; platform: boolean };
}

/** Who the current key belongs to and what they may do. */
export function useMe() {
  return useApi<Me>("/v1/me");
}

/**
 * Live push: holds a streaming connection to an `/events` route and calls `onChange` for every
 * change notice. Plain fetch, so the API key travels in the header as everywhere else. Reconnects
 * with a growing pause when the stream drops; `onState` says whether a stream is up, so a page can
 * poll only while it is not. Returns a function that closes the stream.
 */
export function subscribe(path: string, onChange: (data: Record<string, unknown>) => void, onState?: (connected: boolean) => void): () => void {
  let stopped = false;
  let ctrl: AbortController | null = null;
  let pause = 1000;
  const run = async () => {
    while (!stopped) {
      ctrl = new AbortController();
      try {
        const key = getApiKey();
        const res = await fetch(`${BASE}${path}`, { headers: { accept: "text/event-stream", ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(getSupportWorkspace() ? { "x-trainyard-workspace": getSupportWorkspace()! } : {}) }, signal: ctrl.signal, cache: "no-store" });
        if (!res.ok || !res.body) throw new Error(`events ${res.status}`);
        onState?.(true);
        pause = 1000;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const ev = /^event: (.+)$/m.exec(chunk)?.[1];
            const data = /^data: (.+)$/m.exec(chunk)?.[1];
            if (ev === "change" && data) {
              try {
                onChange(JSON.parse(data) as Record<string, unknown>);
              } catch {
                onChange({});
              }
            }
          }
        }
      } catch {
        /* dropped: reconnect below */
      }
      onState?.(false);
      if (stopped) break;
      await new Promise((r) => setTimeout(r, pause));
      pause = Math.min(pause * 2, 30_000);
    }
  };
  void run();
  return () => {
    stopped = true;
    ctrl?.abort();
    onState?.(false);
  };
}
