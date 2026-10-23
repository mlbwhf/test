"use client";

import Link from "next/link";
import { useState } from "react";
import type { BoardOrigin } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface Connection {
  id: string;
  system: string;
  label: string;
  account?: string;
  createdAt: string;
  lastUsedAt?: string;
}
interface SourceInfo {
  label: string;
  fields: { key: "token" | "apiKey"; label: string; help: string }[];
  docs: string;
}
interface BoardSummary {
  id: string;
  name: string;
  origin: BoardOrigin;
  isTemplate: boolean;
  templateId?: string;
  shape: string;
  counts: { frames: number; nodes: number; edges: number; columns: number; rows: number };
}
interface RemoteBoard {
  id: string;
  name: string;
  url?: string;
  container?: string;
  updatedAt?: string;
  imported: boolean;
}

const SOURCE_LABEL: Record<string, string> = { miro: "Miro", mural: "Mural", monday: "monday.com", trello: "Trello", iobeya: "iObeya", csv: "CSV", json: "JSON", trainyard: "Trainyard" };

export default function ImportsPage() {
  const conns = useApi<{ connections: Connection[]; sources: Record<string, SourceInfo>; persistent: boolean }>("/v1/connections");
  const boards = useApi<{ boards: BoardSummary[] }>("/v1/boards");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (!conns.data || !boards.data) return <Loading error={conns.error ?? boards.error} />;

  const after = (msg: string) => {
    setErr(null);
    setDone(msg);
    void boards.reload();
    void conns.reload();
  };
  const fail = (e: unknown) => {
    setDone(null);
    setErr((e as ApiFailure).message);
  };
  const templates = boards.data.boards.filter((b) => b.isTemplate);
  const imported = boards.data.boards.filter((b) => !b.isTemplate);

  return (
    <>
      <PageHead title="Bring your own boards" sub="Connect Miro, Mural, monday.com or Trello and pull a board in exactly as it is, upload an iObeya board export, or a CSV or JSON from any other tool. Save any board as a template, and map its cards or rows onto the plan when you are ready." />
      {!conns.data.persistent ? <div className="notice warn">Connection tokens are encrypted with a key that lives only in this process. Set TRAINYARD_SECRET on the API server so connections survive a restart.</div> : null}
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      {done ? <div className="notice" role="status">{done}</div> : null}

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Connections</h2>
            <span className="faint">{conns.data.connections.length}</span>
          </div>
          <div className="panel-body stack">
            {conns.data.connections.map((c) => (
              <ConnectionRow key={c.id} connection={c} onImported={(name) => after(`Imported "${name}".`)} onError={fail} onRemoved={() => after("Connection removed.")} />
            ))}
            {conns.data.connections.length === 0 ? <p className="faint">No tools connected yet.</p> : null}
            <ConnectForm sources={conns.data.sources} onConnected={(label) => after(`Connected ${label}.`)} onError={fail} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Upload a file</h2>
            <span className="faint">any tool</span>
          </div>
          <div className="panel-body stack">
            <UploadForms onImported={(name) => after(`Imported "${name}".`)} onError={fail} />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Imported boards</h2>
          <span className="faint">{imported.length}</span>
        </div>
        <BoardTable boards={imported} empty="Nothing imported yet." />
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Templates</h2>
          <span className="faint">{templates.length}</span>
        </div>
        <BoardTable boards={templates} empty="Open an imported board and choose “Save as template”." />
      </section>
    </>
  );
}

