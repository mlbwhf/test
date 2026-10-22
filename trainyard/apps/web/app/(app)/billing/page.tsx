"use client";

// Plan & billing for a workspace owner: what the plan allows, what is in use, upgrade from
// Practice without leaving the page, add trainers or trains, open Stripe's portal for the
// card and invoices, export everything as JSON.

import Link from "next/link";
import { useMemo, useState } from "react";
import { InlinePayment, money, type Claim, type Subscription } from "@/components/pay-inline";
import { api, useApi, type ApiFailure } from "@/lib/api";
import { PLANS, type PlanId } from "@/lib/pricing";

type Limits = { members: number | null; staff: number | null; boards: number | null; trains: number | null };
type Usage = { members: number; staff: number; boards: number; trains: number };
type Summary = {
  enabled: boolean;
  inPage: boolean;
  publishableKey?: string;
  plans: Record<string, boolean>;
  workspace: { id: string; name: string; plan: PlanId; seats: number; status: "active" | "frozen"; frozenReason?: string; createdAt: string; note?: string } | null;
  limits: Limits | null;
  usage: Usage;
  subscription: { id: string; status: string; plan: string; interval: string; quantity: number; paidAt?: string; lastInvoiceAt?: string; lastFailureAt?: string; cancelledAt?: string; hasSubscription: boolean } | null;
  canManage: boolean;
};

const ROWS: { key: keyof Usage; label: string }[] = [
  { key: "members", label: "People who can sign in" },
  { key: "staff", label: "Trainers and planners" },
  { key: "boards", label: "Boards of your own" },
  { key: "trains", label: "Trains" },
];

