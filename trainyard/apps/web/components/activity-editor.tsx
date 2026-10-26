"use client";

// Sets a frame up as a class activity: its kind and title, how long to prepare and to share,
// the steps learners follow, what shows beside it (a web page, a picture, text, an answer key
// only the trainer sees) and, for mapping exercises, the connection types learners draw.

import { useState } from "react";
import { DEFAULT_CONNECTION_COLORS, type Activity, type ConnectionType, type Frame, type SideItem } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

const KINDS = ["Activity", "Discussion", "Exercise", "Reflection"];
type SideKind = "url" | "image" | "text";
const sideKind = (x: SideItem): SideKind => (x.image !== undefined ? "image" : x.url !== undefined ? "url" : "text");

export function ActivityEditor({ boardId, frame, onSaved, onError }: { boardId: string; frame: Frame; onSaved: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const base = `/v1/boards/${encodeURIComponent(boardId)}`;
  if (!frame.parentId) {
    // A lesson: add a new activity to it.
    const add = () =>
      api("POST", `${base}/activities`, {
        lessonId: frame.id,
        activities: [
          {
            title: "New activity",
            kind: "Activity",
            prepare: 10,
            share: 3,
            steps: "Step 1: …\nStep 2: Be ready to share with the class.",
          },
        ],
      }).then(onSaved, (e: ApiFailure) => onError(e.message));
    return (
      <button className="btn small" onClick={() => void add()}>
        + Activity in this lesson
      </button>
    );
  }
  return (
    <>
      <button className="btn small" onClick={() => setOpen(true)}>
        {frame.activity ? "Edit activity…" : "Set up as an activity…"}
      </button>
      {open ? <Dialog base={base} frame={frame} onClose={() => setOpen(false)} onSaved={() => (setOpen(false), onSaved())} onError={onError} /> : null}
    </>
  );
}

function Dialog({ base, frame, onClose, onSaved, onError }: { base: string; frame: Frame; onClose: () => void; onSaved: () => void; onError: (m: string) => void }) {
  const a: Activity = frame.activity ?? { kind: "Activity", steps: "" };
  const [kind, setKind] = useState(a.kind);
  const [title, setTitle] = useState(frame.title.replace(new RegExp(`^${a.kind}:\\s*`), ""));
  const [prepare, setPrepare] = useState(a.prepare?.toString() ?? "");
  const [share, setShare] = useState(a.share?.toString() ?? "");
  const [steps, setSteps] = useState(a.steps);
  const [side, setSide] = useState<SideItem[]>(a.side ?? []);
  const [types, setTypes] = useState<ConnectionType[]>(a.connectionTypes ?? []);
  const [busy, setBusy] = useState(false);
  const setItem = (i: number, patch: Partial<SideItem>) => setSide((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setKindOf = (i: number, k: SideKind) =>
    setSide((xs) =>
      xs.map((x, j) =>
        j === i
          ? {
              title: x.title,
              ...(x.instructorOnly ? { instructorOnly: true } : {}),
              ...(k === "url" ? { url: "" } : k === "text" ? { text: "" } : { image: "" }),
            }
          : x,
      ),
    );
  const picture = (i: number, f: File) => {
    if (f.size > 4 * 1024 * 1024) return onError("Pictures up to 4 MB, please.");
    const r = new FileReader();
    r.onload = () => setItem(i, { image: String(r.result) });
    r.readAsDataURL(f);
  };
  const minutes = (v: string) => (v.trim() === "" ? undefined : Math.max(0, Math.round(Number(v))));
  const save = async (clear = false) => {
    setBusy(true);
    try {
      const p = minutes(prepare);
      const s = minutes(share);
      const activity = clear
        ? null
        : {
            kind,
            steps,
            ...(p !== undefined ? { prepare: p } : {}),
            ...(s !== undefined ? { share: s } : {}),
            ...(a.shareLabel ? { shareLabel: a.shareLabel } : {}),
            side: side
              .filter((x) => x.title.trim() && (sideKind(x) === "text" || (sideKind(x) === "url" ? !!x.url?.trim() : !!x.image)))
              .map((x) => ({
                ...x,
                ...(x.url !== undefined ? { url: x.url.trim() } : {}),
              })),
            connectionTypes: types.filter((t) => t.label.trim()),
          };
      await api("PATCH", `${base}/frames/${encodeURIComponent(frame.id)}`, {
        activity,
        ...(clear ? {} : { title: `${kind}: ${title.trim() || "Untitled"}` }),
      });
      onSaved();
    } catch (e) {
      onError((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="lp-backdrop" role="presentation" onClick={onClose} style={{ zIndex: 90, padding: "4vh 16px" }}>
      <div
        className="panel panel-body stack"
        role="dialog"
        aria-modal="true"
        aria-label="Activity"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ margin: 0 }}>Activity</h3>
        <div className="row" style={{ alignItems: "end" }}>
          <label className="field" style={{ width: 160 }}>
            Kind
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {[...new Set([...KINDS, kind])].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="field" style={{ flex: 1 }}>
            Title
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>
        <div className="row">
          <label className="field" style={{ width: 150 }}>
            Prepare (min)
            <input className="input" type="number" min={0} value={prepare} onChange={(e) => setPrepare(e.target.value)} />
          </label>
          <label className="field" style={{ width: 150 }}>
            Share (min)
            <input className="input" type="number" min={0} value={share} onChange={(e) => setShare(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Steps, one per line
          <textarea className="input" rows={7} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>

        <span className="eyebrow">Beside the activity</span>
        {side.map((x, i) => (
          <div key={i} className="panel panel-body stack" style={{ gap: 6 }}>
            <div className="row">
              <input className="input" style={{ flex: 1 }} placeholder="Title, e.g. The RTE role" value={x.title} onChange={(e) => setItem(i, { title: e.target.value })} aria-label="Title" />
              <select className="select" value={sideKind(x)} onChange={(e) => setKindOf(i, e.target.value as SideKind)} aria-label="What it is">
                <option value="url">Web page</option>
                <option value="image">Picture</option>
                <option value="text">Text</option>
              </select>
              <button className="btn small ghost" onClick={() => setSide((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove">
                ×
              </button>
            </div>
            {sideKind(x) === "url" ? <input className="input" type="url" placeholder="https://…" value={x.url ?? ""} onChange={(e) => setItem(i, { url: e.target.value })} aria-label="Address" /> : null}
            {sideKind(x) === "image" ? (
              <div className="row">
                {x.image ? <img src={x.image} alt="" style={{ height: 60, borderRadius: 6 }} /> : null}
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(e) => e.target.files?.[0] && picture(i, e.target.files[0])} aria-label="Picture" />
              </div>
            ) : null}
            {sideKind(x) === "text" ? <textarea className="input" rows={3} value={x.text ?? ""} onChange={(e) => setItem(i, { text: e.target.value })} aria-label="Text" /> : null}
            <label className="row" style={{ gap: 6, fontSize: "0.82rem" }}>
              <input type="checkbox" checked={!!x.instructorOnly} onChange={(e) => setItem(i, e.target.checked ? { instructorOnly: true } : { instructorOnly: false })} /> Trainer only (an answer key, notes)
            </label>
          </div>
        ))}
        <div className="row">
          <button className="btn small" onClick={() => setSide((xs) => [...xs, { title: "", url: "" }])} disabled={side.length >= 8}>
            + Web page, picture or text
          </button>
        </div>

        <span className="eyebrow">Connection types (for mapping exercises)</span>
        {types.map((t, i) => (
          <div key={i} className="row">
            <input type="color" value={t.color || DEFAULT_CONNECTION_COLORS[i % DEFAULT_CONNECTION_COLORS.length]} onChange={(e) => setTypes((ts) => ts.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} aria-label="Colour" />
            <input
              className="input"
              style={{ flex: 1 }}
              value={t.label}
              placeholder="e.g. Communicates with Business Owners about priorities"
              onChange={(e) => setTypes((ts) => ts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              aria-label="Connection type"
            />
            <button className="btn small ghost" onClick={() => setTypes((ts) => ts.filter((_, j) => j !== i))} aria-label="Remove">
              ×
            </button>
          </div>
        ))}
        <div className="row">
          <button
            className="btn small"
            disabled={types.length >= 8}
            onClick={() =>
              setTypes((ts) => [
                ...ts,
                {
                  id: `t${Date.now().toString(36)}`,
                  label: "",
                  color: DEFAULT_CONNECTION_COLORS[ts.length % DEFAULT_CONNECTION_COLORS.length]!,
                },
              ])
            }
          >
            + Connection type
          </button>
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          {frame.activity ? (
            <button className="btn ghost" disabled={busy} onClick={() => void save(true)}>
              Make it a plain frame
            </button>
          ) : (
            <span />
          )}
          <div className="row">
            <button className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy} onClick={() => void save()}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Brings a set of activities into a lesson from a file: course material the trainer holds a
 * licence for stays in their workspace and never ships with Trainyard. The file is JSON:
 * { "lesson": 1, "activities": [{ "title", "kind", "prepare", "share", "steps", "side", "connectionTypes", "items" }] }.
 */
export function ImportActivities({ board, onDone, onError }: { board: { id: string; frames: Frame[] }; onDone: (msg: string) => void; onError: (m: string) => void }) {
  const lessons = board.frames.filter((f) => !f.parentId).sort((a, b) => a.y - b.y || a.x - b.x);
  const [lesson, setLesson] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async (file: File) => {
    setBusy(true);
    try {
      const pack = JSON.parse(await file.text()) as {
        lesson?: number | string;
        activities?: unknown[];
        lessons?: { activities?: unknown[] }[];
      };
      if (Array.isArray(pack.lessons)) {
        // A whole course file: each of its lessons goes into this board's lesson with the same number.
        let n = 0;
        for (const [i, l] of pack.lessons.entries()) {
          const target = lessons.find((f) => new RegExp(`^Lesson\\s+${i + 1}\\b`, "i").test(f.title));
          if (!target || !l.activities?.length) continue;
          await api("POST", `/v1/boards/${encodeURIComponent(board.id)}/activities`, { lessonId: target.id, activities: l.activities });
          n += l.activities.length;
        }
        onDone(`Added ${n} exercises to the lessons with the same numbers.`);
        return;
      }
      if (!Array.isArray(pack.activities) || !pack.activities.length) throw new Error("The file has no activities.");
      // The file may name its lesson by number ("Lesson 1: …"); the picker wins when set.
      const byNumber = pack.lesson !== undefined ? lessons.find((f) => new RegExp(`^Lesson\\s+${pack.lesson}\\b`, "i").test(f.title)) : undefined;
      const target = lessons.find((f) => f.id === lesson) ?? byNumber;
      if (!target) throw new Error("Pick the lesson to add them to.");
      await api("POST", `/v1/boards/${encodeURIComponent(board.id)}/activities`, { lessonId: target.id, activities: pack.activities });
      onDone(`Added ${pack.activities.length} activities to "${target.title}". Open the lesson tab to see them.`);
    } catch (e) {
      onError(e instanceof SyntaxError ? "That file is not activity JSON." : ((e as ApiFailure).message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="row" style={{ gap: 6 }}>
      <select className="select" aria-label="Lesson to add activities to" value={lesson} onChange={(e) => setLesson(e.target.value)}>
        <option value="">Lesson named in the file</option>
        {lessons.map((f) => (
          <option key={f.id} value={f.id}>
            {f.title}
          </option>
        ))}
      </select>
      <label className="btn" aria-disabled={busy}>
        {busy ? "Adding…" : "Add activities from a file…"}
        <input type="file" accept="application/json,.json" hidden disabled={busy} onChange={(e) => (e.target.files?.[0] && void load(e.target.files[0]), (e.target.value = ""))} />
      </label>
    </span>
  );
}
