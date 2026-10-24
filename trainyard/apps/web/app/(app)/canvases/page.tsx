"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CanvasTypeDef, ValueStreamIdentification } from "@trainyard/core";
import { CanvasCards, type CanvasSummary } from "@/components/canvas-cards";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

// In the order of the implementation roadmap: the strategy and the epics that fund it, then
// launching the train (LACE, value streams, the ART and its readiness), then the content it plans.
const GROUPS: [string, string[]][] = [
  ["Strategy and portfolio", ["portfolio-canvas", "swot", "tows", "portfolio-vision"]],
  ["Epics and the Portfolio Kanban", ["epic-hypothesis", "lean-business-case"]],
  ["Launching the train", ["lace-mission", "dvs-canvas", "art-canvas", "art-launch"]],
  ["Readying the ART backlog", ["feature-canvas", "enabler-canvas"]],
];

export default function CanvasesPage() {
  const router = useRouter();
  const data = useApi<{ types: CanvasTypeDef[]; canvases: CanvasSummary[] }>("/v1/canvases");
  const vs = useApi<{ identifications: ValueStreamIdentification[] }>("/v1/value-streams");
  const [err, setErr] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  if (!data.data) return <Loading error={data.error} />;
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
        sub="SAFe's working artifacts, kept as structured data, in the order you use them: strategy and epics, launching the train, readying the backlog for PI planning. Readiness, WSJF and risks have their own page beside this one."
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
          <CanvasCards ids={ids} types={data.data!.types} canvases={data.data!.canvases} onError={setErr} />
        </section>
      ))}
    </>
  );
}
