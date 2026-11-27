"use client";
import Link from "next/link";
import { useApi } from "@/lib/api";

type Summary = { workspace: { plan: string } | null; limits: Record<string, number | boolean | null> | null; usage: Record<string, number> };
const WHAT: [key: string, one: string, many: string][] = [["boards", "board or class", "boards and classes"], ["members", "person", "people"], ["rooms", "room", "rooms"]];

/** How close the workspace is to its plan's limits: a quiet meter that turns into a warning at 80%. */
export function PlanMeter({ only }: { only?: string[] }) {
  const { data } = useApi<Summary>("/v1/billing/workspace");
  if (!data?.limits || !data.workspace) return null;
  const rows = WHAT.filter(([k]) => !only || only.includes(k)).map(([k, one, many]) => ({ k, one, many, limit: data.limits![k], used: data.usage[k] ?? 0 })).filter((r): r is typeof r & { limit: number } => typeof r.limit === "number" && r.limit > 0);
  if (!rows.length) return null;
  const worst = rows.reduce((a, b) => (b.used / b.limit > a.used / a.limit ? b : a));
  const left = worst.limit - worst.used, state = left <= 0 ? "full" : worst.used / worst.limit >= 0.8 || left === 1 ? "near" : "ok";
  const free = data.workspace.plan === "practice";
  return (
    <aside className={`plan-meter ${state}`} role={state === "ok" ? undefined : "status"} aria-label="Plan limits">
      <div className="plan-meter-rows">
        {rows.map((r) => {
          const pct = Math.min(100, (r.used / r.limit) * 100), s = r.used >= r.limit ? "full" : pct >= 80 || r.limit - r.used === 1 ? "near" : "ok";
          return (
            <div key={r.k} className={`plan-meter-row ${s}`}>
              <span><b>{r.used}</b> of {r.limit} {r.many}</span>
              <i role="meter" aria-valuemin={0} aria-valuemax={r.limit} aria-valuenow={Math.min(r.used, r.limit)} aria-label={`${r.used} of ${r.limit} ${r.many} used`}><i style={{ width: `${pct}%` }} /></i>
            </div>
          );
        })}
      </div>
      {state !== "ok" ? (
        <p>
          <b>{state === "full" ? `You have reached the limit of ${worst.limit} ${worst.many}.` : `${left} ${left === 1 ? worst.one : worst.many} left on ${free ? "the free plan" : "your plan"}.`}</b>{" "}
          {worst.k === "boards" ? "Archive a class or delete a board you no longer need to make room" : "Remove what you no longer need"}, or <Link href="/billing">see the plans</Link>.
        </p>
      ) : null}
    </aside>
  );
}
