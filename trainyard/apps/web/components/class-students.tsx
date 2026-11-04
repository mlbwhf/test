"use client";

// The class's students: the trainer adds names and emails (one per line, "Name, email"), and each
// student gets a personal link that opens this board with no account. Links can be emailed when
// the server sends mail, copied otherwise, replaced or removed.

import Link from "next/link";
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

type Team = { id: string; name: string; members: string[] };
const TEAM_COLORS = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae", "#d9cdf0", "#f0d9a8", "#d6e6c3", "#e6d3f0", "#c9e07a", "#a9c4ec"];

export function ClassStudents({ boardId }: { boardId: string }) {
  const q = useApi<{ students: Student[]; teams: Team[]; canEmail: boolean; mirrorHost?: string }>(`/v1/boards/${encodeURIComponent(boardId)}/students`);
  const teams = q.data?.teams ?? [];
  const [teamN, setTeamN] = useState<number | null>(null);
  const wantTeams = teamN ?? (teams.length || 4);
  const setTeams = async (body: { count?: number; shuffle?: boolean; spread?: boolean; move?: { studentId: string; teamId: string | null }; names?: Record<string, string> }) => {
    try {
      await api("PUT", `/v1/boards/${encodeURIComponent(boardId)}/teams`, body);
      setErr(null);
      await q.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const teamOfStudent = (id: string) => teams.find((t) => t.members.includes(id));
  // "auto": Trainyard seats and shuffles; "manual": the trainer picks a student, then a team.
  const [assign, setAssign] = useState<"auto" | "manual">("auto");
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  // "one": a name and an email; "many": a pasted list, one per line.
  const [mode, setMode] = useState<"one" | "many">("one");
  const [oneName, setOneName] = useState("");
  const [oneEmail, setOneEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [send, setSend] = useState(true);
  const [links, setLinks] = useState<{ name: string; email: string; link: string; mirrorLink?: string; emailed: boolean }[]>([]);
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
      const r = await api<{ students: (Student & { token?: string; link?: string; mirrorLink?: string; emailed: boolean; existing?: boolean })[] }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students`, { students: rows, send: send && !!q.data?.canEmail });
      setLinks(r.students.filter((s) => s.token).map((s) => ({ name: s.name, email: s.email, link: linkFor(s.token!, s.link), ...(s.mirrorLink ? { mirrorLink: s.mirrorLink } : {}), emailed: s.emailed })));
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
      const r = await api<{ student: Student & { token: string; link?: string; mirrorLink?: string; emailed: boolean } }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}/link`, { send: send && !!q.data?.canEmail });
      setLinks([{ name: s.name, email: s.email, link: linkFor(r.student.token, r.student.link), ...(r.student.mirrorLink ? { mirrorLink: r.student.mirrorLink } : {}), emailed: r.student.emailed }]);
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
        const r = await api<{ student: Student & { token: string; link?: string; mirrorLink?: string; emailed: boolean } }>("POST", `/v1/boards/${encodeURIComponent(boardId)}/students/${encodeURIComponent(s.id)}/link`, { send: send && !!q.data?.canEmail });
        out.push({ name: s.name, email: s.email, link: linkFor(r.student.token, r.student.link), ...(r.student.mirrorLink ? { mirrorLink: r.student.mirrorLink } : {}), emailed: r.student.emailed });
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
      <div className="stack" style={{ gap: 12, padding: "14px 16px", border: "2px solid #0d1815", borderRadius: 12, background: "#fffaf0", boxShadow: "3px 3px 0 #0d1815" }} aria-labelledby="teams-h">
        <div className="stack" style={{ gap: 2 }}>
          <span className="ex-mono" id="teams-h" style={{ color: "#4d5a52" }}>TEAMS RUNNING IN PARALLEL</span>
          <span className="faint">Every exercise keeps one copy per team; each student works on their team&apos;s copy and the trainer switches between them on the board. New students join the smallest team.</span>
        </div>
        <div className="row" style={{ gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div className="row" style={{ gap: 0, alignItems: "stretch", border: "2px solid #0d1815", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            <button className="btn ghost" aria-label="Fewer teams" onClick={() => setTeamN(Math.max(0, wantTeams - 1))} style={{ borderRadius: 0, border: 0, borderRight: "2px solid #0d1815", fontSize: 20, padding: "4px 14px" }}>
              −
            </button>
            <div className="stack" style={{ gap: 0, alignItems: "center", padding: "4px 18px", minWidth: 120 }}>
              <b style={{ fontSize: 26, lineHeight: 1.1 }}>{wantTeams}</b>
              <span className="faint" style={{ fontSize: 12 }}>
                {wantTeams ? `teams · about ${Math.ceil((q.data?.students.length ?? 0) / wantTeams) || 0} per team` : "no teams · one shared board"}
              </span>
            </div>
            <button className="btn ghost" aria-label="More teams" onClick={() => setTeamN(Math.min(12, wantTeams + 1))} style={{ borderRadius: 0, border: 0, borderLeft: "2px solid #0d1815", fontSize: 20, padding: "4px 14px" }}>
              +
            </button>
          </div>
          <button className="btn primary" onClick={() => void setTeams({ count: wantTeams }).then(() => setTeamN(null))} disabled={wantTeams === teams.length}>
            {teams.length ? (wantTeams ? `Make it ${wantTeams} team${wantTeams === 1 ? "" : "s"}` : "Remove the teams") : `Set up ${wantTeams} team${wantTeams === 1 ? "" : "s"}`}
          </button>
          {teams.length ? (
            <>
              <span className="ex-mono" style={{ color: "#4d5a52" }}>ASSIGN</span>
              {(["auto", "manual"] as const).map((m) => (
                <button key={m} className="btn small" aria-pressed={assign === m} onClick={() => setAssign(m)} style={{ background: assign === m ? "#ffd37a" : "#fff" }} title={m === "auto" ? "Trainyard splits the class evenly and can shuffle it for you." : "You place every student in a team."}>
                  {m === "auto" ? "Automatic" : "I will assign"}
                </button>
              ))}
              {assign === "auto" ? (
                <button className="btn small" onClick={() => void setTeams({ shuffle: true })} style={{ background: "#ffb627" }}>
                  Shuffle now ⟳
                </button>
              ) : (
                <button className="btn small" onClick={() => void setTeams({ spread: true }).then(() => setSel(null))}>
                  Spread evenly
                </button>
              )}
            </>
          ) : null}
        </div>
        {teams.length ? (
          <>
            {assign === "manual" ? <span className="faint">Pick a student, then pick a team. Teams stay the same all class unless you change them.</span> : null}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {teams.map((t, i) => (
                <div key={t.id} onClick={() => sel && assign === "manual" && void setTeams({ move: { studentId: sel, teamId: t.id } }).then(() => setSel(null))} style={{ border: "2px solid #0d1815", borderRadius: 12, background: TEAM_COLORS[i % TEAM_COLORS.length], padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, cursor: sel ? "pointer" : "default", boxShadow: sel ? "3px 3px 0 #ffb627" : "none" }}>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <input defaultValue={t.name} key={t.name} aria-label={`Name of ${t.name}`} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.name && void setTeams({ names: { [t.id]: e.target.value.trim() } })} style={{ flex: 1, minWidth: 0, border: 0, borderBottom: "1.5px dashed #0d181855", font: "800 15px 'Helvetica Neue', Helvetica, Arial, sans-serif", background: "transparent" }} />
                    <span className="ex-mono" style={{ background: "#fff", border: "1.5px solid #0d1815", borderRadius: 99, padding: "1px 8px" }}>{t.members.length}</span>
                    <Link href={`/boards/${encodeURIComponent(boardId)}?team=${encodeURIComponent(t.id)}`} className="btn small" style={{ background: "#fff" }} title={`Open the board as ${t.name} sees it`}>
                      Enter ▸
                    </Link>
                  </div>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    {t.members.map((m) => {
                      const st = q.data?.students.find((x) => x.id === m);
                      return (
                        <button key={m} className="btn small" onClick={(e) => (e.stopPropagation(), assign === "manual" && setSel(sel === m ? null : m))} style={{ background: sel === m ? "#ffb627" : "#fffaf0", cursor: assign === "manual" ? "pointer" : "default", boxShadow: sel === m ? "2px 2px 0 #0d1815" : "none" }}>
                          {st?.name ?? m}
                        </button>
                      );
                    })}
                    {!t.members.length ? <span className="faint">Nobody yet</span> : null}
                  </div>
                </div>
              ))}
            </div>
            {q.data?.students.some((x) => !teamOfStudent(x.id)) ? (
              <div className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="faint">Not in a team:</span>
                {q.data.students.filter((x) => !teamOfStudent(x.id)).map((x) => (
                  <button key={x.id} className="btn small" onClick={() => setSel(sel === x.id ? null : x.id)} style={{ background: sel === x.id ? "#ffb627" : "#fff" }}>
                    {x.name}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
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
              {l.mirrorLink ? (
                <>
                  <span className="faint">blocked networks:</span>
                  <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{l.mirrorLink}</code>
                  <button className="btn small" onClick={() => void copy(l.mirrorLink!, l.mirrorLink!)}>
                    {copied === l.mirrorLink ? "Copied" : "Copy"}
                  </button>
                </>
              ) : null}
            </div>
          ))}
          {links.length > 1 ? (
            <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => void copy(links.map((l) => `${l.name} <${l.email}>: ${l.link}${l.mirrorLink ? ` (if blocked: ${l.mirrorLink})` : ""}`).join("\n"), "all")}>
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
              {teams.length ? <th>Team</th> : null}
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
                {teams.length ? (
                  <td>
                    <select value={teamOfStudent(s.id)?.id ?? ""} aria-label={`Team of ${s.name}`} onChange={(e) => void setTeams({ move: { studentId: s.id, teamId: e.target.value || null } })}>
                      <option value="">No team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                ) : null}
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
