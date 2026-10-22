"use client";

import { useState } from "react";
import type { Person } from "@trainyard/core";
import { CopyKey } from "@/components/copy-key";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, setApiKey, useApi, useMe, type ApiFailure } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  disabled?: boolean;
  personId?: string;
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
      <PageHead title="Users" sub={me.data.open ? "The API is running open: anyone who can reach it acts as an admin. Create the first user to turn authentication on." : "Each user signs in with an API key. Keys are shown once and stored hashed."} />
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