function BoardTable({ boards, empty }: { boards: BoardSummary[]; empty: string }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Board</th>
          <th>From</th>
          <th>Shape</th>
          <th>Contents</th>
          <th>Imported</th>
        </tr>
      </thead>
      <tbody>
        {boards.map((b) => (
          <tr key={b.id}>
            <td>
              <Link href={`/boards/${encodeURIComponent(b.id)}`}>
                <strong>{b.name}</strong>
              </Link>
            </td>
            <td>
              <span className="chip">{SOURCE_LABEL[b.origin.system] ?? b.origin.system}</span>{" "}
              {b.origin.url ? (
                <a href={b.origin.url} target="_blank" rel="noreferrer" className="faint" style={{ fontSize: "0.8rem" }}>
                  open source
                </a>
              ) : null}
            </td>
            <td className="muted">{b.shape}</td>
            <td className="mono faint" style={{ fontSize: "0.8rem" }}>
              {b.shape === "table" ? `${b.counts.rows} rows · ${b.counts.columns} columns` : `${b.counts.frames} frames · ${b.counts.nodes} cards · ${b.counts.edges} connectors`}
            </td>
            <td className="mono faint" style={{ fontSize: "0.8rem" }}>{b.origin.importedAt.slice(0, 10)}</td>
          </tr>
        ))}
        {boards.length === 0 ? (
          <tr>
            <td colSpan={5} className="faint">
              {empty}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function ConnectionRow({ connection: c, onImported, onError, onRemoved }: { connection: Connection; onImported: (name: string) => void; onError: (e: unknown) => void; onRemoved: () => void }) {
  const [remote, setRemote] = useState<RemoteBoard[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const browse = async () => {
    setBusy("list");
    try {
      setRemote((await api<{ boards: RemoteBoard[] }>("GET", `/v1/connections/${c.id}/boards`)).boards);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };
  const pull = async (b: RemoteBoard) => {
    setBusy(b.id);
    try {
      await api("POST", "/v1/imports", { connectionId: c.id, boardId: b.id });
      onImported(b.name);
      setRemote((r) => r?.map((x) => (x.id === b.id ? { ...x, imported: true } : x)) ?? null);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="stack" style={{ gap: 6, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>
          <span className="chip">{SOURCE_LABEL[c.system]}</span> <strong>{c.label}</strong>
          {c.account ? <span className="faint"> · {c.account}</span> : null}
        </span>
        <span className="row">
          <button className="btn small" onClick={browse} disabled={busy === "list"}>
            {busy === "list" ? "Loading…" : remote ? "Refresh" : "Browse boards"}
          </button>
          <button className="btn small ghost" onClick={async () => (await api("DELETE", `/v1/connections/${c.id}`), onRemoved())}>
            Remove
          </button>
        </span>
      </div>
      {remote ? (
        <table className="table">
          <tbody>
            {remote.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.name}
                  {b.container ? <span className="faint"> · {b.container}</span> : null}
                </td>
                <td className="mono faint" style={{ fontSize: "0.78rem" }}>{b.updatedAt?.slice(0, 10)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn small" onClick={() => pull(b)} disabled={busy === b.id}>
                    {busy === b.id ? "Importing…" : b.imported ? "Import again" : "Import"}
                  </button>
                </td>
              </tr>
            ))}
            {remote.length === 0 ? (
              <tr>
                <td className="faint">No boards visible to this token.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

function ConnectForm({ sources, onConnected, onError }: { sources: Record<string, SourceInfo>; onConnected: (label: string) => void; onError: (e: unknown) => void }) {
  const keys = Object.keys(sources);
  const [system, setSystem] = useState(keys[0] ?? "miro");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const src = sources[system]!;
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("POST", "/v1/connections", { system, token: values.token ?? "", ...(values.apiKey ? { apiKey: values.apiKey } : {}) });
          setValues({});
          onConnected(src.label);
        } catch (x) {
          onError(x);
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="eyebrow">Connect a tool</span>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field">
          Tool
          <select id="conn-system" className="select" value={system} onChange={(e) => (setSystem(e.target.value), setValues({}))}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {sources[k]!.label}
              </option>
            ))}
          </select>
        </label>
        {src.fields.map((f) => (
          <label key={f.key} className="field" style={{ flex: "1 1 200px" }}>
            {f.label}
            <input id={`conn-${f.key}`} className="input" type="password" autoComplete="off" required value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          </label>
        ))}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Connect"}
        </button>
      </div>
      <p className="faint" style={{ fontSize: "0.8rem" }}>
        {src.fields.map((f) => f.help).join(" ")}{" "}
        <a href={src.docs} target="_blank" rel="noreferrer">
          Docs
        </a>
        . Tokens are stored encrypted and used only to read your boards.
      </p>
    </form>
  );
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function IobeyaUpload({ onError }: { onError: (e: unknown) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [library, setLibrary] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        setBusy(true);
        try {
          const contentBase64 = toBase64(await file.arrayBuffer());
          const r = await api<{ board: { id: string } }>("POST", "/v1/imports/iobeya", { fileName: file.name, contentBase64, ...(library ? { includeLibrary: true } : {}), ...(name.trim() ? { name: name.trim() } : {}) });
          window.location.assign(`/boards/${encodeURIComponent(r.board.id)}`);
        } catch (x) {
          onError(x);
          setBusy(false);
        }
      }}
    >
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 200px" }}>
          iObeya export (.zip or the .csv inside it)
          <input id="iobeya-file" className="input" type="file" accept=".zip,.csv,application/zip,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        </label>
        <label className="field" style={{ flex: "1 1 160px" }}>
          Board name (optional)
          <input id="iobeya-name" className="input" placeholder="Taken from the file" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <label className="row" style={{ gap: 8, fontSize: "0.88rem" }}>
        <input id="iobeya-library" type="checkbox" checked={library} onChange={(e) => setLibrary(e.target.checked)} />
        Also bring the card library (cards defined in the room but not placed on this board)
      </label>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="faint" style={{ fontSize: "0.8rem" }}>
          In iObeya, open the board menu and choose Export. Program boards, team boards, Kanban, roadmaps and free boards come in with their teams, iterations, stages, cards, notes, charts, images and dependencies.
        </span>
        <button className="btn primary" type="submit" disabled={!file || busy}>
          {busy ? "Importing…" : "Import board"}
        </button>
      </div>
    </form>
  );
}

function UploadForms({ onImported, onError }: { onImported: (name: string) => void; onError: (e: unknown) => void }) {
  const [mode, setMode] = useState<"iobeya" | "miro" | "csv" | "json">("iobeya");
  const [name, setName] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [text, setText] = useState("");
  const read = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result ?? ""));
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    };
    r.readAsText(file);
  };
  const tabs = (
    <div className="tabs" role="tablist">
      <button type="button" role="tab" aria-selected={mode === "iobeya"} onClick={() => setMode("iobeya")}>
        iObeya board export
      </button>
      <button type="button" role="tab" aria-selected={false} onClick={() => setMode("miro")}>
        Miro board CSV
      </button>
      <button type="button" role="tab" aria-selected={false} onClick={() => setMode("csv")}>
        CSV / spreadsheet export
      </button>
      <button type="button" role="tab" aria-selected={false} onClick={() => setMode("json")}>
        Trainyard board JSON
      </button>
    </div>
  );
  if (mode === "iobeya")
    return (
      <div className="stack">
        {tabs}
        <IobeyaUpload onError={onError} />
      </div>
    );
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          if (mode === "csv") await api("POST", "/v1/imports/csv", { name, csv: text, ...(groupBy ? { groupBy } : {}) });
          else if (mode === "miro") await api("POST", "/v1/imports/miro-csv", { name, csv: text });
          else await api("POST", "/v1/imports/json", { board: JSON.parse(text) });
          onImported(name || "board");
          setText("");
        } catch (x) {
          onError(x instanceof SyntaxError ? new Error(`Not valid JSON: ${x.message}`) : x);
        }
      }}
    >
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={false} onClick={() => setMode("iobeya")}>
          iObeya board export
        </button>
        <button type="button" role="tab" aria-selected={mode === "miro"} onClick={() => setMode("miro")}>
          Miro board CSV
        </button>
        <button type="button" role="tab" aria-selected={mode === "csv"} onClick={() => setMode("csv")}>
          CSV / spreadsheet export
        </button>
        <button type="button" role="tab" aria-selected={mode === "json"} onClick={() => setMode("json")}>
          Trainyard board JSON
        </button>
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="field" style={{ flex: "1 1 160px" }}>
          File
          <input id="upload-file" className="input" type="file" accept={mode === "json" ? ".json,application/json" : ".csv,.tsv,text/csv,text/plain"} onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
        </label>
        {mode === "csv" || mode === "miro" ? (
          <>
            <label className="field">
              Board name
              <input id="upload-name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            {mode === "csv" ? (
              <label className="field">
                Group rows by column (optional)
                <input id="upload-group" className="input" placeholder="e.g. Team" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} />
              </label>
            ) : null}
          </>
        ) : null}
      </div>
      <label className="field">
        {mode === "json" ? "Or paste JSON" : "Or paste CSV"}
        <textarea id="upload-text" className="textarea mono" style={{ minHeight: 110, fontSize: "0.8rem" }} value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === "csv" ? "Feature,Team,Points\nGuest checkout,Checkout,13" : '{ "name": "My board", "columns": ["Title", "Team"], "rows": [{ "Title": "Guest checkout", "Team": "Checkout" }] }'} required />
      </label>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="faint" style={{ fontSize: "0.8rem" }}>
          {mode === "miro" ? "Needs a free account. Miro: board menu → Export → CSV. Widget texts come in reading order without positions, so blocks become frames of cards; a class board arrives as its lessons and exercises, ready to tidy. (.rtb backups are encrypted by Miro and cannot be read.)" : mode === "csv" ? "Any export with a header row: Excel, Google Sheets, Airtable, Notion, Smartsheet, Jira, Asana." : "Frames, cards, connectors, columns and rows; see the README for the format. Any script or tool that can write this file can bring a board in."}
        </span>
        <button className="btn primary" type="submit" disabled={!text}>
          Import
        </button>
      </div>
    </form>
  );
}
