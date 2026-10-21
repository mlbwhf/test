"use client";

import { useCallback, useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_TRAINYARD_API_URL ?? "http://localhost:4100";
const KEY = process.env.NEXT_PUBLIC_TRAINYARD_API_KEY;

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

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiFailure(0, "OFFLINE", `Cannot reach the Trainyard API at ${BASE}. Start it with "pnpm dev:api".`);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
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
