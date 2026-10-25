"use client";

import { useEffect, useState } from "react";
import type { Board } from "@trainyard/core";
import { api } from "@/lib/api";

/**
 * Which saved templates hold a class (`fields.class`): those belong to the Classes space, not the
 * template gallery. Template summaries carry no fields, so each saved template is read once.
 * Null until known.
 */
export function useSavedClassTemplates(ids: string[] | undefined): Set<string> | null {
  const key = ids ? ids.join(",") : null;
  const [found, setFound] = useState<{ key: string; ids: Set<string> } | null>(null);
  useEffect(() => {
    if (key === null) return;
    let live = true;
    const list = key ? key.split(",") : [];
    void Promise.all(list.map((id) => api<{ board: Board }>("GET", `/v1/templates/boards/${encodeURIComponent(id)}`).then((r) => (r.board.fields?.class ? id : null), () => null))).then((r) => {
      if (live) setFound({ key, ids: new Set(r.filter((x): x is string => !!x)) });
    });
    return () => {
      live = false;
    };
  }, [key]);
  return found && found.key === key ? found.ids : null;
}
