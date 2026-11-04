"use client";

// A planning document (the roadmap, the OKR board, the planning room) kept whole on the server:
// loaded once, saved a moment after each change when it differs from what was last saved. The
// last writer wins, as on the prototype's shared storage; the server keeps one copy per workspace.

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiFailure } from "@/lib/api";

/** A workspace document, or a class's own planning room: `planning-room:<boardId>`. */
export type DocKey = "roadmap" | "okr-board" | "planning-room" | `planning-room:${string}`;

/** JSON with keys in a fixed order, so two equal documents compare equal whatever built them. */
const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x));

export interface DocHandle<T> {
  doc: T | null;
  loaded: boolean;
  /** Saves the whole document (the roadmap, the OKR board, a trainer setting the room up). */
  save: (doc: T) => void;
  /** Saves one team's slice of a planning room; the server merges it, so teams never overwrite each other. */
  saveSlice: (team: number, slice: Record<string, unknown>) => void;
  error: string | null;
  /** Counts up each time someone else's change arrived; pages take the new `doc` into their state then. */
  remote: number;
}

/**
 * Light on the wire: the document is downloaded once, then every few seconds the page asks for its
 * revision stamp only (a few bytes) and downloads the document again just when it changed. Saves
 * go out at most once per 600 ms, and nothing is saved that equals what the server already has.
 */
export function useDoc<T extends object>(key: DocKey, { pollMs = 3000 }: { pollMs?: number } = {}): DocHandle<T> {
  const [doc, setDoc] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remote, setRemote] = useState(0);
  const last = useRef<string>("");
  const lastSlice = useRef<Record<number, string>>({});
  const rev = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(0);
  useEffect(() => {
    let gone = false;
    api<{ doc: T | null; rev: string }>("GET", `/v1/docs/${encodeURIComponent(key)}`)
      .then((r) => {
        if (gone) return;
        last.current = canon(r.doc);
        rev.current = r.rev;
        setDoc(r.doc);
        setLoaded(true);
      })
      .catch((e: ApiFailure) => !gone && (setError(e.message), setLoaded(true)));
    // The poll: skipped while a save is pending or in flight, while this tab is hidden, and while
    // someone has text in a field, so an incoming document never pulls the text from under them.
    const poll = async () => {
      if (gone || !rev.current || timer.current || inflight.current || document.visibilityState !== "visible") return;
      const el = document.activeElement;
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.value.trim()) return;
      try {
        const r = await api<{ rev: string; same?: boolean; doc?: T | null }>("GET", `/v1/docs/${encodeURIComponent(key)}?rev=${encodeURIComponent(rev.current)}`);
        if (gone || r.same || timer.current || inflight.current) return;
        rev.current = r.rev;
        last.current = canon(r.doc ?? null);
        lastSlice.current = {};
        setDoc(r.doc ?? null);
        setRemote((n) => n + 1);
      } catch {
        /* offline for a moment: try again on the next tick */
      }
    };
    const id = pollMs > 0 ? window.setInterval(() => void poll(), pollMs) : 0;
    return () => {
      gone = true;
      if (id) window.clearInterval(id);
    };
  }, [key, pollMs]);
  const put = useCallback(
    (body: unknown, after?: (r: { rev: string }) => void) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        inflight.current += 1;
        api<{ rev: string }>("PUT", `/v1/docs/${encodeURIComponent(key)}`, body)
          .then((r) => (setError(null), after?.(r)), (e: ApiFailure) => setError(e.status === 403 ? "You can look, but only planners can change this page." : e.message))
          .finally(() => (inflight.current -= 1));
      }, 600);
    },
    [key],
  );
  const save = useCallback(
    (next: T) => {
      const text = canon(next);
      if (text === last.current) return;
      last.current = text;
      // The server now holds exactly this, so its new revision needs no download.
      put({ doc: next }, (r) => (rev.current = r.rev));
    },
    [put],
  );
  const saveSlice = useCallback(
    (team: number, slice: Record<string, unknown>) => {
      const text = canon(slice);
      if (text === lastSlice.current[team]) return;
      lastSlice.current[team] = text;
      // Merged on the server with the other teams' work: the next poll brings the whole room back.
      put({ team, slice });
    },
    [put],
  );
  return { doc, loaded, save, saveSlice, error, remote };
}

/** Reads another page's document once (the roadmap's epics on the OKR board, for instance). */
export function useDocOnce<T extends object>(key: DocKey): T | null | undefined {
  const [doc, setDoc] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    let gone = false;
    api<{ doc: T | null }>("GET", `/v1/docs/${encodeURIComponent(key)}`).then((r) => !gone && setDoc(r.doc), () => !gone && setDoc(null));
    return () => {
      gone = true;
    };
  }, [key]);
  return doc;
}
