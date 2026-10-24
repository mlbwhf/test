"use client";

// Card types: the structured vocabulary behind every card. Built-in types carry SAFe's colour
// legend; admins recolour them and add their own types with fields.

import { useState } from "react";
import type { CardField, CardType } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, useMe, type ApiFailure } from "@/lib/api";
import { KIND_LABEL, type RefKind } from "@/components/link-picker";

const FIELD_TYPES = ["text", "number", "select", "date", "person", "ref", "url"] as const;

export default function CardTypesPage() {
  const me = useMe();
  const data = useApi<{ types: CardType[] }>("/v1/card-types");
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; color: string; badge: string; blurb: string; refKind: RefKind | ""; fields: CardField[] } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const admin = !!me.data?.permissions.model;
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
      await data.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  if (!data.data) return <Loading error={data.error} />;
  const types = data.data.types;
  const startEdit = (t: CardType) => {
    setEditing(t.id);
    setDraft({ name: t.name, color: t.color, badge: t.badge, blurb: t.blurb, refKind: t.refKind ?? "", fields: t.fields.map((f) => ({ ...f })) });
  };
  const save = () => {
    if (!draft) return;
    const body = { name: draft.name, color: draft.color, badge: draft.badge, blurb: draft.blurb, fields: draft.fields, ...(draft.refKind ? { refKind: draft.refKind } : {}) };
    void run(async () => {
      if (editing) await api("PUT", `/v1/card-types/${encodeURIComponent(editing)}`, body);
      else await api("POST", "/v1/card-types", body);
      setDraft(null);
      setEditing(null);
    });
  };
  const setFieldAt = (i: number, patch: Partial<CardField>) => setDraft((d) => d && { ...d, fields: d.fields.map((f, k) => (k === i ? { ...f, ...patch } : f)) });

  return (
    <>
      <PageHead
        title="Card types"
        sub="What a card can be, with the fields it carries. Built-in types follow SAFe's colour legend (G user story, P maintenance, Y exploration enabler, O infrastructure enabler, R risks and dependencies); admins recolour them and add types of their own. Any card on any board can carry a type, and a linked card shows its record live."
        actions={admin ? <button className="btn primary" onClick={() => (setEditing(null), setDraft({ name: "", color: "#e0f2f1", badge: "", blurb: "", refKind: "", fields: [] }))}>New card type</button> : undefined}
      />
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      {draft ? (
        <section className="panel panel-body stack" aria-label={editing ? "Edit card type" : "New card type"}>
          <div className="row">
            <label className="field" style={{ flex: "1 1 200px" }}>
              Name
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} disabled={!!editing && types.find((t) => t.id === editing)?.builtin} />
            </label>
            <label className="field">
              Colour
              <input className="input" type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} style={{ width: 70, padding: 2 }} />
            </label>
            <label className="field">
              Badge
              <input className="input" value={draft.badge} maxLength={16} placeholder="G · STORY" onChange={(e) => setDraft({ ...draft, badge: e.target.value })} style={{ width: 150 }} />
            </label>
            <label className="field">
              Stands for
              <select className="select" value={draft.refKind} onChange={(e) => setDraft({ ...draft, refKind: e.target.value as RefKind | "" })} disabled={!!editing && types.find((t) => t.id === editing)?.builtin}>
                <option value="">Nothing structured</option>
                {(Object.keys(KIND_LABEL) as RefKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            What it is for
            <input className="input" value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} />
          </label>
          {!(editing && types.find((t) => t.id === editing)?.builtin) ? (
            <>
              <span className="eyebrow">Fields</span>
              {draft.fields.map((f, i) => (
                <div key={i} className="row">
                  <input className="input" placeholder="key" value={f.key} onChange={(e) => setFieldAt(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} style={{ width: 130 }} aria-label="Field key" />
                  <input className="input" placeholder="Label" value={f.label} onChange={(e) => setFieldAt(i, { label: e.target.value })} style={{ flex: "1 1 160px" }} aria-label="Field label" />
                  <select className="select" value={f.type} onChange={(e) => setFieldAt(i, { type: e.target.value as CardField["type"] })} aria-label="Field type">
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {f.type === "select" ? <input className="input" placeholder="options, comma separated" value={(f.options ?? []).join(", ")} onChange={(e) => setFieldAt(i, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} style={{ flex: "1 1 200px" }} aria-label="Options" /> : null}
                  <button className="btn small ghost" onClick={() => setDraft({ ...draft, fields: draft.fields.filter((_, k) => k !== i) })} aria-label="Remove field">
                    ×
                  </button>
                </div>
              ))}
              <div>
                <button className="btn small" onClick={() => setDraft({ ...draft, fields: [...draft.fields, { key: `field${draft.fields.length + 1}`, label: "", type: "text" }] })}>
                  + Field
                </button>
              </div>
            </>
          ) : (
            <p className="faint">Built-in types keep their fields; colour, badge and description are yours to change.</p>
          )}
          <div className="row">
            <button className="btn primary" disabled={!draft.name.trim()} onClick={save}>
              Save
            </button>
            <button className="btn ghost" onClick={() => (setDraft(null), setEditing(null))}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Badge</th>
              <th>Stands for</th>
              <th>Fields</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="lp-swatch" style={{ background: t.color, width: 22, height: 22 }} />
                    <span>
                      <b>{t.name}</b>
                      <div className="faint" style={{ fontSize: "0.78rem" }}>{t.blurb}</div>
                    </span>
                  </span>
                </td>
                <td className="mono">{t.badge || "–"}</td>
                <td>{t.refKind ? KIND_LABEL[t.refKind] : <span className="faint">–</span>}</td>
                <td className="faint" style={{ fontSize: "0.8rem" }}>{t.fields.map((f) => f.label).join(", ") || "–"}</td>
                <td>
                  {admin ? (
                    <span className="row" style={{ gap: 4 }}>
                      <button className="btn small ghost" onClick={() => startEdit(t)}>
                        {t.builtin ? "Recolour" : "Edit"}
                      </button>
                      {!t.builtin ? (
                        <button className="btn small ghost" onClick={() => void run(() => api("DELETE", `/v1/card-types/${encodeURIComponent(t.id)}`))}>
                          Remove
                        </button>
                      ) : null}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
