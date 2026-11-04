"use client";

// The Class Studio exercise boards: a generated layout per board kind (studio-views*.tsx,
// planning-views.tsx) driven by the ported logic (studio-model*.ts). Loaded on demand by
// exercise-boards.tsx, so a page shows its first exercise before this bundle arrives.

import dynamic from "next/dynamic";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { STUDIO_KINDS, studioModel } from "@/components/studio-model";
import { LSA_KINDS, lsaModel } from "@/components/studio-model-lsa";
import { aartModel } from "@/components/studio-model-aart";
import { labModel } from "@/components/studio-model-lab";
import { agendaModel } from "@/components/studio-model-agenda";
import { AgendaView } from "@/components/studio-views-agenda";
import * as Views from "@/components/studio-views";
import * as Lsa from "@/components/studio-views-lsa";
import type { BoardProps } from "@/components/exercise-boards";
import { api } from "@/lib/api";

export { STUDIO_KINDS, LSA_KINDS };

// The two largest views come in their own bundles, only for the classes that use them: the
// Launching AI-Native ARTs board (planning-views.tsx, shared with the planning room) and the
// Value Architect lab.
const wait = () => <div className="faint" style={{ padding: 16 }}>Loading…</div>;
const AartView = dynamic(() => import("@/components/planning-views").then((m) => m.AartView), { ssr: false, loading: wait });
const LabView = dynamic(() => import("@/components/studio-views-lab").then((m) => m.LabView), { ssr: false, loading: wait });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VIEWS: Record<string, React.ComponentType<{ v: any }>> = {
  talk: Views.TalkView, quad: Views.QuadView, check: Views.CheckView, connect: Views.ConnectView, trust: Views.TrustView, bound: Views.BoundView, next: Views.NextView, vsm: Views.VsmView, ba: Views.BaView, rca: Views.RcaView,
  metrics: Views.MetView, ctx: Views.CtxView, accel: Views.AccView, wheel: Views.WheelView, evt: Views.EvtView, kanban: Views.KanView, pitch: Views.PitchView, disc: Views.DiscView, bv: Views.BvView, roam: Views.RoamView, art: Views.ArtView,
  // Leading SAFe (studio-views-lsa.tsx); an overview board picks its view from the exercise's setup.
  vote: Lsa.VoteView, vsid: Lsa.VsidView, delay: Lsa.DelayView, prin: Lsa.PrinView, sbd: Lsa.SbdView, dec: Lsa.DecView, emp: Lsa.EmpView, feat: Lsa.FeatView, wsjf: Lsa.WsjfView, rse: Lsa.RseView, cap: Lsa.CapView, attr: Lsa.AttrView,
  ov: ({ v }) => (v.view === "bp" ? <Lsa.OvBView v={v} /> : v.view === "pri" ? <Lsa.OvPView v={v} /> : <Lsa.OvDView v={v} />),
  // Launching AI-Native ARTs (planning-views.tsx, studio-model-aart.ts): one board kind, the step picks what it shows.
  aart: AartView,
  // The AI-Native Value Architect Mini Lab (studio-views-lab.tsx, studio-model-lab.ts).
  lab: LabView,
  // The class agenda kanban (studio-views-agenda.tsx, studio-model-agenda.ts).
  agenda: AgendaView,
};

/** A board from the Class Studio design: its generated layout, driven by the ported logic (studio-model.ts). */
export function StudioBoard({ kind, board, frame, config, st, op, readOnly, trainer }: BoardProps & { kind: string }) {
  const [ui, setUiState] = useState<Record<string, unknown>>({});
  const setUi = useCallback((p: Record<string, unknown>) => setUiState((u) => ({ ...u, ...p })), []);
  const ask = useCallback(async (prompt: string) => {
    try {
      return (await api<{ lines: string[] }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/suggest`, { prompt })).lines;
    } catch {
      return [];
    }
  }, [board.id]);
  // The PI Planning simulation builds its teams from the class's students; only the trainer may list them.
  const needsStudents = false as boolean;
  useEffect(() => {
    if (!needsStudents) return;
    let gone = false;
    api<{ students: { name: string }[] }>("GET", `/v1/boards/${encodeURIComponent(board.id)}/students`)
      .then((r) => !gone && setUi({ students: r.students.map((s) => s.name) }))
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [needsStudents, board.id, setUi]);
  const ctx = { kind, cfg: config, S: st, op, ui, setUi, trainer, readOnly, board, frame, ask };
  const v = kind === "aart" ? aartModel(ctx) : kind === "lab" ? labModel(ctx) : kind === "agenda" ? agendaModel(ctx) : LSA_KINDS.has(kind) ? lsaModel(ctx) : studioModel(ctx);
  const View = VIEWS[kind]!;
  return (
    <div className="studio-board">
      <View v={v} />
    </div>
  );
}

export default StudioBoard;