export default function BillingPage() {
  const summary = useApi<Summary>("/v1/billing/workspace");
  const [err, setErr] = useState<string | null>(null);
  const [pay, setPay] = useState<{ sub: Subscription; plan: PlanId; interval: "monthly" | "yearly"; quantity: number } | null>(null);
  const [paid, setPaid] = useState<Claim | null>(null);
  const [choice, setChoice] = useState<{ plan: PlanId; interval: "monthly" | "yearly"; quantity: number }>({ plan: "trainer", interval: "monthly", quantity: 1 });
  const [seats, setSeats] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const data = summary.data;
  const ws = data?.workspace ?? null;
  const unit = ws?.plan === "academy" ? "train" : "trainer";
  const email = useMemo(() => "", []);

  const start = async () => {
    setErr(null);
    setBusy(true);
    try {
      const sub = await api<Subscription>("POST", "/v1/billing/subscribe", choice);
      setPay({ sub, ...choice });
    } catch (x) {
      setErr((x as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  const changeSeats = async () => {
    setErr(null);
    setBusy(true);
    try {
      await api("POST", "/v1/billing/seats", { quantity: Number(seats) });
      setSeats("");
      summary.reload();
    } catch (x) {
      setErr((x as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  const portal = async () => {
    setErr(null);
    try {
      const { url } = await api<{ url: string }>("POST", "/v1/billing/portal");
      window.location.assign(url);
    } catch (x) {
      setErr((x as ApiFailure).message);
    }
  };
  const exportJson = async () => {
    const doc = await api<unknown>("GET", "/v1/workspace/export");
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ws?.name ?? "workspace"}-export.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (summary.error) return <p className="error">{summary.error.message}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  if (!ws)
    return (
      <div className="stack">
        <h1>Plan &amp; billing</h1>
        <p className="muted">This is the platform workspace; it has no plan. Customer workspaces are under the Support console.</p>
      </div>
    );
  const planDef = PLANS.find((p) => p.id === ws.plan)!;
  const price = (plan: PlanId, interval: "monthly" | "yearly") => {
    const p = PLANS.find((x) => x.id === plan)!;
    return interval === "yearly" ? (p.yearly ?? 0) * 12 : (p.monthly ?? 0);
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Plan &amp; billing</h1>
        <div className="row">
          <button className="btn small ghost" onClick={() => void exportJson()}>
            Export workspace (JSON)
          </button>
          {data.subscription?.hasSubscription && data.enabled ? (
            <button className="btn small" onClick={() => void portal()}>
              Card, invoices, cancel
            </button>
          ) : null}
        </div>
      </div>
      {err ? <p className="error">{err}</p> : null}

      <section className="panel">
        <div className="panel-head">
          <h2>
            {ws.name} · <span className="chip">{planDef.name}</span>
          </h2>
          <span className="faint">
            {ws.plan === "practice" ? "free" : `${ws.seats} ${unit}${ws.seats > 1 ? "s" : ""} · ${data.subscription?.interval ?? "monthly"}`} · {ws.status}
          </span>
        </div>
        <div className="panel-body stack">
          {ws.status === "frozen" ? (
            <div className="notice crit">
              <b>Read-only.</b> {ws.frozenReason}. Pick a plan below to reactivate; everything is still here.
            </div>
          ) : null}
          {data.subscription?.status === "past_due" ? <div className="notice warn">The last payment failed. Update the card under “Card, invoices, cancel”; the workspace stays open while Stripe retries.</div> : null}
          <table className="table">
            <thead>
              <tr>
                <th>What</th>
                <th>In use</th>
                <th>Plan allows</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const limit = data.limits?.[r.key] ?? null;
                const used = data.usage[r.key];
                const over = limit !== null && used >= limit;
                return (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td className="mono">{used}</td>
                    <td className={over ? "warn" : ""}>{limit === null ? "unlimited" : `${limit}${over ? " · at the limit" : ""}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ws.note ? <p className="faint">Note from Trainyard: {ws.note}</p> : null}
        </div>
      </section>

      {paid ? (
        <section className="panel">
          <div className="panel-body stack">
            <h2>Thank you.</h2>
            <p>
              {ws.name} is now on <b>{paid.workspace?.plan ?? paid.plan}</b>
              {paid.workspace ? ` with ${paid.workspace.seats} ${paid.workspace.plan === "academy" ? "train" : "trainer"}${paid.workspace.seats > 1 ? "s" : ""}` : ""}. Your sign-in does not change.
            </p>
            <button
              className="btn"
              onClick={() => {
                setPaid(null);
                summary.reload();
              }}
            >
              Continue
            </button>
          </div>
        </section>
      ) : pay && data.publishableKey ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Payment</h2>
          </div>
          <div className="panel-body ly">
            <InlinePayment
              publishableKey={data.publishableKey}
              sub={pay.sub}
              email={email}
              summary={`${PLANS.find((p) => p.id === pay.plan)!.name} · ${pay.quantity} ${pay.plan === "academy" ? "train" : "trainer"}${pay.quantity > 1 ? "s" : ""} · billed ${pay.interval}`}
              onPaid={(c) => {
                setPay(null);
                setPaid(c);
              }}
              onBack={() => setPay(null)}
            />
          </div>
        </section>
      ) : data.canManage && data.enabled ? (
        <>
          {ws.plan !== "practice" && ws.status === "active" && data.subscription?.hasSubscription ? (
            <section className="panel">
              <div className="panel-head">
                <h2>More {unit}s</h2>
                <span className="faint">billed now, pro rata; the price per {unit} stays the same</span>
              </div>
              <div className="panel-body row">
                <label className="row" style={{ gap: 8 }}>
                  {unit}s on the plan
                  <input className="input" type="number" min={1} max={500} value={seats} placeholder={String(ws.seats)} onChange={(e) => setSeats(e.target.value)} style={{ width: 90 }} />
                </label>
                <button className="btn" disabled={busy || !seats || Number(seats) === ws.seats} onClick={() => void changeSeats()}>
                  Update
                </button>
                {seats && Number(seats) > ws.seats ? (
                  <span className="faint">
                    + {money(price(ws.plan, (data.subscription?.interval as "monthly" | "yearly") ?? "monthly") * (Number(seats) - ws.seats) * 100, "usd")} per {data.subscription?.interval === "yearly" ? "year" : "month"}
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}
          {ws.plan === "practice" || ws.status === "frozen" ? (
            <section className="panel">
              <div className="panel-head">
                <h2>{ws.status === "frozen" ? "Reactivate" : "Upgrade"}</h2>
                <span className="faint">paid on this page, by card</span>
              </div>
              <div className="panel-body stack">
                <div className="row" role="group" aria-label="Plan">
                  {(["trainer", "academy"] as PlanId[]).map((p) => (
                    <button key={p} type="button" className={`btn ${choice.plan === p ? "" : "ghost"}`} onClick={() => setChoice({ ...choice, plan: p })} aria-pressed={choice.plan === p}>
                      {PLANS.find((x) => x.id === p)!.name}
                    </button>
                  ))}
                  <span style={{ width: 16 }} />
                  <button type="button" className={`btn small ${choice.interval === "monthly" ? "" : "ghost"}`} onClick={() => setChoice({ ...choice, interval: "monthly" })}>
                    Monthly
                  </button>
                  <button type="button" className={`btn small ${choice.interval === "yearly" ? "" : "ghost"}`} onClick={() => setChoice({ ...choice, interval: "yearly" })}>
                    Yearly (2 months free)
                  </button>
                </div>
                <p className="muted">{PLANS.find((x) => x.id === choice.plan)!.blurb}</p>
                <div className="row">
                  <label className="row" style={{ gap: 8 }}>
                    {choice.plan === "academy" ? "Trains" : "Trainers"}
                    <input className="input" type="number" min={1} max={500} value={choice.quantity} onChange={(e) => setChoice({ ...choice, quantity: Math.max(1, Number(e.target.value) || 1) })} style={{ width: 80 }} />
                  </label>
                  <button className="btn primary" disabled={busy || !data.plans[`${choice.plan}-${choice.interval}`]} onClick={() => void start()}>
                    {busy ? "One moment…" : `Pay ${money(price(choice.plan, choice.interval) * choice.quantity * 100, "usd")} ${choice.interval === "yearly" ? "a year" : "a month"}`}
                  </button>
                </div>
                {!data.inPage ? <p className="faint">In-page payment is not enabled on this server; ask the operator.</p> : null}
              </div>
            </section>
          ) : null}
        </>
      ) : !data.enabled ? (
        <p className="muted">Payments are not set up on this server. Plans are changed by the operator.</p>
      ) : (
        <p className="muted">Only the workspace admin can change the plan.</p>
      )}
      <p className="faint">
        Questions about a charge? <Link href="/#faq">Pricing FAQ</Link>.
      </p>
    </div>
  );
}
