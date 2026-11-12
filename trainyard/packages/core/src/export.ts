// A class, taken out whole: the board with every exercise's work (the shared copy and each
// team's), the students and their teams, and the class's planning room. Saved as JSON for keeping
// or importing again, and rendered as a readable report (one HTML page) for the trainer's records.
// The trainer downloads it from the board, and a copy is emailed before a class is deleted, by
// hand or by the retention sweep (apps/api/src/retention.ts).

import type { Board, Frame } from "./boards.js";
import { classTeams, teamRounds, teamPolicy, type ClassTeam } from "./teams.js";

export interface ClassExportStudent {
  id: string;
  name: string;
  email: string;
  team?: string;
}

export interface ClassExport {
  format: "trainyard-class/1";
  exportedAt: string;
  reason?: string;
  board: Board;
  students: ClassExportStudent[];
  teams: ClassTeam[];
  teamRounds: ClassTeam[][];
  teamPolicy: string;
  /** The class's planning room document, when it has one. */
  planningRoom?: unknown;
}

export function classExport(board: Board, opts: { now: string; students?: ClassExportStudent[]; planningRoom?: unknown; reason?: string }): ClassExport {
  const teams = classTeams(board);
  const students = (opts.students ?? []).map((s) => ({ ...s, ...(teams.find((t) => t.members.includes(s.id)) ? { team: teams.find((t) => t.members.includes(s.id))!.name } : {}) }));
  return { format: "trainyard-class/1", exportedAt: opts.now, ...(opts.reason ? { reason: opts.reason } : {}), board: structuredClone(board), students, teams, teamRounds: teamRounds(board), teamPolicy: teamPolicy(board), ...(opts.planningRoom !== undefined ? { planningRoom: opts.planningRoom } : {}) };
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const TEXT_KEYS = ["text", "t", "title", "name", "risk", "q", "a", "v", "value", "label", "note", "fix", "why", "what", "who", "when", "how"];

/** Something people wrote on a board, shown as text; lists become lists, records become their text fields. */
function show(v: unknown, depth = 0): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "string") return `<p>${esc(v).replace(/\n/g, "<br>")}</p>`;
  if (typeof v === "number" || typeof v === "boolean") return `<p>${esc(String(v))}</p>`;
  if (Array.isArray(v)) {
    if (!v.length) return "";
    return `<ul>${v.map((x) => `<li>${typeof x === "object" && x !== null ? showRecord(x as Record<string, unknown>, depth + 1) : esc(String(x))}</li>`).join("")}</ul>`;
  }
  if (typeof v === "object" && depth < 4) return showRecord(v as Record<string, unknown>, depth + 1);
  return `<p>${esc(JSON.stringify(v))}</p>`;
}

function showRecord(r: Record<string, unknown>, depth: number): string {
  const main = TEXT_KEYS.map((k) => r[k]).find((x) => typeof x === "string" && x.trim());
  const rest = Object.entries(r).filter(([k, x]) => k !== "id" && x !== main && x !== "" && x !== null && x !== undefined && typeof x !== "object" && !/^(id|voter|at|by|createdAt)$/.test(k));
  const nested = Object.entries(r).filter(([k, x]) => k !== "id" && typeof x === "object" && x !== null && (!Array.isArray(x) || x.length));
  return `${main ? `<b>${esc(main as string)}</b>` : ""}${rest.length ? ` <small>${rest.map(([k, x]) => `${esc(k)}: ${esc(String(x))}`).join(" · ")}</small>` : ""}${depth < 4 ? nested.map(([k, x]) => `<div class="nest"><i>${esc(k)}</i>${show(x, depth)}</div>`).join("") : ""}`;
}

/** A frame's state split into the shared copy and each team's copy (keys "t1|…"). */
function copiesOf(state: Record<string, unknown>, teams: ClassTeam[]): { title: string; state: Record<string, unknown> }[] {
  const shared: Record<string, unknown> = {};
  const byTeam = new Map<string, Record<string, unknown>>();
  for (const [k, v] of Object.entries(state)) {
    const m = /^([^|]+)\|(.+)$/.exec(k);
    if (m) {
      const t = byTeam.get(m[1]!) ?? {};
      t[m[2]!] = v;
      byTeam.set(m[1]!, t);
    } else shared[k] = v;
  }
  const out: { title: string; state: Record<string, unknown> }[] = [];
  if (Object.keys(shared).length) out.push({ title: byTeam.size ? "Shared" : "", state: shared });
  for (const [id, st] of byTeam) out.push({ title: teams.find((t) => t.id === id)?.name ?? id, state: st });
  return out;
}

function stateHtml(state: Record<string, unknown>): string {
  const rows = Object.entries(state).filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && !v.length));
  if (!rows.length) return "<p class=\"faint\">Nothing written here.</p>";
  return rows.map(([k, v]) => `<div class="key"><span class="k">${esc(k)}</span>${show(v)}</div>`).join("");
}

