"use client";

// Canvas types as cards, each with the canvases already made from it and a New button. The
// Canvases page shows every group; the readiness page shows the ones a launch needs.

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CanvasTypeDef } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

export interface CanvasSummary {
  id: string;
  type: string;
  title: string;
  state?: "current" | "future";
  asOf?: string;
  updatedAt: string;
}

export function CanvasCards({ ids, types, canvases, onError }: { ids: string[]; types: CanvasTypeDef[]; canvases: CanvasSummary[]; onError: (message: string) => void }) {
  const router = useRouter();
  const create = async (type: string) => {
    try {
      const r = await api<{ canvas: { id: string } }>("POST", "/v1/canvases", { type });
      router.push(`/canvases/${encodeURIComponent(r.canvas.id)}`);
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
      {ids.map((id) => {
        const t = types.find((x) => x.id === id);
        if (!t) return null;
        const mine = canvases.filter((c) => c.type === id);
        return (
          <article key={id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="eyebrow">{t.where}</span>
            <b style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{t.name}</b>
            <span className="faint" style={{ fontSize: "0.84rem", lineHeight: 1.45 }}>
              {t.blurb}
            </span>
            <div className="stack" style={{ gap: 4, marginTop: 4 }}>
              {mine.map((c) => (
                <Link key={c.id} href={`/canvases/${encodeURIComponent(c.id)}`} style={{ fontWeight: 600 }}>
                  {c.title}
                  {c.state ? <span className="chip" style={{ marginLeft: 6 }}>{c.state} state</span> : null}
                  {c.asOf ? <span className="faint" style={{ marginLeft: 6, fontSize: "0.8rem" }}>{c.asOf}</span> : null}
                </Link>
              ))}
            </div>
            <button className="btn small" style={{ alignSelf: "flex-start", marginTop: "auto" }} onClick={() => void create(id)}>
              New {t.name.toLowerCase()}
            </button>
          </article>
        );
      })}
    </div>
  );
}
