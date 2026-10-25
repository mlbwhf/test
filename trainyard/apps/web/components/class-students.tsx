"use client";

// The class's students: the trainer adds names and emails (one per line, "Name, email"), and each
// student gets a personal link that opens this board with no account. Links can be emailed when
// the server sends mail, copied otherwise, replaced or removed.

import { useState } from "react";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  email: string;
  emailedAt?: string;
  seenAt?: string;
}

const linkFor = (token: string) => `${window.location.origin}/join/${token}`;

export function ClassStudents({ boardId }: { boardId: string }) {
  const q = useApi<{ students: Student[]; canEmail: boolean }>(`/v1/boards/${encodeURIComponent(boardId)}/students`);
  const [text, setText] = useState("");
  const [send, setSend] = useState(true);
  const [links, setLinks] = useState<{ name: string; email: string; link: string; emailed: boolean }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const parse = () =>
    text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const email = /[^\s,;<>]+@[^\s,;<>]+/.exec(l)?.[0] ?? "";
        const name = l.replace(email, "").replace(/[<>,;]/g, " ").trim() || email.split("@")[0]!;
        return { name, email };
      });
  const rows = parse();
  const bad = rows.filter((r) => !r.email);
  const add = async () => {
    setErr(null);
    try {
      const r = await api<{ students: (Student & { token: string; emailed: boolean })[] }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students`, { students: rows, send: send && !!q.data?.canEmail });
      setLinks(r.students.map((s) => ({ name: s.name, email: s.email, link: linkFor(s.token), emailed: s.emailed })));
      setText("");
      await q.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const relink = async (s: Student) => {
    try {
      const r = await api<{ student: Student & { token: string; emailed: boolean } }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}/link`, { send: send && !!q.data?.canEmail });
      setLinks([{ name: s.name, email: s.email, link: linkFor(r.student.token), emailed: r.student.emailed }]);
      await q.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const remove = async (s: Student) => {
    if (!window.confirm(`Remove ${s.name}? Their link stops working.`)) return;
    try {
      await api("DELETE", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}`);
      await q.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
    } catch {
      setCopied(null);
    }
  };
  return (
    <section className="panel panel-body stack" aria-labelledby="students-h">
      <h2 id="students-h" style={{ margin: 0 }}>
        Students
      </h2>
      <p className="faint" style={{ margin: 0 }}>
        Add each student&apos;s name and email. Everyone gets a personal link that opens this class board, with no account and no password. A link works until you replace it or remove the student.
      </p>
      <label className="stack" style={{ gap: 4 }}>
        <span>One per line: name, email</span>
        <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Ana Lopez, ana@company.com\nBen Okafor, ben@company.com"} />
      </label>
      {bad.length ? <span className="faint" style={{ color: "var(--warn)" }}>No email on: {bad.map((b) => b.name).join(", ")}</span> : null}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {q.data?.canEmail ? (
          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} /> Email each student their link
          </label>
        ) : (
          <span className="faint">Mail is not set up on this server: copy the links and send them yourself.</span>
        )}
        <button className="btn primary" disabled={!rows.length || bad.length > 0} onClick={() => void add()}>
          Add {rows.length || ""} student{rows.length === 1 ? "" : "s"}
        </button>
      </div>
      {err ? <div className="notice crit" role="alert">{err}</div> : null}
      {links.length ? (
        <div className="notice ok stack" style={{ gap: 6 }} role="status">
          <b>Links, shown once: copy them now{links.some((l) => l.emailed) ? " (emailed ones are already on their way)" : ""}</b>
          {links.map((l) => (
            <div key={l.link} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <span>
                {l.name} · {l.email}
                {l.emailed ? " · emailed" : ""}
              </span>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{l.link}</code>
              <button className="btn small" onClick={() => void copy(l.link, l.link)}>
                {copied === l.link ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
          {links.length > 1 ? (
            <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => void copy(links.map((l) => `${l.name} <${l.email}>: ${l.link}`).join("\n"), "all")}>
              {copied === "all" ? "Copied all" : "Copy all"}
            </button>
          ) : null}
        </div>
      ) : null}
      {q.data?.students.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {q.data.students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className="faint">{s.email}</td>
                <td className="faint">{s.seenAt ? s.seenAt.slice(0, 16).replace("T", " ") : "Not yet"}</td>
                <td className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                  <button className="btn small" onClick={() => void relink(s)} title="A new link; the old one stops working">
                    New link
                  </button>
                  <button className="btn small ghost" onClick={() => void remove(s)} aria-label={`Remove ${s.name}`}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
