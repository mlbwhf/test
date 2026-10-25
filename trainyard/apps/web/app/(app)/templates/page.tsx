"use client";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { TEMPLATE_METHODS, canEdit, type Board, type BoardOrigin, type LaneCard, type RoomAccess, type TemplateInfo, type TemplateMethod, type TemplatePackage } from "@trainyard/core";
import { CanvasEditor } from "@/components/canvas-editor";
import { LaneBoard, type Lane } from "@/components/lane-board";
import { useTheme } from "@/components/workspace-shell";
import { METHOD_DOT, THEMES, methodTheme, type ThemeId } from "@/lib/themes";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, useMe, type ApiFailure } from "@/lib/api";
import { useSavedClassTemplates } from "@/lib/class-templates";

interface Summary {
  id: string;
  name: string;
  origin: BoardOrigin;
  shape: string;
  counts: { frames: number; nodes: number; edges: number; columns: number; rows: number };
  info?: TemplateInfo;
}

interface RoomOption {
  id: string;
  name: string;
  access: RoomAccess;
}

const FILTERS = [
  ["all", "All"],
  ["safe", "SAFe"],
  ["team", "Team"],
  ["portfolio", "Portfolio"],
  ["risk", "Risk"],
  ["flow", "Flow / Kanban"],
  ["lean", "Lean / Obeya"],
  ["saved", "Saved from imports"],
] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const data = useApi<{ builtin: Summary[]; saved: Summary[]; packages: TemplatePackage[] }>("/v1/templates/boards");
  const rooms = useApi<{ rooms: RoomOption[] }>("/v1/rooms");
  // Classes live in the Classes space: the built-in class boards and any class saved as a template.
  const savedClasses = useSavedClassTemplates(data.data?.saved.map((s) => s.id));
  const me = useMe();
  const [filter, setFilter] = useState<string>("all");
  const [method, setMethod] = useState<TemplateMethod | "all">("all");
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("tpl"));
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState<"lanes" | "canvas">("lanes");
  const selId = selectedId ?? data.data?.builtin.find((t) => !isClass(t) && (method === "all" || t.info?.method === method))?.id ?? null;
  const preview = useApi<{ board: Board }>(selId ? `/v1/templates/boards/${encodeURIComponent(selId)}` : null);
  if (!data.data) return <Loading error={data.error} />;

  const all: Summary[] = [...data.data.builtin, ...data.data.saved.map((s) => ({ ...s, info: undefined }))];
  // Until the saved templates are checked for classes, only the built-ins are listed.
  const gallery = [...data.data.builtin.filter((t) => !isClass(t)), ...(savedClasses ? data.data.saved.filter((s) => !savedClasses.has(s.id)).map((s) => ({ ...s, info: undefined })) : [])];
  const shown = gallery.filter((t) => (filter === "all" || (filter === "saved" ? !t.info : t.info?.tags.includes(filter as never))) && (method === "all" || t.info?.method === method));
  const methodBlurb = TEMPLATE_METHODS.find((m) => m.id === method)?.blurb;
  const sel = all.find((t) => t.id === selId);
  const showPackages = (filter === "all" || filter === "safe") && (method === "all" || method === "safe") && data.data.packages.length > 0;
  const gated = (isClass(sel) || (!!sel && !!savedClasses?.has(sel.id))) && !!me.data?.principal.anonymous;

  const create = async () => {
    if (!sel) return;
    const boardName = name.trim() || `${sel.name} ${new Date().toISOString().slice(0, 10)}`;
    try {
      const r = await api<{ board: { id: string } }>("POST", `/v1/templates/boards/${encodeURIComponent(sel.id)}/create`, { name: boardName });
      router.push(`/boards/${encodeURIComponent(r.board.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  const theme = methodTheme(method === "all" ? sel?.info?.method : method);
  return (
    <>
      <ThemeFor theme={theme} />
      <PageHead
        title={sel ? sel.name : "Start from a template"}
        sub={sel?.info?.blurb ?? "Built in, sized to your teams and iterations, and yours to fork. Boards you imported and saved as templates appear here too."}
        actions={
          <>
          <Link href="/boards" className="btn" title="Start from an empty whiteboard and add any of these templates to it">
            Or start blank
          </Link>
          <label className="row" style={{ gap: 6 }}>
            <span className="eyebrow">Kind</span>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter templates by kind">
              {FILTERS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          </>
        }
      />
      <nav className="ws-chips" aria-label="Filter by method">
        <button className="ws-chip-btn" aria-pressed={method === "all"} onClick={() => setMethod("all")}>
          All methods
        </button>
        {TEMPLATE_METHODS.map((m) => (
          <button key={m.id} className="ws-chip-btn" aria-pressed={method === m.id} onClick={() => (setMethod(m.id), setSelectedId(null))} title={m.blurb}>
            <span className="dot" style={{ background: METHOD_DOT[m.id] ?? "#999" }} />
            {m.label}
          </button>
        ))}
      </nav>
      {err ? <ErrorList title="Could not create the board" items={[{ message: err }]} /> : null}

      {showPackages ? (
        <section className="stack" aria-labelledby="pkg-head" style={{ gap: 10 }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 id="pkg-head" className="pkg-head">
              Packages
            </h2>
            <p className="faint" style={{ margin: 0, fontSize: "0.88rem" }}>
              The boards an event needs, created together: on one board side by side, or a board each.
            </p>
          </div>
          <div className="pkg-grid">
            {data.data.packages.map((p) => (
              <PackageCard key={p.id} pkg={p} builtin={data.data!.builtin} rooms={(rooms.data?.rooms ?? []).filter((r) => canEdit(r.access))} onPreview={(id) => (setMethod("all"), setSelectedId(id), requestAnimationFrame(() => document.querySelector(".tpl-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })))} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="tpl-layout">
        <aside className="tpl-list" aria-label="Templates">
          <span className="ws-eyebrow">Start from a template</span>
          <p className="faint" style={{ fontSize: "0.85rem" }}>
            {methodBlurb ?? "Each method keeps its own vocabulary: SAFe boards say what SAFe says, Scrum boards what the Scrum Guide says, and so on."}
          </p>
          {shown.map((t) => (
            <button key={t.id} className="tpl-item" onClick={() => setSelectedId(t.id)} aria-pressed={t.id === selId}>
              <Thumb summary={t} />
              <strong>{t.name}</strong>
              <span className="faint">
                {t.info ? `${TEMPLATE_METHODS.find((m) => m.id === t.info!.method)?.label ?? ""} · ${t.info.event}` : `Saved from ${t.origin.system} on ${t.origin.importedAt.slice(0, 10)}`}
              </span>
            </button>
          ))}
          {shown.length === 0 ? <p className="faint">Nothing here yet. Import a board and choose “Save as template”.</p> : null}
        </aside>

        <div className="stack" style={{ minWidth: 0, gap: 14 }}>
          {sel ? (
            <section className="panel panel-body tpl-detail" aria-live="polite">
              <div className="stack" style={{ gap: 8, minWidth: 0 }}>
                <span className="eyebrow">
                  {sel.info ? `${TEMPLATE_METHODS.find((m) => m.id === sel.info!.method)?.label ?? ""} · ${THEMES[theme].name} theme` : "Your template"}
                </span>
                {sel.info ? (
                  <>
                    <div className="tpl-zones">
                      {sel.info.zones.map((z) => (
                        <span key={z} className="chip">
                          {z}
                        </span>
                      ))}
                    </div>
                    <dl className="tpl-facts">
                      <dt>Used in</dt>
                      <dd>{sel.info.event}</dd>
                      <dt>Card types</dt>
                      <dd>{sel.info.cardTypes.join(", ")}</dd>
                      <dt>Maps onto the plan as</dt>
                      <dd>{sel.info.mapsTo}</dd>
                    </dl>
                  </>
                ) : (
                  <p className="muted">Saved from an import. Structure kept, content cleared.</p>
                )}
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <label className="field">
                  Board name
                  <input id="tpl-name" className="input" placeholder={`${sel.name} ${new Date().toISOString().slice(0, 10)}`} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                {gated ? (
                  <div className="notice warn">
                    <strong>Classes need a free account.</strong>
                    <p style={{ margin: "4px 0 0" }}>
                      Class boards (Leading SAFe, SPC, Advanced SPC, POPM, RTE) and Miro imports are for signed-up trainers; the account is free. <a href="/#join">Sign up</a>, then <Link href="/login">sign in</Link> with the key you receive.
                    </p>
                  </div>
                ) : null}
                <button className="btn primary" onClick={create} disabled={gated}>
                  Create board from template
                </button>
              </div>
            </section>
          ) : null}

          {preview.data ? (
            <section className="stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">Preview</span>
                <div className="lb-seg" role="group" aria-label="Preview as">
                  <button aria-pressed={look === "lanes"} onClick={() => setLook("lanes")}>
                    Lanes
                  </button>
                  <button aria-pressed={look === "canvas"} onClick={() => setLook("canvas")}>
                    Whiteboard
                  </button>
                </div>
              </div>
              {look === "lanes" ? <TemplateLanes board={preview.data.board} theme={theme} /> : <CanvasEditor board={preview.data.board} readOnly onChanged={() => undefined} onError={setErr} />}
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

const isClass = (t: Summary | undefined) => !!t?.info?.tags.includes("class");

/** One template package: what it is for, the boards it holds, and how to create them. */
function PackageCard({ pkg, builtin, rooms, onPreview }: { pkg: TemplatePackage; builtin: Summary[]; rooms: RoomOption[]; onPreview: (templateId: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"one-board" | "boards">("one-board");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiFailure | null>(null);
  const fallback = `${pkg.name} ${new Date().toISOString().slice(0, 10)}`;
  const templates = pkg.templates.map((id) => ({ id: `tpl-builtin-${id}`, name: builtin.find((b) => b.id === `tpl-builtin-${id}`)?.name ?? id }));
  const base = `pkg-${pkg.id}`;

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ boards: { id: string }[] }>("POST", `/v1/templates/packages/${encodeURIComponent(pkg.id)}/create`, { name: name.trim() || fallback, mode, ...(roomId ? { roomId } : {}) });
      router.push(mode === "one-board" && r.boards[0] ? `/boards/${encodeURIComponent(r.boards[0].id)}` : "/boards");
    } catch (e) {
      setErr(e as ApiFailure);
      setBusy(false);
    }
  };

  return (
    <article className="panel panel-body pkg-card" aria-labelledby={`${base}-name`}>
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">{pkg.when}</span>
        <h3 id={`${base}-name`}>{pkg.name}</h3>
        <p className="muted pkg-blurb">{pkg.blurb}</p>
      </div>
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow" id={`${base}-holds`}>
          {templates.length} board{templates.length === 1 ? "" : "s"}
        </span>
        <ol className="pkg-templates" aria-labelledby={`${base}-holds`}>
          {templates.map((t) => (
            <li key={t.id}>
              <button type="button" className="pkg-tpl" onClick={() => onPreview(t.id)} title={`Preview ${t.name}`}>
                {t.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <form
        className="stack pkg-form"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label className="field">
          Name
          <input className="input" placeholder={fallback} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>
        <fieldset className="pkg-mode">
          <legend>Create as</legend>
          <label>
            <input type="radio" name={`${base}-mode`} value="one-board" checked={mode === "one-board"} onChange={() => setMode("one-board")} />
            One board, templates side by side
          </label>
          <label>
            <input type="radio" name={`${base}-mode`} value="boards" checked={mode === "boards"} onChange={() => setMode("boards")} />
            A board for each
          </label>
        </fieldset>
        {rooms.length ? (
          <label className="field">
            Room (optional)
            <select className="select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">No room: open to the workspace</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {err ? (
          <div className="notice warn" role="alert">
            {err.message}
            {err.code === "PLAN_LIMIT" || err.status === 402 ? (
              <>
                {" "}
                <Link href="/billing">See plans and billing</Link>
              </>
            ) : null}
          </div>
        ) : null}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Creating…" : mode === "one-board" ? "Create the board" : `Create ${templates.length} boards`}
        </button>
      </form>
    </article>
  );
}

function ThemeFor({ theme }: { theme: ThemeId }) {
  useTheme(theme);
  return null;
}

/** A template's top-level frames as lanes and the cards inside each, read-only: the quick look before creating the board. */
function TemplateLanes({ board, theme }: { board: Board; theme: ThemeId }) {
  const { lanes, cards } = useMemo(() => {
    if (!board.frames.length && board.groups.length) {
      // Table templates (Kanban and the like): groups are the lanes, rows the cards, "(WIP n)" the limit.
      const lanes: Lane[] = board.groups.map((g) => {
        const wip = /\(WIP (\d+)\)/i.exec(g.title);
        return { id: g.id, title: g.title.replace(/\s*\(WIP \d+\)/i, ""), w: 240, ...(wip ? { wip: Number(wip[1]) } : {}) };
      });
      const titleCol = board.columns[0]?.id;
      const cards: LaneCard[] = board.rows.filter((r) => r.groupId).map((r) => ({ id: r.id, lane: r.groupId!, title: String((titleCol && r.cells[titleCol]) ?? "Row"), tone: 2 }));
      return { lanes, cards };
    }
    const top = board.frames.filter((f) => !f.parentId).slice(0, 14);
    const rootOf = (id: string | undefined): string | undefined => {
      let f = board.frames.find((x) => x.id === id);
      while (f?.parentId) f = board.frames.find((x) => x.id === f!.parentId);
      return f?.id;
    };
    const lanes: Lane[] = top.map((f) => ({ id: f.id, title: f.title || "Untitled", w: 250 }));
    const per = new Map<string, number>();
    const empty = new Map<string, number>();
    const cards: LaneCard[] = [];
    // Nodes belong to a frame by id, or (boards laid out on a grid) by where they sit.
    const under = (n: Board["nodes"][number]) => top.find((f) => n.x >= f.x && n.x < f.x + f.width && n.y >= f.y && n.y < f.y + f.height)?.id;
    for (const n of board.nodes) {
      const lane = rootOf(n.frameId) ?? under(n);
      const text = n.text.trim();
      if (!lane || !top.some((f) => f.id === lane)) continue;
      if (!text) {
        empty.set(lane, (empty.get(lane) ?? 0) + 1);
        continue;
      }
      const k = per.get(lane) ?? 0;
      if (k >= 12) continue;
      per.set(lane, k + 1);
      cards.push({ id: n.id, lane, title: text.length > 90 ? `${text.slice(0, 88)}…` : text, tone: toneOf(n.color) });
    }
    for (const l of lanes) if (empty.get(l.id)) l.sub = `${empty.get(l.id)} empty slot${empty.get(l.id) === 1 ? "" : "s"} to fill`;
    return { lanes, cards };
  }, [board]);
  if (!lanes.length) return <p className="faint">This template has no frames to show as lanes; switch to Whiteboard.</p>;
  return <LaneBoard title={board.name} theme={theme} lanes={lanes} cards={cards} cardHeight={72} readOnly />;
}

function toneOf(color: string | undefined): number {
  const c = (color ?? "").toLowerCase();
  if (/yellow|fff6c2|fff9b1|ffd|ffe/.test(c)) return 1;
  if (/blue|cfe3fb|e6e0ff|purple|violet/.test(c)) return 2;
  if (/green|dcf3e4|teal/.test(c)) return 3;
  if (/red|pink|fbd9d2|orange/.test(c)) return 4;
  return 0;
}

function Thumb({ summary: t }: { summary: Summary }) {
  // The template's own theme swatches, so "All methods" shows each one in its method's colours.
  const th = THEMES[methodTheme(t.info?.method)];
  const tones = [th.tones[0], th.tones[1], th.tones[2], th.tones[3], th.tones[4], th.tones[1]];
  return (
    <div aria-hidden="true" className="tpl-thumb" style={{ background: th.bg }}>
      {tones.map((c, i) => (
        <div key={i} style={{ borderRadius: 4, background: c, border: `1px solid ${th.line}` }} />
      ))}
    </div>
  );
}
