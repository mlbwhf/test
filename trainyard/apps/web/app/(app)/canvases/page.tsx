"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CanvasTypeDef, ValueStreamIdentification } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface Summary {
  id: string;
  type: string;
  title: string;
  state?: "current" | "future";
  asOf?: string;
  updatedAt: string;
}

const GROUPS: [string, string[]][] = [
  ["Strategy and portfolio", ["portfolio-canvas", "swot", "tows", "portfolio-vision", "lace-mission"]],
  ["Epics and the Portfolio Kanban", ["epic-hypothesis", "lean-business-case"]],
  ["Value streams and trains", ["dvs-canvas", "art-canvas", "art-launch"]],
  ["ART backlog", ["feature-canvas", "enabler-canvas"]],
];

export default function CanvasesPage() {
  const router = useRouter();
  const data = useApi<{ types: CanvasTypeDef[]; canvases: Summary[] }>("/v1/canvases");
  const vs = useApi<{ identifications: ValueStreamIdentification[] }>("/v1/value-streams");
  const [err, setErr] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  if (!data.data) return <Loading error={data.error} />;
  const typeOf = (id: string) => data.data!.types.find((t) => t.id === id);

  const create = async (type: string) => {
    try {
      const r = await api<{ canvas: { id: string } }>("POST", "/v1/canvases", { type });
      router.push(`/canvases/${encodeURIComponent(r.canvas.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const generate = async () => {
    const [kind, identificationId, refId] = from.split("|");
    if (!kind || !identificationId || !refId) return;
    try {
      const r = await api<{ canvas: { id: string } }>("POST", "/v1/canvases/from-identification", { kind, identificationId, refId });
      router.push(`/canvases/${encodeURIComponent(r.canvas.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <PageHead
        title="Canvases"
        sub="SAFe's working artifacts, kept as structured data: the portfolio canvas and its future state, SWOT and TOWS, the portfolio vision, LACE mission, epic hypothesis and Lean business case, value stream and ART canvases, ART launch readiness, feature and enabler canvases."
      />
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      <section className="panel panel-body row" style={{ justifyContent: "space-between" }}>
        <span>
          <b>Envision the future state.</b> <span className="muted">Current portfolio canvas → SWOT and TOWS → candidate future states → scored decision → the epics and enablers that get there.</span>
        </span>
        <Link href="/portfolio/vision" className="btn primary">
          Open the workshop
        </Link>
      </section>

      {vs.data?.identifications.length ? (
        <section className="panel panel-body row">
          <span className="eyebrow">Prefill from a value stream identification</span>
          <select className="select" aria-label="Development value stream or train" value={from} onChange={(e) => setFrom(e.target.value)} style={{ flex: "1 1 320px" }}>
            <option value="">Pick a development value stream or a train…</option>
            {vs.data.identifications.flatMap((v) => [
              ...v.devStreams.map((d) => (
                <option key={`d-${v.id}-${d.id}`} value={`dvs|${v.id}|${d.id}`}>
                  {v.name} · development value stream canvas: {d.name}
                </option>
              )),
              ...v.arts.map((a) => (
                <option key={`a-${v.id}-${a.id}`} value={`art|${v.id}|${a.id}`}>
                  {v.name} · ART canvas: {a.name}
                </option>
              )),
            ])}
          </select>
          <button className="btn primary" disabled={!from} onClick={() => void generate()}>
            Create prefilled canvas
          </button>
        </section>
      ) : null}

      {GROUPS.map(([group, ids]) => (
        <section key={group} className="stack">
          <h2>{group}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {ids.map((id) => {
              const t = typeOf(id);
              if (!t) return null;
              const mine = data.data!.canvases.filter((c) => c.type === id);
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
        </section>
      ))}
    </>
  );
}
