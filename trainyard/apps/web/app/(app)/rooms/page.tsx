"use client";

// Rooms: the workspace's boards organised by purpose (an ART's planning room, the OKR room,
// the portfolio room, a class cohort), each deciding who may enter. The plan sets how many
// rooms there are and whether they can be private; the meter shows where the workspace stands.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROOM_KINDS, ROOM_KIND_LABELS, type RoomKind } from "@trainyard/core";
import { Loading, PageHead } from "@/components/ui";
import { BoardList } from "@/components/board-list";
import { api, useApi, useMe, type ApiFailure } from "@/lib/api";
import { ACCESS_LABEL, KIND_COLOR, type RoomView } from "@/lib/rooms";
import "./rooms.css";

export default function RoomsPage() {
  const q = useApi<{ rooms: RoomView[]; unassigned: { id: string; name: string; templateId?: string; importedAt?: string }[]; allowance: { used: number; rooms: number | null; privateRooms: boolean } }>("/v1/rooms");
  const me = useMe();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoomKind>("art");
  const [visibility, setVisibility] = useState<"open" | "private">("open");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!q.data) return <Loading error={q.error} />;
  const { rooms, allowance, unassigned } = q.data;
  const canCreate = !!me.data?.permissions?.plan;
  const full = allowance.rooms !== null && allowance.used >= allowance.rooms;
  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ room: RoomView }>("POST", "/v1/rooms", { name: name.trim(), kind, visibility });
      router.push(`/rooms/${encodeURIComponent(r.room.id)}`);
    } catch (x) {
      setErr((x as ApiFailure).message);
      setBusy(false);
    }
  };
  return (
    <>
      <PageHead
        title="Rooms"
        sub="A room holds the boards and views for one purpose: an ART's planning room, the OKR room, the portfolio room, a class. Who may enter is decided per room; rooms can be connected or stand alone."
        actions={
          <div className="rm-allow" aria-label="Rooms on your plan">
            {allowance.rooms === null ? (
              <span>
                {allowance.used} {allowance.used === 1 ? "room" : "rooms"} · unlimited on your plan
              </span>
            ) : (
              <>
                <span className="rm-meter" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (allowance.used / Math.max(1, allowance.rooms)) * 100)}%` }} />
                </span>
                <span>
                  {allowance.used} of {allowance.rooms} rooms
                </span>
                {full ? <Link href="/billing">More rooms</Link> : null}
              </>
            )}
          </div>
        }
      />
      {canCreate ? (
        <form className="panel panel-body rm-new" onSubmit={create} aria-label="New room">
          <label>
            Room name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="ART Credit, Company OKRs…" />
          </label>
          <label>
            Purpose
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as RoomKind)}>
              {ROOM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ROOM_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Who can enter
            <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value as "open" | "private")}>
              <option value="open">Everyone in the workspace</option>
              <option value="private" disabled={!allowance.privateRooms}>
                Only people I add{allowance.privateRooms ? "" : " (Trainer and Academy)"}
              </option>
            </select>
          </label>
          <button className="btn primary" disabled={busy || full || !name.trim()}>
            {full ? "Room limit reached" : busy ? "Creating…" : "Create room"}
          </button>
        </form>
      ) : null}
      {err ? (
        <div className="notice crit" role="alert">
          {err}
        </div>
      ) : null}
      {ROOM_KINDS.filter((k) => rooms.some((r) => r.kind === k)).map((k) => (
        <section key={k} className="rm-group" aria-labelledby={`rm-${k}`}>
          <h2 id={`rm-${k}`}>{ROOM_KIND_LABELS[k]}s</h2>
          <div className="rm-grid">
            {rooms
              .filter((r) => r.kind === k)
              .map((r) => (
                <Link key={r.id} href={`/rooms/${encodeURIComponent(r.id)}`} className="card rm-card">
                  <span className="rm-swatch" style={{ background: KIND_COLOR[r.kind] }} aria-hidden="true">
                    {r.name.slice(0, 1).toUpperCase()}
                  </span>
                  <h3>{r.name}</h3>
                  {r.description ? <span className="faint">{r.description}</span> : null}
                  <span className="rm-meta">
                    <span className="chip">
                      {r.boards.length} {r.boards.length === 1 ? "board" : "boards"}
                    </span>
                    <span className="chip">{r.visibility === "private" ? `Private · ${r.members.length} people` : "Open to the workspace"}</span>
                    {r.links.length ? <span className="chip">{r.links.length} connected</span> : null}
                    <span className="chip">{ACCESS_LABEL[r.access]}</span>
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ))}
      {rooms.length === 0 ? <p className="faint">No rooms yet. Create one above, then add boards to it, or keep working with boards on their own: rooms are optional.</p> : null}
      {unassigned.length ? (
        <section className="rm-group" aria-labelledby="rm-loose">
          <h2 id="rm-loose">Boards outside any room · open to the whole workspace</h2>
          <BoardList boards={unassigned} onChanged={() => void q.reload()} canEdit={canCreate} />
        </section>
      ) : null}
    </>
  );
}
