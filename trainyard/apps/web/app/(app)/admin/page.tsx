"use client";

// The support console, for platform admins: every customer workspace, its plan and usage,
// the subscription from Stripe, when it was last touched, and the actions support needs.

import { useState } from "react";
import { api, setSupportWorkspace, useApi, useMe, type ApiFailure } from "@/lib/api";
import { CopyKey } from "@/components/copy-key";

type Row = {
  id: string;
  name: string;
  plan: "practice" | "trainer" | "academy";
  seats: number;
  status: "active" | "frozen";
  frozenReason?: string;
  note?: string;
  createdAt: string;
  supportVisitAt?: string;
  supportVisitBy?: string;
  owner: { id: string; name: string; email: string; disabled: boolean } | null;
  members: number;
  usage: { members: number; staff: number; boards: number; trains: number };
  limits: { members: number | null; staff: number | null; boards: number | null; trains: number | null };
  subscription: { status: string; interval: string; quantity: number; paidAt?: string; lastInvoiceAt?: string; lastFailureAt?: string; cancelledAt?: string; subscriptionId?: string } | null;
  lastActivityAt: string | null;
  lastAction: string | null;
};

export default function AdminPage() {
  const me = useMe();
  const list = useApi<{ workspaces: Row[]; platformId: string }>("/v1/admin/workspaces");
  const [err, setErr] = useState<string | null>(null);
  const [key, setKey] = useState<{ ws: string; apiKey: string; owner: string } | null>(null);
  const [edit, setEdit] = useState<{ id: string; plan: Row["plan"]; seats: number; note: string } | null>(null);
  const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "");
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
      list.reload();
    } catch (x) {
      setErr((x as ApiFailure).message);
    }
  };
  const open = (id: string) => {
    setSupportWorkspace(id);
    window.location.assign("/dashboards");
  };
  const exportJson = async (r: Row) => {
    const doc = await api<unknown>("GET", `/v1/admin/workspaces/${r.id}/export`);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.name}-export.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (me.data && !me.data.principal.platformAdmin) return <p className="error">The support console is for platform admins.</p>;
  if (list.error) return <p className="error">{list.error.message}</p>;
  const rows = list.data?.workspaces ?? [];
  const counts = { total: rows.length, paying: rows.filter((r) => r.plan !== "practice" && r.status === "active").length, frozen: rows.filter((r) => r.status === "frozen").length };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Support console</h1>
        <span className="faint">
          {counts.total} workspaces · {counts.paying} paying · {counts.frozen} frozen
        </span>
      </div>
      <p className="muted">
        “Open as support” switches this browser into the customer&apos;s workspace: you see what they see, every change you make lands in their audit log under your name, and the visit is noted on the workspace. Leave from the banner at the top.
      </p>
      {err ? <p className="error">{err}</p> : null}
      {key ? (
        <div className="notice ok stack">
          <b>New key for {key.owner}</b> (workspace {key.ws}). Shown once: pass it on through a channel you trust, then close this.
          <CopyKey value={key.apiKey} />
          <button className="btn small ghost" onClick={() => setKey(null)}>
            Close
          </button>
        </div>
      ) : null}
      <section className="panel">
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Usage</th>
                <th>Subscription</th>
                <th>Last activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={r.status === "frozen" ? { opacity: 0.75 } : undefined}>
                  <td>
                    <b>{r.name}</b>
                    <div className="faint mono" style={{ fontSize: 11 }}>
                      {r.id} · since {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                    {r.status === "frozen" ? <span className="chip crit">frozen · {r.frozenReason}</span> : null}
                    {r.note ? <div className="faint">{r.note}</div> : null}
                    {r.supportVisitAt ? (
                      <div className="faint" style={{ fontSize: 11 }}>
                        support: {r.supportVisitBy} · {when(r.supportVisitAt)}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {r.owner ? (
                      <>
                        {r.owner.name}
                        <div className="faint">{r.owner.email}</div>
                        {r.owner.disabled ? <span className="chip warn">disabled</span> : null}
                      </>
                    ) : (
                      <span className="faint">none</span>
                    )}
                  </td>
                  <td>
                    {edit?.id === r.id ? (
                      <div className="stack" style={{ gap: 6 }}>
                        <select className="select" value={edit.plan} onChange={(e) => setEdit({ ...edit, plan: e.target.value as Row["plan"] })} aria-label="Plan">
                          <option value="practice">practice</option>
                          <option value="trainer">trainer</option>
                          <option value="academy">academy</option>
                        </select>
                        <input className="input" type="number" min={1} value={edit.seats} onChange={(e) => setEdit({ ...edit, seats: Number(e.target.value) || 1 })} aria-label="Seats" style={{ width: 80 }} />
                        <input className="input" value={edit.note} placeholder="note (comped, refund…)" onChange={(e) => setEdit({ ...edit, note: e.target.value })} aria-label="Note" />
                        <div className="row">
                          <button className="btn small" onClick={() => void run(async () => api("PATCH", `/v1/admin/workspaces/${r.id}`, { plan: edit.plan, seats: edit.seats, note: edit.note })).then(() => setEdit(null))}>
                            Save
                          </button>
                          <button className="btn small ghost" onClick={() => setEdit(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="chip">{r.plan}</span> {r.plan !== "practice" ? `× ${r.seats}` : ""}
                        <div>
                          <button className="btn small ghost" onClick={() => setEdit({ id: r.id, plan: r.plan, seats: r.seats, note: r.note ?? "" })}>
                            Change
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {r.usage.members}/{r.limits.members ?? "∞"} people · {r.usage.staff}/{r.limits.staff ?? "∞"} trainers
                    <br />
                    {r.usage.boards}/{r.limits.boards ?? "∞"} boards · {r.usage.trains}/{r.limits.trains ?? "∞"} trains
                  </td>
                  <td>
                    {r.subscription ? (
                      <>
                        <span className={`chip ${r.subscription.status === "paid" ? "ok" : r.subscription.status === "open" ? "" : "warn"}`}>{r.subscription.status}</span>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {r.subscription.interval} · {r.subscription.quantity} seats
                          {r.subscription.lastInvoiceAt ? ` · paid ${new Date(r.subscription.lastInvoiceAt).toLocaleDateString()}` : ""}
                          {r.subscription.lastFailureAt ? ` · failed ${new Date(r.subscription.lastFailureAt).toLocaleDateString()}` : ""}
                        </div>
                      </>
                    ) : (
                      <span className="faint">none</span>
                    )}
                  </td>
                  <td className="faint" style={{ fontSize: 12 }}>
                    {when(r.lastActivityAt) || "never"}
                    {r.lastAction ? <div className="mono">{r.lastAction}</div> : null}
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 4 }}>
                      <button className="btn small" onClick={() => open(r.id)}>
                        Open as support
                      </button>
                      {r.status === "frozen" ? (
                        <button className="btn small ghost" onClick={() => void run(() => api("PATCH", `/v1/admin/workspaces/${r.id}`, { status: "active" }))}>
                          Thaw
                        </button>
                      ) : (
                        <button className="btn small ghost" onClick={() => void run(() => api("PATCH", `/v1/admin/workspaces/${r.id}`, { status: "frozen", frozenReason: `frozen by support (${me.data?.principal.name ?? "support"})` }))}>
                          Freeze
                        </button>
                      )}
                      <button
                        className="btn small ghost"
                        title="Rotates the owner's key; the old one stops working"
                        onClick={() =>
                          void run(async () => {
                            const res = await api<{ apiKey: string; owner: { name: string } }>("POST", `/v1/admin/workspaces/${r.id}/owner-key`);
                            setKey({ ws: r.name, apiKey: res.apiKey, owner: res.owner.name });
                          })
                        }
                      >
                        New owner key
                      </button>
                      <button className="btn small ghost" onClick={() => void exportJson(r)}>
                        Export JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="faint">
                    No customer workspaces yet. They appear when someone signs up on the website.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
