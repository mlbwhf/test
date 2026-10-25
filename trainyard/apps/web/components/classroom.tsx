"use client";

// The Classes space, in the Classroom theme: the class boards a trainer runs (start one from
// the built-in class, reopen the ones already running), breakout tables that seat four, and
// the day plan with each half-day holding 180 minutes. Breakouts and agenda are kept per class.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CLASSES, type ClassSpec, type LaneCard } from "@trainyard/core";
import { LaneBoard, StatChip, useLaneState, type Lane } from "@/components/lane-board";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, useMe, type ApiFailure } from "@/lib/api";
import { useSavedClassTemplates } from "@/lib/class-templates";

interface BoardSummary {
  id: string;
  name: string;
  templateId?: string;
  isTemplate?: boolean;
  origin: { importedAt: string };
}

const ROLES = ["Release train engineer", "Product owner", "Scrum master", "Developer", "Business owner", "System architect", "Product manager", "UX lead"];

function useClassPick() {
  const [id, setId] = useState<string>(CLASSES[0]!.id);
  const spec = CLASSES.find((c) => c.id === id) ?? CLASSES[0]!;
  const picker = (
    <label className="row" style={{ gap: 6 }}>
      <span className="eyebrow">Class</span>
      <select className="select" value={id} onChange={(e) => setId(e.target.value)}>
        {CLASSES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
  return { spec, picker };
}

export function ClassBoards() {
  const router = useRouter();
  const me = useMe();
  const boards = useApi<{ boards: BoardSummary[] }>("/v1/boards");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Classes someone saved as a template (fields.class) are started from here, not the template gallery.
  const savedIds = useSavedClassTemplates(boards.data?.boards.filter((b) => b.isTemplate).map((b) => b.id));
  const saved = (boards.data?.boards ?? []).filter((b) => b.isTemplate && savedIds?.has(b.id));
  const running = (boards.data?.boards ?? []).filter((b) => !b.isTemplate && (b.templateId?.startsWith("tpl-builtin-class-") || (!!b.templateId && !!savedIds?.has(b.templateId))));
  const start = (c: ClassSpec) => startFrom(c.id, `tpl-builtin-class-${c.id}`, `${c.short} class ${new Date().toISOString().slice(0, 10)}`);
  const startFrom = async (key: string, templateId: string, name: string) => {
    setBusy(key);
    try {
      const r = await api<{ board: { id: string } }>("POST", `/v1/templates/boards/${encodeURIComponent(templateId)}/create`, { name });
      router.push(`/boards/${encodeURIComponent(r.board.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
      setBusy(null);
    }
  };
  return (
    <>
      <PageHead title="Class boards" sub="Teach for free: every class opens with a Welcome area (how to work on the board, agenda and logistics, icebreaker), then a tab per lesson. The chapters that teach a Trainyard tool are built from the tool itself, so the class changes when the tool does." />
      {err ? <ErrorList title="Could not start the class" items={[{ message: err }]} /> : null}
      {me.data?.principal.anonymous ? <div className="notice warn">Sign up free to start a class board: classes are kept for signed-up trainers.</div> : null}
      <div className="cls-grid">
        {CLASSES.map((c, i) => (
          <article key={c.id} className="cls-card" style={{ background: `var(--th-t${(i % 4) + 1})`, transform: `rotate(${i % 2 ? 0.6 : -0.5}deg)` }}>
            <span className="lb-tape" aria-hidden="true" />
            <div className="cls-card-top">
              <span className="lb-tag">{c.short}</span>
              <span className="lb-chip">
                {c.days} day{c.days === 1 ? "" : "s"} · {c.lessons.length} lessons
              </span>
            </div>
            <h2>{c.name}</h2>
            <p>{c.blurb}</p>
            <ol className="cls-lessons">
              {c.lessons.map((l) => (
                <li key={l.title}>{l.title}</li>
              ))}
            </ol>
            <div className="row" style={{ marginTop: "auto" }}>
              <button className="btn primary" disabled={busy !== null || !!me.data?.principal.anonymous} onClick={() => void start(c)}>
                {busy === c.id ? "Starting…" : "Start this class"}
              </button>
              <Link className="btn" href={`/templates?tpl=tpl-builtin-class-${c.id}`}>
                Preview
              </Link>
            </div>
          </article>
        ))}
      </div>
      {saved.length ? (
        <section className="panel panel-body stack" aria-labelledby="cls-saved-head">
          <h2 id="cls-saved-head">Your class templates</h2>
          <ul className="cls-running">
            {saved.map((t) => (
              <li key={t.id}>
                <span>
                  {t.name} <span className="faint mono">{t.origin.importedAt.slice(0, 10)}</span>
                </span>
                <button className="btn small" disabled={busy !== null || !!me.data?.principal.anonymous} onClick={() => void startFrom(t.id, t.id, `${t.name} ${new Date().toISOString().slice(0, 10)}`)} aria-label={`Start a class from ${t.name}`}>
                  {busy === t.id ? "Starting…" : "Start a class"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="panel panel-body stack">
        <h2>Classes you are running</h2>
        {!boards.data ? (
          <Loading error={boards.error} />
        ) : running.length ? (
          <ul className="cls-running">
            {running.map((b) => (
              <li key={b.id}>
                <Link href={`/boards/${encodeURIComponent(b.id)}`}>{b.name}</Link>
                <span className="faint mono">{b.origin.importedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="faint">None yet. Start a class above; it appears here and under Templates → Your boards.</p>
        )}
      </section>
    </>
  );
}

const SAMPLE = ["Amara Okafor", "Diego Ramos", "Mei Chen", "Jonas Weber", "Priya Nair", "Sam Ellis", "Lena Costa", "Tariq Aziz", "Ana Silva", "Kofi Mensah", "Ida Berg", "Raj Patel"];

const tables = (n: number): Lane[] => [{ id: "roster", title: "Roster", sub: "Not seated yet", w: 250 }, ...Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, title: `Table ${i + 1}`, sub: "Planning team", cap: 4, unit: "seats", hard: true, w: 250 }))];

export function Breakouts() {
  const { spec, picker } = useClassPick();
  return <BreakoutBoard key={spec.id} spec={spec} picker={picker} />;
}

function BreakoutBoard({ spec, picker }: { spec: ClassSpec; picker: React.ReactNode }) {
  const st = useLaneState(`class-breakouts-${spec.id}`, () => SAMPLE.map((name, i) => ({ id: `p${i}`, lane: "roster", title: name, sub: ROLES[i % ROLES.length]!, tone: (i % 4) + 1 })));
  const [name, setName] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const cards = st.cards ?? [];
  const n = count ?? Math.max(3, ...cards.map((c) => Number(c.lane?.replace(/^t/, "")) || 0));
  const lanes = useMemo(() => tables(n), [n]);
  if (st.cards === null) return <Loading error={null} />;
  const seated = cards.filter((c) => c.lane !== "roster").length;
  const add = () => {
    const t = name.trim();
    if (!t) return;
    st.setCards([...cards, { id: `p${Date.now().toString(36)}`, lane: "roster", title: t, sub: "Participant", tone: (cards.length % 4) + 1 }]);
    setName("");
  };
  const shuffle = () => {
    const people = [...cards].sort(() => Math.random() - 0.5);
    st.setCards(people.map((c, i) => ({ ...c, lane: i < n * 4 ? `t${(i % n) + 1}` : "roster" })));
  };
  return (
    <>
      <PageHead title="Breakout groups" sub="Drag participants onto tables. Each table seats four; a full table refuses the fifth. Kept per class." actions={picker} />
      <div className="row cls-tools">
        <input className="input" placeholder="Add a participant" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} aria-label="Participant name" />
        <button className="btn" onClick={add} disabled={!name.trim()}>
          Add
        </button>
        <span className="ws-grow" />
        <button className="btn" onClick={() => setCount(Math.max(1, n - 1))} disabled={cards.some((c) => c.lane === `t${n}`)} title="Remove the last table (it must be empty)">
          − Table
        </button>
        <button className="btn" onClick={() => setCount(Math.min(12, n + 1))}>
          + Table
        </button>
        <button className="btn" onClick={shuffle}>
          Seat everyone at random
        </button>
        <button className="btn ghost" onClick={() => st.setCards(cards.map((c) => ({ ...c, lane: "roster" })))}>
          Clear tables
        </button>
      </div>
      {st.error ? <div className="notice warn">Not saved: {st.error}</div> : null}
      <LaneBoard
        title={`${spec.short} breakout groups`}
        theme="classes"
        lanes={lanes}
        cards={cards}
        cardHeight={70}
        extras={st.extras}
        onExtras={st.setExtras}
        strip={
          <>
            <StatChip label="Class" value={spec.name} />
            <StatChip label="Seated" value={`${seated} of ${cards.length}`} />
          </>
        }
        onMove={(id, lane, index) => {
          const card = cards.find((c) => c.id === id)!;
          const rest = cards.filter((c) => c.id !== id);
          const inLane = rest.filter((c) => c.lane === lane);
          const at = index < inLane.length ? rest.indexOf(inLane[index]!) : rest.length;
          st.setCards([...rest.slice(0, at), { ...card, lane }, ...rest.slice(at)]);
        }}
      />
    </>
  );
}

/** Half-days of 180 minutes for every class day, plus a parking lot. */
const sessions = (days: number): Lane[] => [...Array.from({ length: days }, (_, d) => [{ id: `d${d + 1}am`, title: `Day ${d + 1} · Morning`, sub: "09:00–12:00", cap: 180, unit: "min", w: 280 }, { id: `d${d + 1}pm`, title: `Day ${d + 1} · Afternoon`, sub: "13:00–16:00", cap: 180, unit: "min", w: 280 }]).flat(), { id: "park", title: "Parking lot", sub: "If time allows", w: 280 }];

function seedAgenda(spec: ClassSpec): LaneCard[] {
  // Lessons spread evenly over the half-days, each sized so a half-day stays inside 180 minutes.
  const lanes = sessions(spec.days).filter((l) => l.cap);
  const perLane = Math.ceil(spec.lessons.length / lanes.length);
  const minutes = Math.max(30, Math.floor(165 / perLane / 15) * 15);
  return spec.lessons.map((l, i) => {
    const lane = lanes[Math.min(lanes.length - 1, Math.floor((i * lanes.length) / spec.lessons.length))]!;
    return { id: `l${i}`, lane: lane.id, title: `${i + 1}. ${l.title}`, tag: l.exercises.length ? "WORKSHOP" : "TALK", chip: `${minutes} min`, size: minutes, tone: (i % 4) + 1 };
  });
}

export function Agenda() {
  const { spec, picker } = useClassPick();
  return <AgendaBoard key={spec.id} spec={spec} picker={picker} />;
}

function AgendaBoard({ spec, picker }: { spec: ClassSpec; picker: React.ReactNode }) {
  const st = useLaneState(`class-agenda-${spec.id}`, () => seedAgenda(spec));
  const lanes = useMemo(() => sessions(spec.days), [spec.days]);
  if (st.cards === null) return <Loading error={null} />;
  const cards = st.cards;
  const planned = cards.filter((c) => c.lane !== "park").reduce((n, c) => n + (c.size ?? 0), 0);
  const resize = (id: string, delta: number) => st.setCards(cards.map((c) => (c.id === id ? { ...c, size: Math.max(15, (c.size ?? 30) + delta), chip: `${Math.max(15, (c.size ?? 30) + delta)} min` } : c)));
  return (
    <>
      <PageHead title="Day plan" sub="Drag lessons between sessions. Each half-day holds 180 minutes; going over warns you. Adjust a lesson's length with − and +. Kept per class." actions={picker} />
      <div className="row cls-tools">
        <span className="ws-grow" />
        <button className="btn ghost" onClick={() => st.setCards(seedAgenda(spec))}>
          Reset to the class order
        </button>
      </div>
      <LaneBoard
        title={`${spec.short} day plan`}
        theme="classes"
        lanes={lanes}
        cards={cards}
        cardHeight={112}
        extras={st.extras}
        onExtras={st.setExtras}
        strip={
          <>
            <StatChip label="Class" value={spec.name} />
            <StatChip label="Planned" value={`${Math.floor(planned / 60)}h ${planned % 60}m`} />
          </>
        }
        cardFoot={(c) => (
          <>
            <button className="lb-mini" aria-label={`Shorten ${c.title}`} onClick={() => resize(c.id, -15)}>
              −15
            </button>
            <button className="lb-mini" aria-label={`Lengthen ${c.title}`} onClick={() => resize(c.id, 15)}>
              +15
            </button>
          </>
        )}
        onMove={(id, lane, index) => {
          const card = cards.find((c) => c.id === id)!;
          const rest = cards.filter((c) => c.id !== id);
          const inLane = rest.filter((c) => c.lane === lane);
          const at = index < inLane.length ? rest.indexOf(inLane[index]!) : rest.length;
          st.setCards([...rest.slice(0, at), { ...card, lane }, ...rest.slice(at)]);
        }}
      />
    </>
  );
}
