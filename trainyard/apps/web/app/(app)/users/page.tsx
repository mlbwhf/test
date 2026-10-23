"use client";

import { useState } from "react";
import type { Person } from "@trainyard/core";
import { CopyKey } from "@/components/copy-key";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, setApiKey, useApi, useMe, type ApiFailure, type Me } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  disabled?: boolean;
  personId?: string;
  hasPassword?: boolean;
}
interface Signup {
  id: string;
  name: string;
  email: string;
  plan: "practice" | "trainer" | "academy";
  audience: "trainer" | "enterprise";
  company?: string;
  seats?: number;
  note?: string;
  source?: string;
  createdAt: string;
  status: "new" | "invited" | "declined";
}
interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: unknown;
}

const ROLES = [
  ["admin", "Admin: everything, including users, the operating model and sync"],
  ["planner", "Planner: board, dashboards, portfolio, AI initiatives and sync"],
  ["architect", "AI value architect: planner rights plus stage-gate sign-off"],
  ["viewer", "Viewer: read everything, change nothing"],
] as const;

export default function UsersPage() {
  const me = useMe();
  const users = useApi<{ users: User[] }>("/v1/users");
  const ws = useApi<{ workspace: { people: Person[] } }>("/v1/workspace");
  const audit = useApi<{ entries: AuditEntry[] }>("/v1/audit?limit=40");
  const signups = useApi<{ signups: Signup[] }>("/v1/signups");
  const [issued, setIssued] = useState<{ name: string; key: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!me.data) return <Loading error={me.error} />;
  if (!me.data.permissions.users) return <div className="notice warn">Only admins can manage users.</div>;
  if (!users.data || !ws.data) return <Loading error={users.error ?? ws.error} />;
  const people = ws.data.workspace.people;

  const patch = async (u: User, body: object) => {
    try {
      await api("PATCH", `/v1/users/${u.id}`, body);
      setErr(null);
      await users.reload();
      await audit.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <PageHead title="Users" sub={me.data.open ? "The API is running open: anyone who can reach it acts as an admin. Create the first user to turn authentication on." : "People sign in with email and password, or with an API key for scripts and integrations. Passwords and keys are stored hashed; keys are shown once."} />
      <MyPassword me={me.data} users={users.data.users} onChanged={() => void users.reload()} />
      {me.data.open ? <div className="notice warn">Open mode. Create an admin user for yourself first, copy the key, then sign in with it.</div> : null}
      {err ? <ErrorList title="Could not update the user" items={[{ message: err }]} /> : null}
      {issued ? (
        <div className="notice" style={{ borderColor: "var(--signal)" }}>
          <strong>Key for {issued.name}</strong>
          <p>Copy it now; it is not shown again.</p>
          <CopyKey value={issued.key} />
        </div>
      ) : null}

      <section className="panel scroll-x">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Person</th>
              <th>Status</th>
              <th>Password</th>
              <th>Key</th>
            </tr>
          </thead>
          <tbody>
            {users.data.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <div className="faint" style={{ fontSize: "0.8rem" }}>{u.email}</div>
                </td>
                <td>
                  <select id={`role-${u.id}`} aria-label={`Role for ${u.name}`} className="select" value={u.role} onChange={(e) => patch(u, { role: e.target.value })}>
                    {ROLES.map(([r]) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select id={`person-${u.id}`} aria-label={`Person for ${u.name}`} className="select" value={u.personId ?? ""} onChange={(e) => patch(u, { personId: e.target.value || null })}>
                    <option value="">Not linked</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn small" onClick={() => patch(u, { disabled: !u.disabled })}>
                    {u.disabled ? "Enable" : "Disable"}
                  </button>
                </td>
                <td>
                  <SetPassword user={u} onDone={() => void users.reload()} onError={setErr} />
                </td>
                <td>
                  <button
                    className="btn small"
                    onClick={async () => {
                      const r = await api<{ apiKey: string }>("POST", `/v1/users/${u.id}/rotate-key`);
                      setIssued({ name: u.name, key: r.apiKey });
                    }}
                  >
                    New key
                  </button>
                </td>
              </tr>
            ))}
            {users.data.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="faint">
                  No users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <NewUser
        people={people}
        onCreated={(name, key) => {
          // The first user closes open mode. Whoever created it is sitting at this browser,
          // so keep their key here or the very next request would bounce them to sign in.
          if (me.data?.open) setApiKey(key);
          setIssued({ name, key });
          void users.reload();
          void me.reload();
          void audit.reload();
        }}
      />

      <section className="panel">
        <div className="panel-head">
          <h2>Sign-ups from the website</h2>
          <span className="faint">{(signups.data?.signups ?? []).filter((s) => s.status === "new").length} waiting</span>
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Plan</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(signups.data?.signups ?? []).map((s) => (
                <tr key={s.id} style={s.status !== "new" ? { opacity: 0.6 } : undefined}>
                  <td className="mono faint" style={{ whiteSpace: "nowrap" }}>{s.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td>
                    <strong>{s.name}</strong>
                    <div className="faint" style={{ fontSize: "0.8rem" }}>
                      <a href={`mailto:${s.email}`}>{s.email}</a>
                      {s.company ? ` · ${s.company}` : ""}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{s.plan}</span> <span className="faint" style={{ fontSize: "0.78rem" }}>{s.audience}{s.seats ? ` · ${s.seats} ${s.plan === "academy" ? "trains" : "trainers"}` : ""}</span>
                  </td>
                  <td style={{ fontSize: "0.84rem", maxWidth: 320 }}>
                    {s.note ? <div>{s.note}</div> : null}
                    {s.source ? <div className="faint mono" style={{ fontSize: "0.72rem" }}>from {s.source}</div> : null}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {s.status === "new" ? (
                        <>
                          <button className="btn small" onClick={() => void api("PATCH", `/v1/signups/${s.id}`, { status: "invited" }).then(() => signups.reload())} title="Create the user above, send them the key, then mark the sign-up invited">
                            Invited
                          </button>
                          <button className="btn small ghost" onClick={() => void api("PATCH", `/v1/signups/${s.id}`, { status: "declined" }).then(() => signups.reload())}>
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="chip">{s.status}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(signups.data?.signups ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="faint">
                    Nobody has signed up yet. Sign-ups arrive from the website form; set TRAINYARD_SIGNUP_WEBHOOK to be told elsewhere too.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Billing admin={me.data?.principal.role === "admin"} />

      <section className="panel">
        <div className="panel-head">
          <h2>Recent changes</h2>
          <span className="faint">audit log</span>
        </div>
        <table className="table">
          <tbody>
            {(audit.data?.entries ?? []).map((e, n) => (
              <tr key={n}>
                <td className="mono faint" style={{ whiteSpace: "nowrap" }}>{e.at.slice(0, 16).replace("T", " ")}</td>
                <td className="mono">{e.actor}</td>
                <td>{e.action}</td>
                <td className="faint mono" style={{ fontSize: "0.75rem" }}>{e.detail ? JSON.stringify(e.detail) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function MyPassword({ me, users, onChanged }: { me: Me; users: User[]; onChanged: () => void }) {
  const mine = users.find((u) => u.id === me.principal.userId);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const bySession = typeof window !== "undefined" && (localStorage.getItem("trainyard.apiKey") ?? "").startsWith("ts_");
  if (me.principal.anonymous) return null;
  if (!mine)
    return (
      <div className="notice">
        You are signed in with the bootstrap admin key. To sign in with email and password, create your own admin user below, sign in with its key once, and set a password here.
      </div>
    );
  return (
    <section className="panel panel-body stack" style={{ gap: 8 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>
          <b>Your sign-in</b> · {mine.email} · {mine.hasPassword ? "password set" : "no password yet: sign in with your key until you set one"}
        </span>
        <button className="btn small" onClick={() => setOpen(!open)}>
          {mine.hasPassword ? "Change password" : "Set a password"}
        </button>
      </div>
      {open ? (
        <form
          className="row"
          style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw !== again) return setMsg("The two passwords differ.");
            try {
              await api("POST", "/v1/auth/password", { password: pw, ...(mine.hasPassword && bySession ? { current } : {}) });
              setMsg("Password saved. Use it with your email at the next sign-in.");
              setPw("");
              setAgain("");
              setCurrent("");
              setOpen(false);
              onChanged();
            } catch (x) {
              setMsg((x as ApiFailure).message);
            }
          }}
        >
          {mine.hasPassword && bySession ? (
            <label className="field">
              Current password
              <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </label>
          ) : null}
          <label className="field">
            New password (10+ characters)
            <input className="input" type="password" autoComplete="new-password" minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
          <label className="field">
            Again
            <input className="input" type="password" autoComplete="new-password" minLength={10} value={again} onChange={(e) => setAgain(e.target.value)} required />
          </label>
          <button className="btn primary" type="submit">
            Save password
          </button>
        </form>
      ) : null}
      {msg ? <span className="faint">{msg}</span> : null}
    </section>
  );
}

function SetPassword({ user, onDone, onError }: { user: User; onDone: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  if (!open)
    return (
      <button className="btn small" onClick={() => setOpen(true)} title={user.hasPassword ? "Replace the password and sign the person out everywhere" : "Give this person a password"}>
        {user.hasPassword ? "Reset" : "Set"}
      </button>
    );
  return (
    <form
      className="row"
      style={{ gap: 4 }}
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("POST", `/v1/users/${user.id}/password`, { password: pw });
          setPw("");
          setOpen(false);
          onDone();
        } catch (x) {
          onError((x as ApiFailure).message);
        }
      }}
    >
      <input className="input" type="password" minLength={10} placeholder="10+ characters" value={pw} onChange={(e) => setPw(e.target.value)} required style={{ width: 150 }} aria-label={`New password for ${user.name}`} />
      <button className="btn small primary" type="submit">
        Save
      </button>
      <button className="btn small ghost" type="button" onClick={() => setOpen(false)}>
        ×
      </button>
    </form>
  );
}

function NewUser({ people, onCreated }: { people: Person[]; onCreated: (name: string, key: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "planner", personId: "" });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await api<{ apiKey: string }>("POST", "/v1/users", { name: form.name, email: form.email, role: form.role, ...(form.personId ? { personId: form.personId } : {}) });
          setErr(null);
          onCreated(form.name, r.apiKey);
          setForm({ ...form, name: "", email: "" });
        } catch (x) {
          setErr((x as ApiFailure).message);
        }
      }}
    >
      <div className="panel-head">
        <h2>Add a user</h2>
      </div>
      <div className="panel-body stack">
        {err ? <ErrorList title="Could not create the user" items={[{ message: err }]} /> : null}
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="field">
            Name
            <input id="nu-name" className="input" required value={form.name} onChange={set("name")} />
          </label>
          <label className="field">
            Email
            <input id="nu-email" className="input" type="email" required value={form.email} onChange={set("email")} />
          </label>
          <label className="field">
            Role
            <select id="nu-role" className="select" value={form.role} onChange={set("role")}>
              {ROLES.map(([r]) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Person in workspace
            <select id="nu-person" className="select" value={form.personId} onChange={set("personId")}>
              <option value="">Not linked</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn primary" type="submit">
            Create and issue key
          </button>
        </div>
        <ul className="faint" style={{ margin: 0, paddingLeft: 18, fontSize: "0.8rem" }}>
          {ROLES.map(([r, d]) => (
            <li key={r}>{d}</li>
          ))}
        </ul>
      </div>
    </form>
  );
}

type Purchase = { id: string; signupId: string; plan: string; interval: string; quantity: number; status: string; userId?: string; customerId?: string; subscriptionId?: string; createdAt: string; paidAt?: string; lastInvoiceAt?: string; lastFailureAt?: string; cancelledAt?: string; hasPendingKey: boolean };

/** Subscriptions: the signed-in person manages theirs in Stripe's portal; admins see everyone's. */
function Billing({ admin }: { admin: boolean }) {
  const config = useApi<{ enabled: boolean }>("/v1/billing/config");
  const purchases = useApi<{ purchases: Purchase[] }>(admin && config.data?.enabled ? "/v1/billing/purchases" : null);
  const [err, setErr] = useState<string | null>(null);
  if (!config.data?.enabled) return null;
  const portal = async () => {
    setErr(null);
    try {
      const { url } = await api<{ url: string }>("POST", "/v1/billing/portal");
      window.location.assign(url);
    } catch (x) {
      const f = x as ApiFailure;
      setErr(f.code === "NOT_FOUND" ? "No subscription is linked to your sign-in." : f.message);
    }
  };
  const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "");
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Subscription</h2>
        <button className="btn small" onClick={() => void portal()} title="Card, invoices and cancellation, in Stripe's customer portal">
          Manage subscription
        </button>
      </div>
      {err ? <p className="error">{err}</p> : null}
      {admin ? (
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Plan</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Last invoice</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {(purchases.data?.purchases ?? []).map((p) => (
                <tr key={p.id} style={p.status === "cancelled" || p.status === "expired" ? { opacity: 0.6 } : undefined}>
                  <td className="mono">{when(p.createdAt)}</td>
                  <td>
                    {p.plan} · {p.interval}
                  </td>
                  <td>{p.quantity}</td>
                  <td>
                    <span className={`chip ${p.status === "paid" ? "ok" : p.status === "open" ? "" : "warn"}`}>{p.status}</span>
                    {p.hasPendingKey ? <span className="faint"> · key not picked up yet</span> : null}
                    {p.lastFailureAt ? <span className="faint"> · failed {when(p.lastFailureAt)}</span> : null}
                  </td>
                  <td className="mono">{when(p.lastInvoiceAt ?? p.paidAt)}</td>
                  <td className="mono faint">{p.subscriptionId ?? p.customerId ?? ""}</td>
                </tr>
              ))}
              {(purchases.data?.purchases ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="faint">
                    No subscriptions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Update your card, download invoices or cancel from Stripe&apos;s portal. You come straight back here.</p>
      )}
    </section>
  );
}