/** One readable page: the class, its people and teams, every lesson's exercises with what was written, and the planning room. */
export function classReportHtml(x: ClassExport): string {
  const b = x.board;
  const top = b.frames.filter((f) => !f.parentId).sort((p, q) => p.y - q.y || p.x - q.x);
  const kids = (f: Frame) => b.frames.filter((k) => k.parentId === f.id).sort((p, q) => p.y - q.y || p.x - q.x);
  const stickies = (f: Frame) => b.nodes.filter((n) => n.frameId === f.id && n.text.trim() && n.kind !== "image" && !n.fields.locked && !n.fields.placeholder);
  const exercise = (f: Frame): string => {
    const own = f.state ? copiesOf(f.state, x.teams) : [];
    const notes = stickies(f);
    const sub = kids(f);
    return `<section class="ex"><h3>${esc(f.activity ? f.title.replace(/^[^:]+:\s*/, "") : f.title)}${f.done ? ' <span class="done">✓ completed</span>' : ""}</h3>${f.activity?.kind ? `<p class="meta">${esc(f.activity.kind)}${f.activity.board ? ` · ${esc(f.activity.board)} board` : ""}</p>` : ""}${own.map((c) => `${c.title ? `<h4>${esc(c.title)}</h4>` : ""}${stateHtml(c.state)}`).join("")}${notes.length ? `<ul class="stickies">${notes.map((n) => `<li>${esc(n.text)}</li>`).join("")}</ul>` : ""}${sub.map((k) => (k.activity || k.state || stickies(k).length || kids(k).length ? exercise(k) : "")).join("")}</section>`;
  };
  const room = x.planningRoom as { teams?: number; tickets?: { id: string; type: string; title: string; team: number; iter: number | null; pts?: number; roam?: string | null; bv?: number }[]; scn?: string } | undefined;
  const roomHtml = room?.tickets?.length
    ? `<section><h2>Planning room</h2><p class="meta">${esc(room.scn ?? "")} · ${room.teams ?? 0} teams · ${room.tickets.length} tickets</p>${Array.from({ length: room.teams ?? 0 }, (_, i) => i + 1)
        .map((n) => {
          const tt = room.tickets!.filter((t) => t.team === n);
          return `<h3>Team ${n}</h3><table><tr><th>Id</th><th>Type</th><th>Title</th><th>Iteration</th><th>Points</th><th>ROAM / BV</th></tr>${tt.map((t) => `<tr><td>${esc(t.id)}</td><td>${esc(t.type)}</td><td>${esc(t.title)}</td><td>${t.iter ?? ""}</td><td>${t.pts ?? ""}</td><td>${esc(t.roam ?? (t.bv !== undefined ? `BV ${t.bv}` : ""))}</td></tr>`).join("")}</table>`;
        })
        .join("")}</section>`
    : "";
  const people = x.students.length
    ? `<section><h2>Students</h2>${x.teams.length ? x.teams.map((t) => `<h3>${esc(t.name)}</h3><ul>${t.members.map((m) => x.students.find((s) => s.id === m)).filter(Boolean).map((s) => `<li>${esc(s!.name)} <small>${esc(s!.email)}</small></li>`).join("")}</ul>`).join("") : ""}${(() => { const loose = x.students.filter((s) => !x.teams.some((t) => t.members.includes(s.id))); return loose.length ? `${x.teams.length ? "<h3>Not in a team</h3>" : ""}<ul>${loose.map((s) => `<li>${esc(s.name)} <small>${esc(s.email)}</small></li>`).join("")}</ul>` : ""; })()}${x.teamRounds.length > 1 ? `<p class="meta">Teams reshuffled every ${x.teamPolicy}: ${x.teamRounds.length} seatings.</p>` : ""}</section>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b.name)} · class record</title>
<style>body{font:15px/1.5 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#0d1815;background:#fff;max-width:960px;margin:0 auto;padding:32px 20px}h1{font-size:30px;margin:0 0 4px}h2{margin:36px 0 10px;padding-bottom:6px;border-bottom:2px solid #0d1815}h3{margin:18px 0 6px;font-size:17px}h4{margin:12px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#4d5a52}.meta,.faint,small{color:#4d5a52}.meta{margin:0 0 8px;font-size:13px}.ex{border:1.5px solid #0d1815;border-radius:10px;padding:12px 16px;margin:10px 0;background:#fffaf0}.key{margin:6px 0}.key .k{display:inline-block;font:700 11px ui-monospace,Menlo,monospace;letter-spacing:.06em;color:#4d5a52;margin-right:8px}.key p{display:inline;margin:0}ul{margin:4px 0 4px 18px;padding:0}li{margin:2px 0}.nest{margin:2px 0 2px 14px}.stickies li{background:#ffe9a8;border:1.5px solid #0d1815;border-radius:6px;padding:4px 8px;margin:4px 6px 0 0;display:inline-block;list-style:none}.done{font-size:12px;color:#2f8f5b;font-weight:700}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #0d181533;padding:4px 6px;text-align:left}th{background:#efe8d8}@media print{.ex{break-inside:avoid}}</style></head>
<body><h1>${esc(b.name)}</h1><p class="meta">Class record exported ${esc(x.exportedAt.slice(0, 16).replace("T", " "))} UTC${x.reason ? ` · ${esc(x.reason)}` : ""} · ${b.frames.filter((f) => f.activity).length} exercises · ${x.students.length} students${x.teams.length ? ` · ${x.teams.length} teams` : ""}</p>
${people}
${top.map((l) => `<section><h2>${esc(l.title)}</h2>${kids(l).map((f) => exercise(f)).join("") || (stickies(l).length ? `<ul class="stickies">${stickies(l).map((n) => `<li>${esc(n.text)}</li>`).join("")}</ul>` : "<p class=\"faint\">No exercises.</p>")}</section>`).join("")}
${roomHtml}
<p class="meta" style="margin-top:40px">Made with Trainyard. The JSON file beside this report holds the same record in full, for keeping or importing again.</p></body></html>`;
}
