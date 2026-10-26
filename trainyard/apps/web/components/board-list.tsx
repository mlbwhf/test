"use client";

// The one list of boards and classes, used wherever they are listed (Classes, Rooms, a room, Your
// boards): each row with its icon, name and date, and Open, Rename, Invite students (classes) and
// Delete; tick several to delete them at once.

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ClassIcon } from "@/components/class-icon";
import { ClassStudents } from "@/components/class-students";
import { ErrorList } from "@/components/ui";
import { api, type ApiFailure } from "@/lib/api";

export interface ListedBoard {
  id: string;
  name: string;
  templateId?: string | undefined;
  importedAt?: string | undefined;
}

const BUILTIN = "tpl-builtin-class-";
/** A class board: started from a built-in class or the trainer's own course. */
export const isClassBoard = (b: ListedBoard) => !!b.templateId && (b.templateId.startsWith(BUILTIN) || b.templateId.startsWith("tpl-deck-"));
const classIdOf = (b: ListedBoard) => (b.templateId?.startsWith(BUILTIN) ? b.templateId.slice(BUILTIN.length) : undefined);

export function BoardList({ boards, onChanged, title, empty, icon, extra, canEdit = true }: { boards: ListedBoard[]; onChanged: () => void; title?: ReactNode; empty?: ReactNode; /** The icon of a board that is not a class (a class shows its own). */ icon?: (b: ListedBoard) => ReactNode; /** More actions on a row, e.g. take it out of a room. */ extra?: (b: ListedBoard) => ReactNode; canEdit?: boolean }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const shown = new Set(boards.map((b) => b.id));
  const chosen = [...picked].filter((id) => shown.has(id));
  const toggle = (id: string) => setPicked((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));
  const run = async (fn: () => Promise<unknown>) => {
    setWorking(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as ApiFailure).message);
    } finally {
      setWorking(false);
      onChanged();
    }
  };
  const remove = (ids: string[]) => {
    const names = boards.filter((b) => ids.includes(b.id)).map((b) => b.name);
    if (!ids.length || !window.confirm(ids.length === 1 ? `Delete "${names[0]}"? It cannot be undone; a class's student links stop working.` : `Delete these ${ids.length} boards? It cannot be undone; classes' student links stop working.\n\n${names.join("\n")}`)) return;
    void run(async () => {
      for (const id of ids) await api("DELETE", `/v1/boards/${encodeURIComponent(id)}`);
      setPicked(new Set());
    });
  };
  const rename = (b: ListedBoard) => {
    const name = window.prompt("New name", b.name)?.trim();
    if (name && name !== b.name) void run(() => api("PATCH", `/v1/boards/${encodeURIComponent(b.id)}`, { name }));
  };
  return (
    <section className="blist" aria-label={typeof title === "string" ? title : "Boards"}>
      {title || (canEdit && boards.length) ? (
        <header>
          {title ? <b className="blist-title">{title}</b> : null}
          <span className="grow" />
          {canEdit && boards.length ? (
            <>
              <label className="row" style={{ gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={chosen.length === boards.length} onChange={(e) => setPicked(e.target.checked ? new Set(boards.map((b) => b.id)) : new Set())} /> Select all
              </label>
              <button className="train-btn small" disabled={!chosen.length || working} onClick={() => remove(chosen)}>
                Delete selected{chosen.length ? ` (${chosen.length})` : ""}
              </button>
            </>
          ) : null}
        </header>
      ) : null}
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      {boards.length ? (
        boards.map((b) => {
          const cls = isClassBoard(b);
          return (
            <div key={b.id} className="blist-row">
              <div className="blist-main">
                {canEdit ? <input type="checkbox" checked={picked.has(b.id)} onChange={() => toggle(b.id)} aria-label={`Select ${b.name}`} /> : null}
                <span className="blist-icon">{cls ? <ClassIcon classId={classIdOf(b)} name={b.name} size={36} /> : icon?.(b)}</span>
                <Link className="blist-name" href={`/boards/${encodeURIComponent(b.id)}`}>
                  {b.name}
                </Link>
                {b.importedAt ? <span className="train-mono">{b.importedAt.slice(0, 10)}</span> : null}
                <span className="grow" />
                <Link className="train-btn small primary" href={`/boards/${encodeURIComponent(b.id)}`}>
                  Open
                </Link>
                {canEdit ? (
                  <>
                    <button className="train-btn small" disabled={working} onClick={() => rename(b)}>
                      Rename
                    </button>
                    {cls ? (
                      <button className="train-btn small" aria-expanded={inviting === b.id} onClick={() => setInviting(inviting === b.id ? null : b.id)}>
                        Invite students
                      </button>
                    ) : null}
                    {extra?.(b)}
                    <button className="train-btn small" disabled={working} onClick={() => remove([b.id])}>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
              {inviting === b.id ? <ClassStudents boardId={b.id} /> : null}
            </div>
          );
        })
      ) : (
        <p className="faint blist-empty">{empty ?? "Nothing here yet."}</p>
      )}
    </section>
  );
}
