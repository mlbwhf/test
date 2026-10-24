"use client";

// One room: its boards, the app views pinned to it, who may enter and how, and the rooms it
// is connected to. Managers run the room; editors add and move boards; others look.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ROOM_KIND_LABELS } from "@trainyard/core";
import { Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";
import { ACCESS_LABEL, KIND_COLOR, type RoomView } from "@/lib/rooms";
import "../rooms.css";

type Access = "view" | "edit" | "manage";
interface Detail {
  room: RoomView;
  people?: { id: string; name: string; role: string }[];
  others: { id: string; name: string; kind: RoomView["kind"] }[];
  unassigned: { id: string; name: string }[];
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useApi<Detail>(`/v1/rooms/${encodeURIComponent(id)}`);
  const templates = useApi<{ builtin: { id: string; name: string }[]; saved: { id: string; name: string }[] }>("/v1/templates/boards");
  const [err, setErr] = useState<string | null>(null);
  const [boardName, setBoardName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [moveId, setMoveId] = useState("");
  const [person, setPerson] = useState("");
  const [personAccess, setPersonAccess] = useState<Access>("edit");
  const [linkId, setLinkId] = useState("");
  if (!q.data) return <Loading error={q.error} />;
  const { room, people, others, unassigned } = q.data;
  const canEdit = room.access === "edit" || room.access === "manage";
  const manage = room.access === "manage";
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
      await q.reload();
    } catch (x) {
      setErr((x as ApiFailure).message);
    }
  };
  const setMembers = (members: { userId: string; access: Access }[]) => run(() => api("PUT", `/v1/rooms/${encodeURIComponent(room.id)}/members`, { members }));
  const current = room.members.map(({ userId, access }) => ({ userId, access }));
  const addBoard = async () => {
    const name = boardName.trim() || `${room.name} board`;
    try {
      const r = templateId
        ? await api<{ board: { id: string } }>("POST", `/v1/templates/boards/${encodeURIComponent(templateId)}/create`, { name, roomId: room.id })
        : await api<{ board: { id: string } }>("POST", "/v1/boards/blank", { name, roomId: room.id });
      router.push(`/boards/${encodeURIComponent(r.board.id)}`);
    } catch (x) {
      setErr((x as ApiFailure).message);
    }
  };
  return (
    <>
      <PageHead
        title={room.name}
        sub={
          <>
            {ROOM_KIND_LABELS[room.kind]} · {room.visibility === "private" ? "private: only the people below and workspace admins" : `open to the workspace (${room.defaultAccess === "edit" ? "everyone can edit" : "everyone can look, members edit"})`} · you: {ACCESS_LABEL[room.access].toLowerCase()}
            {room.description ? <> · {room.description}</> : null}
          </>
        }
        actions={
          <Link className="btn" href="/rooms">
            All rooms
          </Link>
        }
      />
      {err ? (
        <div className="notice crit" role="alert">
          {err}
        </div>
      ) : null}
      {room.pins.length ? (
        <nav className="rm-pins" aria-label="Pinned views">
          {room.pins.map((p) => (
            <Link key={p.href} href={p.href} className="ws-chip">
              {p.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="rm-cols" style={{ marginTop: 14 }}>
        <section className="panel panel-body stack" aria-labelledby="rm-boards">
          <h2 id="rm-boards" style={{ margin: 0 }}>
            Boards
          </h2>
          {room.boards.length ? (
            <ul className="rm-list">
              {room.boards.map((b) => (
                <li key={b.id}>
                  <Link href={`/boards/${encodeURIComponent(b.id)}`}>{b.name}</Link>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="faint">{b.nodes} cards</span>
                    {canEdit ? (
                      <button className="btn ghost small" onClick={() => void run(() => api("PUT", `/v1/boards/${encodeURIComponent(b.id)}/room`, { roomId: null }))} aria-label={`Take ${b.name} out of this room`}>
                        Take out
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="faint" style={{ margin: 0 }}>
              No boards in this room yet.
            </p>
          )}
          {canEdit ? (
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="stack" style={{ gap: 4, flex: "1 1 180px" }}>
                  <span className="faint">New board</span>
                  <input className="input" value={boardName} onChange={(e) => setBoardName(e.target.value)} placeholder={`${room.name} board`} maxLength={120} />
                </label>
                <label className="stack" style={{ gap: 4, flex: "1 1 200px" }}>
                  <span className="faint">Start from</span>
                  <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                    <option value="">A blank whiteboard</option>
                    {[...(templates.data?.saved ?? []), ...(templates.data?.builtin ?? [])].map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn primary" onClick={() => void addBoard()}>
                  Add board
                </button>
              </div>
              {unassigned.length ? (
                <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <label className="stack" style={{ gap: 4, flex: "1 1 260px" }}>
                    <span className="faint">Or move a board in from the whole workspace</span>
                    <select className="select" value={moveId} onChange={(e) => setMoveId(e.target.value)}>
                      <option value="">Choose a board…</option>
                      {unassigned.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn" disabled={!moveId} onClick={() => void run(() => api("PUT", `/v1/boards/${encodeURIComponent(moveId)}/room`, { roomId: room.id })).then(() => setMoveId(""))}>
                    Move in
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="stack" style={{ gap: 16 }}>
          <section className="panel panel-body stack" aria-labelledby="rm-people">
            <h2 id="rm-people" style={{ margin: 0 }}>
              People
            </h2>
            <p className="faint" style={{ margin: 0 }}>
              {room.visibility === "private" ? "Only these people (and workspace admins) can enter." : "Everyone in the workspace can enter; people here get more than the default."} A workspace viewer only ever looks.
            </p>
            {room.members.length ? (
              <ul className="rm-list">
                {room.members.map((m) => (
                  <li key={m.userId}>
                    <span>{m.name}</span>
                    {manage ? (
                      <span className="row" style={{ gap: 6 }}>
                        <select className="select" aria-label={`Access for ${m.name}`} value={m.access} onChange={(e) => void setMembers(current.map((c) => (c.userId === m.userId ? { ...c, access: e.target.value as Access } : c)))}>
                          {(["view", "edit", "manage"] as const).map((a) => (
                            <option key={a} value={a}>
                              {ACCESS_LABEL[a]}
                            </option>
                          ))}
                        </select>
                        <button className="btn ghost small" aria-label={`Remove ${m.name}`} onClick={() => void setMembers(current.filter((c) => c.userId !== m.userId))}>
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="faint">{ACCESS_LABEL[m.access]}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {manage && people ? (
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <select className="select" aria-label="Person to add" value={person} onChange={(e) => setPerson(e.target.value)} style={{ flex: "1 1 140px" }}>
                  <option value="">Add a person…</option>
                  {people
                    .filter((p) => !room.members.some((m) => m.userId === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                </select>
                <select className="select" aria-label="Their access" value={personAccess} onChange={(e) => setPersonAccess(e.target.value as Access)}>
                  {(["view", "edit", "manage"] as const).map((a) => (
                    <option key={a} value={a}>
                      {ACCESS_LABEL[a]}
                    </option>
                  ))}
                </select>
                <button className="btn" disabled={!person} onClick={() => void setMembers([...current, { userId: person, access: personAccess }]).then(() => setPerson(""))}>
                  Add
                </button>
              </div>
            ) : null}
            {manage ? (
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="btn small" onClick={() => void run(() => api("PATCH", `/v1/rooms/${encodeURIComponent(room.id)}`, { visibility: room.visibility === "private" ? "open" : "private" }))}>
                  {room.visibility === "private" ? "Open to the workspace" : "Make private"}
                </button>
                {room.visibility === "open" ? (
                  <button className="btn small" onClick={() => void run(() => api("PATCH", `/v1/rooms/${encodeURIComponent(room.id)}`, { defaultAccess: room.defaultAccess === "edit" ? "view" : "edit" }))}>
                    {room.defaultAccess === "edit" ? "Others can only look" : "Let everyone edit"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="panel panel-body stack" aria-labelledby="rm-links">
            <h2 id="rm-links" style={{ margin: 0 }}>
              Connected rooms
            </h2>
            {room.links.length ? (
              <ul className="rm-list">
                {room.links.map((l) => (
                  <li key={l.id}>
                    <span className="row" style={{ gap: 8 }}>
                      <span className="rm-swatch" style={{ background: KIND_COLOR[l.kind], width: 22, height: 22, borderRadius: 6 }} aria-hidden="true" />
                      {l.visible ? <Link href={`/rooms/${encodeURIComponent(l.id)}`}>{l.name}</Link> : <span className="faint">{l.name}</span>}
                    </span>
                    {manage ? (
                      <button className="btn ghost small" aria-label={`Disconnect ${l.name}`} onClick={() => void run(() => api("PUT", `/v1/rooms/${encodeURIComponent(room.id)}/links/${encodeURIComponent(l.id)}`, { on: false }))}>
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="faint" style={{ margin: 0 }}>
                Stands alone. Connect it to the rooms it works with: an ART room to the portfolio and OKR rooms, a team room to its ART.
              </p>
            )}
            {manage && others.some((o) => !room.links.some((l) => l.id === o.id)) ? (
              <div className="row" style={{ gap: 8 }}>
                <select className="select" aria-label="Room to connect" value={linkId} onChange={(e) => setLinkId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Connect a room…</option>
                  {others
                    .filter((o) => !room.links.some((l) => l.id === o.id))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} · {ROOM_KIND_LABELS[o.kind]}
                      </option>
                    ))}
                </select>
                <button className="btn" disabled={!linkId} onClick={() => void run(() => api("PUT", `/v1/rooms/${encodeURIComponent(room.id)}/links/${encodeURIComponent(linkId)}`, { on: true })).then(() => setLinkId(""))}>
                  Connect
                </button>
              </div>
            ) : null}
          </section>

          {manage ? (
            <button
              className="btn ghost"
              onClick={() => {
                if (window.confirm(`Delete ${room.name}? Its boards stay, open to the whole workspace.`)) void api("DELETE", `/v1/rooms/${encodeURIComponent(room.id)}`).then(() => router.push("/rooms"), (x: ApiFailure) => setErr(x.message));
              }}
            >
              Delete room
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
