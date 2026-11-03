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

// The API builds links on the canonical web address (TRAINYARD_WEB_URL) so a copied link never
// carries an alias host the trainer happened to be on; the browser's own address is the fallback.
const linkFor = (token: string, link?: string) => link || `${window.location.origin}/join/${token}`;
/** What a participant's IT team needs to allow for the class links and emails to get through. */
const itNote = (link: string) => {
  const host = new URL(link).host.replace(/^www\./, "");
  return `Our training runs on Trainyard. Please allow for our participants:\n- Web: https://${host} and https://api.${host} (TLS, port 443; no inspection or block page on these hosts)\n- Email: messages from support@${host} (SPF, DKIM and DMARC are published for ${host}; sent through Postmark)\nParticipants open a personal link of the form https://${host}/join/… ; no account, download or plug-in is needed.`;
};

export function ClassStudents({ boardId }: { boardId: string }) {
  const q = useApi<{ students: Student[]; canEmail: boolean }>(`/v1/boards/${encodeURIComponent(boardId)}/students`);
  const [text, setText] = useState("");
  // "one": a name and an email; "many": a pasted list, one per line.
  const [mode, setMode] = useState<"one" | "many">("one");
  const [oneName, setOneName] = useState("");
  const [oneEmail, setOneEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [send, setSend] = useState(true);
  const [links, setLinks] = useState<{ name: string; email: string; link: string; emailed: boolean }[]>([]);
  const [kept, setKept] = useState<string[]>([]);
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
  const oneOk = /^[^\s,;<>]+@[^\s,;<>]+$/.test(oneEmail.trim());
  const rows = mode === "one" ? (oneEmail.trim() ? [{ name: oneName.trim() || oneEmail.trim().split("@")[0]!, email: oneEmail.trim() }] : []) : parse();
  const bad = rows.filter((r) => !r.email);
  const add = async () => {
    setErr(null);
    try {
      const r = await api<{ students: (Student & { token?: string; link?: string; emailed: boolean; existing?: boolean })[] }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students`, { students: rows, send: send && !!q.data?.canEmail });
      setLinks(r.students.filter((s) => s.token).map((s) => ({ name: s.name, email: s.email, link: linkFor(s.token!, s.link), emailed: s.emailed })));
      setKept(r.students.filter((s) => s.existing).map((s) => s.name));
      setText("");
      setOneName("");
      setOneEmail("");
      await q.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const relink = async (s: Student) => {
    try {
      const r = await api<{ student: Student & { token: string; link?: string; emailed: boolean } }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}/link`, { send: send && !!q.data?.canEmail });
      setLinks([{ name: s.name, email: s.email, link: linkFor(r.student.token, r.student.link), emailed: r.student.emailed }]);
      setKept([]);
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
  // Several students at once: new links for all picked, or remove all picked.
  const pickedStudents = () => (q.data?.students ?? []).filter((s) => picked.includes(s.id));
  const relinkPicked = async () => {
    const out: typeof links = [];
    try {
      for (const s of pickedStudents()) {
        const r = await api<{ student: Student & { token: string; link?: string; emailed: boolean } }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}/link`, { send: send && !!q.data?.canEmail });
        out.push({ name: s.name, email: s.email, link: linkFor(r.student.token, r.student.link), emailed: r.student.emailed });
      }
      setLinks(out);
      setKept([]);
      setPicked([]);
      await q.reload();
    } catch (e) {
      setLinks(out);
      setErr((e as ApiFailure).message);
    }
  };
  const removePicked = async () => {
    const list = pickedStudents();
    if (!list.length || !window.confirm(`Remove ${list.length} student${list.length === 1 ? "" : "s"}? Their links stop working.`)) return;
    try {
      for (const s of list) await api("DELETE", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}`);
      setPicked([]);
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
      <div className="row" style={{ gap: 6 }} role="tablist" aria-label="How many to add">
        <button role="tab" aria-selected={mode === "one"} className={`btn small${mode === "one" ? " primary" : ""}`} onClick={() => setMode("one")}>
          One student
        </button>
        <button role="tab" aria-selected={mode === "many"} className={`btn small${mode === "many" ? " primary" : ""}`} onClick={() => setMode("many")}>
          Several at once
        </button>
      </div>
      {mode === "one" ? (
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="stack" style={{ gap: 4, flex: "1 1 180px" }}>
            <span>Name</span>
            <input className="input" value={oneName} onChange={(e) => setOneName(e.target.value)} placeholder="Ana Lopez" autoComplete="off" />
          </label>
          <label className="stack" style={{ gap: 4, flex: "1 1 220px" }}>
            <span>Email</span>
            <input className="input" type="email" value={oneEmail} onChange={(e) => setOneEmail(e.target.value)} placeholder="ana@company.com" autoComplete="off" onKeyDown={(e) => e.key === "Enter" && oneOk && void add()} />
          </label>
        </div>
      ) : (
        <label className="stack" style={{ gap: 4 }}>
          <span>One per line: name, email</span>
          <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Ana Lopez, ana@company.com\nBen Okafor, ben@company.com"} />
        </label>
      )}
      {bad.length ? <span className="faint" style={{ color: "var(--warn)" }}>No email on: {bad.map((b) => b.name).join(", ")}</span> : null}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {q.data?.canEmail ? (
          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} /> Email each student their link
          </label>
        ) : (
          <span className="faint">Mail is not set up on this server: copy the links and send them yourself.</span>
        )}
        <button className="btn primary" disabled={!rows.length || bad.length > 0 || (mode === "one" && !oneOk)} onClick={() => void add()}>
          {mode === "one" ? "Add student" : `Add ${rows.length || ""} student${rows.length === 1 ? "" : "s"}`}
        </button>
      </div>
      {err ? <div className="notice crit" role="alert">{err}</div> : null}
      {kept.length ? (
        <div className="notice stack" role="status">
          Already in this class, so their links are unchanged: {kept.join(", ")}. Use <b>New link</b> next to a name only if a link was lost; the old one then stops working.
        </div>
      ) : null}
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
          <p className="faint" style={{ margin: "4px 0 0" }}>
            Government and company networks often block or flag sites and senders they do not know yet (a security warning on the link, the email in spam). Send their IT this note before the class.{" "}
            <button className="btn small" onClick={() => void copy(itNote(links[0]!.link), "it")}>
              {copied === "it" ? "Copied" : "Copy note for IT"}
            </button>
          </p>
        </div>
      ) : null}
      {q.data?.students.length ? (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>
                <input type="checkbox" aria-label="Select all students" checked={picked.length > 0 && picked.length === q.data.students.length} onChange={(e) => setPicked(e.target.checked ? q.data!.students.map((s) => s.id) : [])} />
              </th>
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
                <td>
                  <input type="checkbox" aria-label={`Select ${s.name}`} checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
                </td>
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
      {picked.length ? (
        <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="faint">{picked.length} selected</span>
          <button className="btn small" onClick={() => void relinkPicked()} title="New links; the old ones stop working">
            New links for selected
          </button>
          <button className="btn small ghost" onClick={() => void removePicked()}>
            Remove selected
          </button>
          <button className="btn small ghost" onClick={() => setPicked([])}>
            Clear selection
          </button>
        </div>
      ) : null}
    </section>
  );
}
