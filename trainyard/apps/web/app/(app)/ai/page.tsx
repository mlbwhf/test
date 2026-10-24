"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGES, STAGE_LABELS } from "@trainyard/ai-portfolio";
import { formatValue } from "@/components/charts";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { TIER_CHIP, type InitiativeView } from "@/lib/ai";
import { api, useApi, type ApiFailure } from "@/lib/api";

export default function AiPortfolioPage() {
  const { data, error, reload } = useApi<{ initiatives: InitiativeView[] }>("/v1/ai/initiatives");
  const ws = useApi<{ workspace: { people: { id: string; name: string }[] } }>("/v1/workspace");
  const [creating, setCreating] = useState(false);
  if (!data || !ws.data) return <Loading error={error ?? ws.error} />;
  const live = data.initiatives.filter((i) => i.stage !== "retired");
  const spend = live.reduce((s, i) => s + i.spend.spent, 0);
  const blocked = live.filter((i) => i.nextGate && !i.nextGate.allowed).length;
  const high = live.filter((i) => i.riskTier === "high").length;

  return (
    <>
      <PageHead
        title="AI portfolio"
        sub="Every AI initiative from idea to production, with evidence-based stage gates that tighten with EU AI Act risk tier, spend against budget and value against KPIs."
        actions={
          <button className="btn primary" onClick={() => setCreating((v) => !v)}>
            {creating ? "Close" : "New AI initiative"}
          </button>
        }
      />
      {creating ? <CreateInitiative people={ws.data.workspace.people} onCreated={() => (setCreating(false), void reload())} /> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Stat label="Live initiatives" value={String(live.length)} />
        <Stat label="High-risk" value={String(high)} tone={high ? "crit" : undefined} />
        <Stat label="Blocked at next gate" value={String(blocked)} tone={blocked ? "warn" : undefined} />
        <Stat label="Spend this month" value={formatValue(spend, "currency")} />
      </div>

      <div className="scroll-x" tabIndex={0}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length - 1}, minmax(190px, 1fr))`, gap: 10, minWidth: (STAGES.length - 1) * 190 }}>
          {STAGES.filter((s) => s !== "retired").map((stage, n) => (
            <div key={stage} className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: "space-between", borderBottom: "2px solid var(--line-strong)", paddingBottom: 6 }}>
                <span className="eyebrow">
                  {n + 1}. {STAGE_LABELS[stage]}
                </span>
                <span className="mono faint">{live.filter((i) => i.stage === stage).length}</span>
              </div>
              {live
                .filter((i) => i.stage === stage)
                .map((i) => (
                  <Link key={i.id} href={`/ai/${i.id}`} className="panel card" style={{ padding: 10, textDecoration: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    <strong style={{ lineHeight: 1.3 }}>{i.name}</strong>
                    <div className="row" style={{ gap: 4 }}>
                      <span className={`chip ${TIER_CHIP[i.riskTier]}`}>{i.riskTier} risk</span>
                      <span className="chip">{i.useCase}</span>
                    </div>
                    <div className="row mono" style={{ justifyContent: "space-between", fontSize: "0.75rem" }}>
                      <span className={i.spend.state === "ok" ? "faint" : ""} style={{ color: i.spend.state === "over" ? "var(--crit)" : i.spend.state === "watch" ? "var(--warn)" : undefined }}>
                        {formatValue(i.spend.spent, "currency")} / {formatValue(i.spend.budget, "currency")}
                      </span>
                      {i.valueRealised !== null ? <span className="faint">value {i.valueRealised}%</span> : null}
                    </div>
                    {i.nextGate ? (
                      <div style={{ fontSize: "0.78rem", color: i.nextGate.allowed ? "var(--ok)" : "var(--warn)" }}>
                        {i.nextGate.allowed ? `Ready for ${STAGE_LABELS[i.nextGate.to]}` : `${i.nextGate.blockers.length} blocker${i.nextGate.blockers.length > 1 ? "s" : ""} before ${STAGE_LABELS[i.nextGate.to]}`}
                      </div>
                    ) : null}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "crit" | "warn" | undefined }) {
  return (
    <div className="panel panel-body stack" style={{ gap: 2 }}>
      <span className="eyebrow">{label}</span>
      <span className="mono" style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, color: tone ? `var(--${tone})` : undefined }}>
        {value}
      </span>
    </div>
  );
}

function CreateInitiative({ people, onCreated }: { people: { id: string; name: string }[]; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", problem: "", useCase: "assistant", riskTier: "minimal", ownerId: people[0]?.id ?? "", oversight: "in-the-loop", monthlyBudget: 1000 });
  const [err, setErr] = useState<ApiFailure | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: k === "monthlyBudget" ? Number(e.target.value) : e.target.value });
  return (
    <form
      className="panel panel-body stack"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("POST", "/v1/ai/initiatives", form);
          onCreated();
        } catch (x) {
          setErr(x as ApiFailure);
        }
      }}
    >
      {err ? <ErrorList title="Could not create the initiative" items={[{ message: err.message }]} /> : null}
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 220px" }}>
          Name
          <input id="ai-name" className="input" required value={form.name} onChange={set("name")} />
        </label>
        <label className="field">
          Use case
          <select id="ai-usecase" className="select" value={form.useCase} onChange={set("useCase")}>
            {["assistant", "agent", "predictive", "classification", "generation", "other"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Risk tier (EU AI Act)
          <select id="ai-tier" className="select" value={form.riskTier} onChange={set("riskTier")}>
            {["minimal", "limited", "high", "prohibited"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Accountable owner
          <select id="ai-owner" className="select" value={form.ownerId} onChange={set("ownerId")}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Human oversight
          <select id="ai-oversight" className="select" value={form.oversight} onChange={set("oversight")}>
            <option value="in-the-loop">Human in the loop</option>
            <option value="on-the-loop">Human on the loop</option>
            <option value="out-of-loop">No human review</option>
          </select>
        </label>
        <label className="field">
          Monthly budget (USD)
          <input id="ai-budget" className="input" type="number" min={0} value={form.monthlyBudget} onChange={set("monthlyBudget")} style={{ width: 120 }} />
        </label>
      </div>
      <label className="field">
        Problem it solves
        <textarea id="ai-problem" className="textarea" required value={form.problem} onChange={set("problem")} />
      </label>
      <div>
        <button className="btn primary" type="submit">
          Create initiative
        </button>
      </div>
    </form>
  );
}
