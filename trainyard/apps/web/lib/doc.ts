"use client";

// A planning document (the roadmap, the OKR board, the planning room) kept whole on the server:
// loaded once, saved a moment after each change when it differs from what was last saved. The
// last writer wins, as on the prototype's shared storage; the server keeps one copy per workspace.

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiFailure } from "@/lib/api";

export type DocKey = "roadmap" | "okr-board" | "planning-room";

export function useDoc<T extends object>(key: DocKey): { doc: T | null; loaded: boolean; save: (doc: T) => void; error: string | null } {
  const [doc, setDoc] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let gone = false;
    api<{ doc: T | null }>("GET", `/v1/docs/${key}`)
      .then((r) => {
        if (gone) return;
        last.current = JSON.stringify(r.doc);
        setDoc(r.doc);
        setLoaded(true);
      })
      .catch((e: ApiFailure) => !gone && (setError(e.message), setLoaded(true)));
    return () => {
      gone = true;
    };
  }, [key]);
  const save = useCallback(
    (next: T) => {
      const text = JSON.stringify(next);
      if (text === last.current) return;
      last.current = text;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        api("PUT", `/v1/docs/${key}`, { doc: next }).then(() => setError(null), (e: ApiFailure) => setError(e.status === 403 ? "You can look, but only planners can change this page." : e.message));
      }, 600);
    },
    [key],
  );
  return { doc, loaded, save, error };
}

/** Reads another page's document once (the roadmap's epics on the OKR board, for instance). */
export function useDocOnce<T extends object>(key: DocKey): T | null | undefined {
  const [doc, setDoc] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    let gone = false;
    api<{ doc: T | null }>("GET", `/v1/docs/${key}`).then((r) => !gone && setDoc(r.doc), () => !gone && setDoc(null));
    return () => {
      gone = true;
    };
  }, [key]);
  return doc;
}
