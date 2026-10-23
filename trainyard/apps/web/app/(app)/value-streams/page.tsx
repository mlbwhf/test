"use client";

import { useEffect, useMemo, useState } from "react";
import {
  artFit,
  identificationIssues,
  mapMetrics,
  stepImpact,
  type IdentificationIssue,
  type MapMetrics,
  type ValueStreamIdentification,
  type ValueStreamMap,
} from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

type Vsi = ValueStreamIdentification & { issues?: IdentificationIssue[] };
type Vsm = ValueStreamMap & { metrics?: { current: MapMetrics; future: MapMetrics } };

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const strip = <T extends object>(x: T, keys: string[]): T => Object.fromEntries(Object.entries(x).filter(([k]) => !keys.includes(k))) as T;

export default function ValueStreamsPage() {
  const data = useApi<{ identifications: Vsi[]; maps: Vsm[] }>("/v1/value-streams");
  const [tab, setTab] = useState<"identify" | "map">("identify");
  const [vsi, setVsi] = useState<Vsi | null>(null);
  const [vsm, setVsm] = useState<Vsm | null>(null);
  const [dirty, setDirty] = useState<{ vsi: boolean; vsm: boolean }>({ vsi: false, vsm: false });
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!data.data) return;
    if (!vsi) setVsi(data.data.identifications[0] ?? null);
    if (!vsm) setVsm(data.data.maps[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.data]);

  if (!data.data) return <Loading error={data.error} />;

  const save = async (kind: "vsi" | "vsm") => {
    setErr(null);
    try {
      if (kind === "vsi" && vsi) {
        const r = await api<{ identification: Vsi }>("PUT", `/v1/value-streams/identifications/${encodeURIComponent(vsi.id)}`, strip(vsi, ["issues", "updatedAt"]));
        setVsi(r.identification);
      }
      if (kind === "vsm" && vsm) {
        const r = await api<{ map: Vsm }>("PUT", `/v1/value-streams/maps/${encodeURIComponent(vsm.id)}`, strip(vsm, ["metrics", "updatedAt"]));
        setVsm(r.map);
      }
      setDirty((d) => ({ ...d, [kind]: false }));
      setDone("Saved.");
      setTimeout(() => setDone(null), 2500);
      void data.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <PageHead
        title="Value streams"
        sub="Identify them in a workshop: the customer's steps, the systems behind them, the people who build those systems, and the trains that follow. Then map one and measure it: active time, wait time and percent complete and accurate, now and after the improvements."
        actions={
          <div className="tabs" role="tablist" aria-label="Value stream views">
            <button role="tab" aria-selected={tab === "identify"} onClick={() => setTab("identify")}>
              Identification
            </button>
            <button role="tab" aria-selected={tab === "map"} onClick={() => setTab("map")}>
              Mapping
            </button>
          </div>
        }
      />
      {err ? <ErrorList title="Not saved" items={[{ message: err }]} /> : null}
      {done ? <div className="notice" role="status">{done}</div> : null}
      {tab === "identify" && vsi ? (
        <IdentifyView
          vsi={vsi}
          dirty={dirty.vsi}
          onChange={(v) => {
            setVsi(v);
            setDirty((d) => ({ ...d, vsi: true }));
          }}
          onSave={() => void save("vsi")}
          onReset={() => {
            setVsi(data.data!.identifications.find((x) => x.id === vsi.id) ?? null);
            setDirty((d) => ({ ...d, vsi: false }));
          }}
          onMeasure={() => setTab("map")}
        />
      ) : null}
      {tab === "map" && vsm ? (
        <MapView
          vsm={vsm}
          dirty={dirty.vsm}
          onChange={(m) => {
            setVsm(m);
            setDirty((d) => ({ ...d, vsm: true }));
          }}
          onSave={() => void save("vsm")}
          onReset={() => {
            setVsm(data.data!.maps.find((x) => x.id === vsm.id) ?? null);
            setDirty((d) => ({ ...d, vsm: false }));
          }}
          onDerived={(m) => {
            setVsm(m);
            setDirty((d) => ({ ...d, vsm: false }));
            setDone("Current state calculated from the status history and saved.");
            setTimeout(() => setDone(null), 3500);
            void data.reload();
          }}
        />
      ) : null}
    </>
  );
}

// ---- identification ------------------------------------------------------------------------

const STAGES = [
  ["Operational value stream", "Start from the customer: the trigger, the steps they and your staff go through, and the value at the end. Click a step to trace who supports it."],
  ["Supporting systems", "Under each step, the systems that make it happen. A system spanning several steps means one team of teams owns a long stretch of the stream."],
  ["People and locations", "Who builds and runs each system, how many people, and where they sit: the raw material for the trains."],
  ["Development value streams", "Group the people and systems that must change together to deliver a feature."],
  ["ART design", "Cut each development value stream into trains of 50 to 125 people that can plan and deliver together."],
] as const;

function IdentifyView({ vsi, dirty, onChange, onSave, onReset, onMeasure }: { vsi: Vsi; dirty: boolean; onChange: (v: Vsi) => void; onSave: () => void; onReset: () => void; onMeasure: () => void }) {
  const [stage, setStage] = useState(5);
  const [sel, setSel] = useState<string | null>(vsi.steps[3]?.id ?? vsi.steps[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const cols = vsi.steps.length + 2 + (editing ? 1 : 0);
  const colOf = new Map(vsi.steps.map((s, i) => [s.id, i + 2]));
  const spanOf = (stepIds: string[]) => {
    const xs = stepIds.map((id) => colOf.get(id)).filter((x): x is number => !!x);
    if (!xs.length) return undefined;
    const a = Math.min(...xs);
    const b = Math.max(...xs);
    return `${a} / span ${b - a + 1}`;
  };
  const sysSteps = (ids: string[]) => vsi.systems.filter((s) => ids.includes(s.id)).flatMap((s) => s.stepIds);
  const impact = sel ? stepImpact(vsi, sel) : null;
  const hitSys = new Set(impact?.systems.map((s) => s.id) ?? []);
  const dim = (ids: string[]) => (impact && hitSys.size && !ids.some((x) => hitSys.has(x)) ? "dim" : "");
  const issues = identificationIssues(vsi);
  // In-place editing helpers.
  const set = (patch: Partial<Vsi>) => onChange({ ...vsi, ...patch });
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const moveStep = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= vsi.steps.length) return;
    const out = [...vsi.steps];
    [out[i], out[j]] = [out[j]!, out[i]!];
    set({ steps: out });
  };
  const chips = (label: string, options: { id: string; name: string }[], selected: string[], onToggle: (id: string) => void) => (
    <div className="row" style={{ gap: 4, marginTop: 6 }}>
      <span className="faint" style={{ fontSize: "0.72rem" }}>
        {label}
      </span>
      {options.map((o) => (
        <label key={o.id} className="chip" style={{ textTransform: "none", letterSpacing: 0, cursor: "pointer", background: selected.includes(o.id) ? "var(--ink)" : undefined, color: selected.includes(o.id) ? "#fff" : undefined }}>
          <input type="checkbox" style={{ display: "none" }} checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} /> {o.name}
        </label>
      ))}
    </div>
  );
  const sysOptions = vsi.systems.map((x) => ({ id: x.id, name: x.name.replace(/ system$/i, "") }));
  const stepOptions = vsi.steps.map((x) => ({ id: x.id, name: x.name }));
  const spanOrFull = (ids: string[]) => spanOf(ids) ?? (editing ? "1 / -1" : undefined);

  return (
    <>
      <section className="panel panel-body stack">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 4, maxWidth: 760 }}>
            <span className="eyebrow">Value stream identification · {editing ? <input className="input" aria-label="Workshop name" style={{ width: 240, display: "inline-block", marginLeft: 6 }} value={vsi.name} onChange={(e) => set({ name: e.target.value })} /> : vsi.name}</span>
            <p className="muted" style={{ margin: 0 }}>{STAGES[stage - 1]![1]}</p>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
              {editing ? "Done editing" : "Edit in place"}
            </button>
            <button className="btn" onClick={onMeasure}>
              Measure it
            </button>
            {dirty ? (
              <>
                <button className="btn ghost" onClick={onReset}>
                  Discard
                </button>
                <button className="btn primary" onClick={onSave}>
                  Save
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="row" role="group" aria-label="Workshop steps">
          {STAGES.map(([label], i) => (
            <button key={label} className={`btn small ${stage === i + 1 ? "primary" : ""}`} onClick={() => setStage(i + 1)} aria-pressed={stage === i + 1}>
              {i + 1} · {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel panel-body">
        <div className="scroll-x">
          <div style={{ minWidth: Math.max(900, cols * 122) }}>
            <div className="vs-lane-label">1 · Operational value stream</div>
            <div className="vs-traveller" aria-hidden="true">
              <span />
            </div>
            <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              <div>
                <div className="vs-actor" aria-hidden="true">
                  <Person />
                </div>
                <div className="vs-cap">
                  <Bolt />
                  {editing ? <input className="vs-capin" aria-label="Trigger" value={vsi.trigger} onChange={(e) => set({ trigger: e.target.value })} /> : vsi.trigger}
                </div>
              </div>
              {vsi.steps.map((s, i) => (
                <div key={s.id} style={{ minWidth: 0 }}>
                  <div className="vs-actor" aria-hidden="true">
                    {s.actor === "customer" ? <Person /> : <Group />}
                  </div>
                  {editing ? (
                    <>
                      <span className="vs-chev vs-chevedit" aria-pressed={sel === s.id}>
                        <input className="vs-chevin" aria-label="Step name" value={s.name} onFocus={() => setSel(s.id)} onChange={(e) => set({ steps: vsi.steps.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} />
                      </span>
                      <div className="row" style={{ gap: 2, justifyContent: "center", marginTop: 4 }}>
                        <select className="select" aria-label="Who does it" style={{ fontSize: "0.7rem", padding: "2px 4px" }} value={s.actor} onChange={(e) => set({ steps: vsi.steps.map((x) => (x.id === s.id ? { ...x, actor: e.target.value as "customer" | "staff" } : x)) })}>
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                        </select>
                        <button className="btn small ghost" style={{ padding: "2px 6px" }} onClick={() => moveStep(i, -1)} aria-label={`Move ${s.name} earlier`}>
                          ←
                        </button>
                        <button className="btn small ghost" style={{ padding: "2px 6px" }} onClick={() => moveStep(i, 1)} aria-label={`Move ${s.name} later`}>
                          →
                        </button>
                        <button className="btn small ghost" style={{ padding: "2px 6px" }} aria-label={`Remove ${s.name}`} onClick={() => set({ steps: vsi.steps.filter((x) => x.id !== s.id), systems: vsi.systems.map((y) => ({ ...y, stepIds: y.stepIds.filter((z) => z !== s.id) })) })}>
                          ×
                        </button>
                      </div>
                    </>
                  ) : (
                    <button className="vs-chev" aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                      {s.name}
                    </button>
                  )}
                </div>
              ))}
              {editing ? (
                <div style={{ minWidth: 0 }}>
                  <div className="vs-actor" />
                  <button className="vs-chev vs-chevadd" onClick={() => set({ steps: [...vsi.steps, { id: uid("step"), name: "New step", actor: "staff" }] })} aria-label="Add a step">
                    + step
                  </button>
                </div>
              ) : null}
              <div>
                <div className="vs-actor" />
                <div className="vs-cap">
                  <Doc />
                  {editing ? <input className="vs-capin" aria-label="Value delivered" value={vsi.value} onChange={(e) => set({ value: e.target.value })} /> : vsi.value}
                </div>
              </div>
            </div>

            {stage >= 2 ? (
              <>
                <div className="vs-lane-label">2 · Supporting systems</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {vsi.systems.map((s, i) => {
                    const g = spanOrFull(s.stepIds);
                    return g ? (
                      <div key={s.id} className={`vs-bar vs-sys ${dim([s.id])}`} style={{ gridColumn: g, animationDelay: `${i * 80}ms` }}>
                        {editing ? (
                          <>
                            <div className="row" style={{ gap: 4 }}>
                              <input className="vs-in" aria-label="System name" value={s.name} onChange={(e) => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} />
                              <input className="vs-in" aria-label="What it does" placeholder="what it does" value={s.note ?? ""} onChange={(e) => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, note: e.target.value } : x)) })} />
                              <button className="vs-x" aria-label={`Remove ${s.name}`} onClick={() => set({ systems: vsi.systems.filter((x) => x.id !== s.id), groups: vsi.groups.map((gr) => ({ ...gr, systemIds: gr.systemIds.filter((z) => z !== s.id) })), devStreams: vsi.devStreams.map((d) => ({ ...d, systemIds: d.systemIds.filter((z) => z !== s.id) })), arts: vsi.arts.map((a) => ({ ...a, systemIds: a.systemIds.filter((z) => z !== s.id) })) })}>
                                ×
                              </button>
                            </div>
                            {chips("Supports:", stepOptions, s.stepIds, (id) => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, stepIds: toggle(x.stepIds, id) } : x)) }))}
                          </>
                        ) : (
                          <>
                            <b>{s.name}</b>
                            {s.note ? (
                              <>
                                <br />
                                <span className="muted">{s.note}</span>
                              </>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null;
                  })}
                  {editing ? (
                    <button className="vs-bar vs-addbar" style={{ gridColumn: "1 / -1" }} onClick={() => set({ systems: [...vsi.systems, { id: uid("sys"), name: "New system", stepIds: [] }] })}>
                      + system
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            {stage >= 3 ? (
              <>
                <div className="vs-lane-label">3 · People and locations</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoFlow: "row dense" }}>
                  {vsi.groups.map((g, i) => {
                    const span = spanOrFull(sysSteps(g.systemIds));
                    return span ? (
                      <div key={g.id} className={`vs-bar vs-people ${dim(g.systemIds)}`} style={{ gridColumn: span, animationDelay: `${i * 80}ms` }}>
                        {editing ? (
                          <>
                            <div className="row" style={{ gap: 4 }}>
                              <input className="vs-in" type="number" min={0} aria-label="People" style={{ width: 70 }} value={g.people} onChange={(e) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, people: Math.max(0, Math.round(Number(e.target.value) || 0)) } : x)) })} />
                              <span className="faint">people in</span>
                              <input className="vs-in" aria-label="Locations" value={g.locations} onChange={(e) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, locations: e.target.value } : x)) })} />
                              <button className="vs-x" aria-label="Remove these people" onClick={() => set({ groups: vsi.groups.filter((x) => x.id !== g.id) })}>
                                ×
                              </button>
                            </div>
                            {chips("Build:", sysOptions, g.systemIds, (id) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) }))}
                          </>
                        ) : (
                          <>
                            <span>
                              <b>{g.people} people</b> · {g.locations}
                            </span>
                            <span className="mono" style={{ fontSize: "0.72rem" }}>
                              {vsi.systems.filter((s) => g.systemIds.includes(s.id)).map((s) => s.name.replace(/ system$/i, "")).join(" · ")}
                            </span>
                          </>
                        )}
                      </div>
                    ) : null;
                  })}
                  {editing ? (
                    <button className="vs-bar vs-addbar" style={{ gridColumn: "1 / -1" }} onClick={() => set({ groups: [...vsi.groups, { id: uid("grp"), people: 10, locations: "Location", systemIds: [] }] })}>
                      + people
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            {stage >= 4 ? (
              <>
                <div className="vs-lane-label">4 · Development value streams</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {vsi.devStreams.map((d, i) => {
                    const span = spanOrFull(sysSteps(d.systemIds));
                    const people = vsi.groups.filter((g) => g.systemIds.some((x) => d.systemIds.includes(x))).reduce((n, g) => n + g.people, 0);
                    return span ? (
                      <div key={d.id} className={`vs-bar vs-dvs ${dim(d.systemIds)}`} style={{ gridColumn: span, animationDelay: `${i * 100}ms` }}>
                        {editing ? (
                          <>
                            <div className="row" style={{ gap: 4 }}>
                              <input className="vs-in" aria-label="Development value stream name" value={d.name} onChange={(e) => set({ devStreams: vsi.devStreams.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)) })} />
                              <span className="faint">{people} people</span>
                              <button className="vs-x" aria-label={`Remove ${d.name}`} onClick={() => set({ devStreams: vsi.devStreams.filter((x) => x.id !== d.id), arts: vsi.arts.map((a) => (a.devStreamId === d.id ? strip(a, ["devStreamId"]) : a)) })}>
                                ×
                              </button>
                            </div>
                            {chips("Systems:", sysOptions, d.systemIds, (id) => set({ devStreams: vsi.devStreams.map((x) => (x.id === d.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) }))}
                          </>
                        ) : (
                          <>
                            <b>{d.name}</b> · {people} people
                            <span className="vs-mini" aria-hidden="true">
                              <span />
                              <span />
                              <span />
                              <span />
                            </span>
                          </>
                        )}
                      </div>
                    ) : null;
                  })}
                  {editing ? (
                    <button className="vs-bar vs-addbar" style={{ gridColumn: "1 / -1" }} onClick={() => set({ devStreams: [...vsi.devStreams, { id: uid("dvs"), name: "New development value stream", systemIds: [] }] })}>
                      + development value stream
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {stage >= 5 ? (
          <>
            <div className="vs-lane-label">5 · ART design: 50 to 125 people each</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {vsi.arts.map((a, i) => {
                const fit = artFit(a.people);
                return (
                  <article key={a.id} className={`vs-bar card ${dim(a.systemIds)}`} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, animationDelay: `${i * 90}ms` }}>
                    {editing ? (
                      <>
                        <div className="row" style={{ gap: 4 }}>
                          <input className="vs-in" aria-label="Train name" style={{ fontWeight: 700 }} value={a.name} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)) })} />
                          <input className="vs-in" type="number" min={0} aria-label="People" style={{ width: 70 }} value={a.people} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, people: Math.max(0, Math.round(Number(e.target.value) || 0)) } : x)) })} />
                          <button className="vs-x" aria-label={`Remove ${a.name}`} onClick={() => set({ arts: vsi.arts.filter((x) => x.id !== a.id) })}>
                            ×
                          </button>
                        </div>
                        <input className="vs-in" aria-label="Locations" placeholder="locations" value={a.locations} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, locations: e.target.value } : x)) })} />
                        <select className="select" aria-label="Development value stream" value={a.devStreamId ?? ""} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? (e.target.value ? { ...x, devStreamId: e.target.value } : strip(x, ["devStreamId"])) : x)) })}>
                          <option value="">No development value stream</option>
                          {vsi.devStreams.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        {chips("Owns:", sysOptions, a.systemIds, (id) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) }))}
                      </>
                    ) : (
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <b style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{a.name}</b>
                        <span className="mono">{a.people} people</span>
                      </div>
                    )}
                    <div className="vs-meter" role="img" aria-label={`${a.people} people; the healthy band is 50 to 125`}>
                      <div className="band" />
                      <div className="mark" style={{ left: `calc(${Math.min(100, (a.people / 175) * 100).toFixed(1)}% - 2px)`, background: fit === "fits" ? "var(--ink)" : "var(--signal)" }} />
                    </div>
                    <span className="faint" style={{ fontSize: "0.82rem" }}>
                      {a.locations}
                    </span>
                    <span className="chip" style={{ alignSelf: "flex-start", textTransform: "none", letterSpacing: 0, whiteSpace: "normal", fontFamily: "var(--font-body)", lineHeight: 1.3, background: fit === "fits" ? "var(--ok-soft)" : "var(--signal-soft)", color: "var(--ink)" }}>
                      {fit === "fits" ? "Fits the 50 to 125 band" : fit === "split" ? "Above 125: split, or run a Solution Train" : "Below 50: merge with a neighbour"}
                    </span>
                  </article>
                );
              })}
              {editing ? (
                <button className="vs-bar vs-addbar card" style={{ minHeight: 120 }} onClick={() => set({ arts: [...vsi.arts, { id: uid("art"), name: "New train", people: 80, locations: "", systemIds: [] }] })}>
                  + train
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <section className="panel panel-body" aria-live="polite" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Selected step</span>
          <b>{vsi.steps.find((s) => s.id === sel)?.name ?? "None"}</b>
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Systems</span>
          <span>{impact?.systems.map((s) => s.name).join(", ") || "None"}</span>
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">People who change it</span>
          <span>{impact && impact.people ? `${impact.people} in ${impact.groups.map((g) => g.locations).join(", ")}` : "None"}</span>
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Read-out</span>
          <span>{impact?.verdict ?? "Pick a step."}</span>
        </div>
      </section>

      {issues.length ? (
        <section className="notice warn stack" style={{ gap: 4 }}>
          <b>What the facilitator would flag</b>
          {issues.map((i) => (
            <span key={`${i.kind}-${i.ref}`}>{i.message}</span>
          ))}
        </section>
      ) : (
        <div className="notice ok">Every step has a system, every system has people and a train, and every train fits 50 to 125.</div>
      )}

    </>
  );
}

function Person() {
  return (
    <span style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid #9cbf3c", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#2b3640" aria-hidden="true">
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4 22c0-4.6 3.6-8 8-8s8 3.4 8 8z" />
      </svg>
    </span>
  );
}
function Group() {
  return (
    <svg width="48" height="30" viewBox="0 0 52 32" fill="currentColor" aria-hidden="true">
      <circle cx="10" cy="7" r="4" />
      <path d="M4 30v-9a6 6 0 0 1 12 0v9z" />
      <circle cx="26" cy="6" r="4.5" />
      <path d="M19 30v-10a7 7 0 0 1 14 0v10z" />
      <circle cx="42" cy="7" r="4" />
      <path d="M36 30v-9a6 6 0 0 1 12 0v9z" />
    </svg>
  );
}
function Bolt() {
  return (
    <svg width="40" height="30" viewBox="0 0 44 34" fill="none" aria-hidden="true">
      <path d="M2 10h14M5 17h11M8 24h8" stroke="currentColor" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 1 19 19h9l-4 14 15-20h-9l4-12z" fill="#2f6b84" />
    </svg>
  );
}
function Doc() {
  return (
    <svg width="30" height="34" viewBox="0 0 34 38" fill="none" aria-hidden="true">
      <rect x="6" y="2" width="24" height="30" rx="3" stroke="#9cbf3c" strokeWidth="2.5" fill="#fff" />
      <path d="M18 8v12" stroke="#2b3640" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="30" r="7" fill="#2f6b84" />
      <path d="m5.8 30 2.2 2.2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ---- mapping ---------------------------------------------------------------------------

function MapView({ vsm, dirty, onChange, onSave, onReset, onDerived }: { vsm: Vsm; dirty: boolean; onChange: (m: Vsm) => void; onSave: () => void; onReset: () => void; onDerived: (m: Vsm) => void }) {
  const [state, setState] = useState<"current" | "future">("current");
  const [deriving, setDeriving] = useState(false);
  const [sel, setSel] = useState<string | null>(vsm.steps[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const m = useMemo(() => mapMetrics(vsm, state), [vsm, state]);
  const other = useMemo(() => mapMetrics(vsm, state === "current" ? "future" : "current"), [vsm, state]);
  const unit = vsm.unit === "hours" ? "hrs." : "days";
  const fmt = (n: number | null) => (n === null ? "Variable" : `${Math.round(n * 10) / 10} ${n === 1 ? (vsm.unit === "hours" ? "hr." : "day") : unit}`);
  const rows: (typeof vsm.steps)[] = [];
  for (let i = 0; i < vsm.steps.length; i += 4) rows.push(vsm.steps.slice(i, i + 4));
  const lead = m.leadTime || 1;
  const selStep = vsm.steps.find((s) => s.id === sel);
  const better = state === "future" && other.leadTime ? Math.round((1 - m.leadTime / other.leadTime) * 100) : null;
  // In-place editing: the boxes and cells become inputs for the state shown (current or future).
  const set = (patch: Partial<Vsm>) => onChange({ ...vsm, ...patch });
  const patchStep = (id: string, f: (st: Vsm["steps"][number]) => Vsm["steps"][number]) => set({ steps: vsm.steps.map((x) => (x.id === id ? f(x) : x)) });
  const measure = (id: string, key: "wait" | "active" | "ca", v: string) =>
    patchStep(id, (st) => {
      const n = key === "wait" ? (v.trim() === "" ? null : Math.max(0, Number(v) || 0)) : Math.max(0, Math.min(key === "ca" ? 100 : 1e6, Number(v) || 0));
      return { ...st, [state]: { ...st[state], [key]: n } };
    });
  const addStep = () => {
    const id = uid("step");
    set({ steps: [...vsm.steps, { id, name: "New step", current: { wait: 0, active: 1, ca: 100 }, future: { wait: 0, active: 1, ca: 100 } }] });
    setSel(id);
  };
  const removeStep = (id: string) => {
    set({ steps: vsm.steps.filter((x) => x.id !== id) });
    if (sel === id) setSel(null);
  };
  const cellInput = (st: Vsm["steps"][number], key: "wait" | "active" | "ca") => (
    <input className="vsm-in" inputMode="decimal" aria-label={`${st.name}: ${key === "ca" ? "% complete and accurate" : key + " time"} (${state})`} value={st[state][key] === null ? "" : String(st[state][key])} placeholder={key === "wait" ? "var." : ""} onChange={(e) => measure(st.id, key, e.target.value)} />
  );

  return (
    <>
      <section className="panel panel-body row" style={{ justifyContent: "space-between" }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Value stream map</span>
          <b style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>{vsm.name}</b>
        </div>
        <div className="row">
          <div className="tabs" role="group" aria-label="State">
            <button aria-selected={state === "current"} onClick={() => setState("current")}>
              Current state
            </button>
            <button aria-selected={state === "future"} onClick={() => setState("future")}>
              Future state
            </button>
          </div>
          <button className="btn" onClick={() => setDeriving((e) => !e)} aria-pressed={deriving}>
            Calculate from data
          </button>
          {editing ? (
            <>
              <input className="input" aria-label="Map name" style={{ width: 220 }} value={vsm.name} onChange={(e) => set({ name: e.target.value })} />
              <select className="select" aria-label="Unit" value={vsm.unit} onChange={(e) => set({ unit: e.target.value as "hours" | "days" })}>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </>
          ) : null}
          <button className="btn" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? "Done editing" : "Edit in place"}
          </button>
          {dirty ? (
            <>
              <button className="btn ghost" onClick={onReset}>
                Discard
              </button>
              <button className="btn primary" onClick={onSave}>
                Save
              </button>
            </>
          ) : null}
        </div>
      </section>

      {deriving ? <DerivePanel vsm={vsm} dirty={dirty} onDerived={(m) => { setDeriving(false); onDerived(m); }} /> : null}

      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <section className="panel panel-body stack" style={{ flex: "999 1 720px", minWidth: 0, gap: 16 }}>
          <div className="scroll-x">
            <div className="stack" style={{ minWidth: 760, gap: 20 }}>
              {editing && rows.length === 0 ? (
                <button className="vsm-box vsm-addbox" style={{ maxWidth: 160 }} onClick={addStep} aria-label="Add a step">
                  + step
                </button>
              ) : null}
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: "grid", gridTemplateColumns: "84px minmax(0, 1fr) repeat(4, 66px minmax(0, 1fr))", columnGap: 4, rowGap: 2, alignItems: "center" }}>
                  <span />
                  {ri === 0 ? (
                    editing ? (
                      <input className="vsm-box start vsm-edit" aria-label="Trigger" value={vsm.trigger} onChange={(e) => set({ trigger: e.target.value })} />
                    ) : (
                      <div className="vsm-box start" style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{vsm.trigger}</div>
                    )
                  ) : (
                    <span />
                  )}
                  {row.flatMap((s) => [
                    <span key={`${s.id}-c`} style={{ display: "flex", justifyContent: "center" }} aria-label={`${fmt(s[state].wait)} waiting before ${s.name}`}>
                      <Clock neck={m.bottleneck?.stepId === s.id} />
                    </span>,
                    editing ? (
                      <span key={s.id} className="vsm-editbox" aria-pressed={sel === s.id}>
                        <input className="vsm-box vsm-edit" aria-label="Step name" value={s.name} onFocus={() => setSel(s.id)} onChange={(e) => patchStep(s.id, (st) => ({ ...st, name: e.target.value }))} />
                        <button className="vsm-x" aria-label={`Remove ${s.name}`} title="Remove this step" onClick={() => removeStep(s.id)}>
                          ×
                        </button>
                      </span>
                    ) : (
                      <button key={s.id} className="vsm-box" aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                        {s.name}
                      </button>
                    ),
                  ])}
                  {editing && ri === rows.length - 1 && row.length < 4 ? (
                    <>
                      <span />
                      <button className="vsm-box vsm-addbox" onClick={addStep} aria-label="Add a step">
                        + step
                      </button>
                    </>
                  ) : null}
                  {Array.from({ length: (4 - row.length) * 2 - (editing && ri === rows.length - 1 && row.length < 4 ? 2 : 0) }, (_, k) => <span key={`pad-top-${k}`} />)}
                  <span className="vsm-cell vsm-act" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Active time
                  </span>
                  <span className="vsm-cell vsm-act" />
                  {row.flatMap((s) => [<span key={`${s.id}-a0`} className="vsm-cell vsm-act" />, <span key={`${s.id}-a`} className="vsm-cell vsm-act">{editing ? cellInput(s, "active") : fmt(s[state].active)}</span>])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-a-${k}`} className="vsm-cell vsm-act" />)}
                  <span className="vsm-cell" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Wait time
                  </span>
                  <span />
                  {row.flatMap((s) => [<span key={`${s.id}-w`} className={`vsm-cell ${m.bottleneck?.stepId === s.id ? "vsm-neck" : ""}`}>{editing ? cellInput(s, "wait") : fmt(s[state].wait)}</span>, <span key={`${s.id}-w0`} />])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-w-${k}`} />)}
                  <span className="vsm-cell faint" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    %C&amp;A
                  </span>
                  <span />
                  {row.flatMap((s) => [<span key={`${s.id}-c0`} />, <span key={`${s.id}-ca`} className="vsm-cell faint">{editing ? cellInput(s, "ca") : `${s[state].ca}%`}</span>])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-c-${k}`} />)}
                </div>
              ))}
              {editing && rows.length > 0 && rows[rows.length - 1]!.length === 4 ? (
                <button className="vsm-box vsm-addbox" style={{ maxWidth: 160, marginLeft: 88 }} onClick={addStep} aria-label="Add a step">
                  + step
                </button>
              ) : null}
            </div>
          </div>
          {editing ? <p className="faint" style={{ margin: 0, fontSize: "0.8rem" }}>Editing the {state} state: type straight into the boxes and cells. Switch the tab above to edit the other state. Leave wait empty for “variable”.</p> : null}

          <div className="stack" style={{ gap: 6 }}>
            <div className="row faint" style={{ justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span>Lead time to scale: teal is work, grey is waiting, amber the longest queue</span>
              <span className="mono">{fmt(m.leadTime)}</span>
            </div>
            <div role="img" aria-label={`Lead time ${fmt(m.leadTime)}: ${fmt(m.totalActive)} of work and ${fmt(m.totalWait)} waiting`} style={{ display: "flex", height: 52, borderRadius: 12, background: "var(--glass-strong)", padding: 6, boxSizing: "border-box", overflow: "hidden" }}>
              {vsm.steps.flatMap((s) => {
                const w = s[state].wait ?? 0;
                return [
                  w ? <div key={`${s.id}-lw`} className="vsm-lad" style={{ width: `${((w / lead) * 100).toFixed(2)}%`, height: 16, alignSelf: "flex-end", background: m.bottleneck?.stepId === s.id ? "var(--signal)" : "#c3cbd3", borderRadius: 3, marginRight: 1 }} /> : null,
                  <div key={`${s.id}-la`} className="vsm-lad" style={{ width: `${((s[state].active / lead) * 100).toFixed(2)}%`, minWidth: 2, height: 16, alignSelf: "flex-start", background: "#1f6f8b", borderRadius: 3, marginRight: 1 }} />,
                ];
              })}
            </div>
          </div>

          {selStep ? (
            <div className="card" aria-live="polite" style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
              <b style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{selStep.name}</b>
              <span className="mono" style={{ fontSize: "0.82rem" }}>
                active {fmt(selStep[state].active)} · wait before {fmt(selStep[state].wait)} · %C&amp;A {selStep[state].ca}%
              </span>
              {editing ? (
                <label className="field" style={{ flexBasis: "100%" }}>
                  Improvement that moves this step from current to future
                  <input className="input" value={selStep.kaizen ?? ""} placeholder="e.g. automate the handover; approve in the same meeting" onChange={(e) => patchStep(selStep.id, (st) => ({ ...st, kaizen: e.target.value }))} />
                </label>
              ) : selStep.kaizen ? (
                <span style={{ flexBasis: "100%" }}>
                  <b>Improvement:</b> {selStep.kaizen}
                </span>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="panel panel-body stack" style={{ flex: "1 1 250px", gap: 0 }}>
          <Total label="Total active time" hint="time spent on value-added activities" value={fmt(m.totalActive)} />
          <Total label="Total wait time" hint="time between steps when no work is happening" value={fmt(m.totalWait)} />
          <Total label="Flow efficiency" hint="process time / lead time" value={`${Math.round(m.flowEfficiency * 100)}%`}>
            <div style={{ height: 8, borderRadius: 999, background: "var(--sunken)", overflow: "hidden" }}>
              <div className="vsm-lad" style={{ height: "100%", width: `${(m.flowEfficiency * 100).toFixed(1)}%`, background: "#1f6f8b" }} />
            </div>
          </Total>
          <Total label="Total % complete and accurate" value={`${Math.round(m.rolledCA * 100)}%`} />
          {better !== null ? <div className="notice ok" style={{ marginTop: 12 }}>Lead time {better}% shorter than today ({fmt(other.leadTime)}).</div> : null}
          {m.bottleneck ? (
            <div className="notice" style={{ marginTop: 12, background: "var(--signal-soft)" }}>
              <span className="eyebrow">Attack first</span>
              <br />
              {fmt(m.bottleneck.wait)} waiting before "{m.bottleneck.name}": {Math.round(m.bottleneck.shareOfLead * 100)}% of the lead time.
            </div>
          ) : null}
        </aside>
      </div>

    </>
  );
}

function Total({ label, hint, value, children }: { label: string; hint?: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="stack" style={{ gap: 4, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <span>
        <b>{label}</b>
        {hint ? <span className="faint"> ({hint})</span> : null}
      </span>
      <span className="vsm-big">{value}</span>
      {children}
    </div>
  );
}

function Clock({ neck }: { neck: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" fill="var(--glass-strong)" />
      <path d="M16 9v7l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="25" r="6" fill={neck ? "#d99400" : "#c2412d"} />
      <path d="M26 22v3.5M26 27.6v.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ---- calculating the current state from status history ----------------------------------------

interface Mapping {
  name: string;
  wait: string[];
  active: string[];
}
interface Derived {
  mapping: Mapping[];
  statuses: string[];
  items: number;
  derived: {
    steps: { name: string; measure: { wait: number | null; active: number; ca: number }; sample: { items: number; reworked: number; passed: number } }[];
    items: number;
    unmapped: { status: string; count: number }[];
    period: { from: string | null; to: string | null };
  };
  map?: Vsm;
}

const SOURCES = [
  ["csv", "CSV of status changes", "Any Kanban tool's transition export: one row per move, with item, status and timestamp columns."],
  ["jira", "Jira", "Issue changelogs through the connected Jira site. Narrow it with JQL."],
  ["ado", "Azure DevOps", "Work item revisions through the connected organization. Narrow it with WIQL."],
] as const;

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function DerivePanel({ vsm, dirty, onDerived }: { vsm: Vsm; dirty: boolean; onDerived: (m: Vsm) => void }) {
  const [source, setSource] = useState<"csv" | "jira" | "ado">("csv");
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(300);
  const [stat, setStat] = useState<"median" | "mean" | "p85">("median");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [replace, setReplace] = useState(false);
  const [mapping, setMapping] = useState<Mapping[] | null>(null);
  const [result, setResult] = useState<Derived | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // The status inputs are uncommitted until blur; remount them whenever the mapping is replaced.
  const [ver, setVer] = useState(0);

  const run = async (apply: boolean, withMapping: Mapping[] | null = mapping) => {
    setErr(null);
    setBusy(true);
    try {
      const body = {
        source,
        ...(source === "csv" && csv ? { csv: csv.text } : {}),
        ...(source !== "csv" && query.trim() ? { query: query.trim() } : {}),
        ...(source !== "csv" ? { limit } : {}),
        ...(withMapping ? { mapping: withMapping.filter((m) => m.name.trim() && (m.wait.length || m.active.length)) } : {}),
        stat,
        ...(since ? { since } : {}),
        ...(until ? { until } : {}),
        apply,
        ...(apply && replace ? { replace: true } : {}),
      };
      const r = await api<Derived>("POST", `/v1/value-streams/maps/${encodeURIComponent(vsm.id)}/derive`, body);
      setResult(r);
      setMapping(r.mapping);
      setVer((v) => v + 1);
      if (apply && r.map) onDerived(r.map);
    } catch (e) {
      setErr((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };

  const setStep = (i: number, patch: Partial<Mapping>) => setMapping((ms) => (ms ?? []).map((m, k) => (k === i ? { ...m, ...patch } : m)));
  const claimed = new Set((mapping ?? []).flatMap((m) => [...m.wait, ...m.active].map((s) => s.trim().toLowerCase())));
  const unit = vsm.unit === "hours" ? "hrs." : "days";
  const canRun = source !== "csv" || !!csv;

  return (
    <section className="panel panel-body stack" style={{ gap: 14 }} aria-label="Calculate the current state from data">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Calculate the current state from data</span>
        <span className="faint" style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
          Every tracker records when work entered each status. Say which statuses mean waiting for a step and which mean working on it, and each step&apos;s wait time,
          active time and %C&amp;A follow: time in status per item, then the {stat === "p85" ? "85th percentile" : stat}; %C&amp;A from how often work came back to a step after leaving it.
        </span>
      </div>

      <div className="row" role="radiogroup" aria-label="Where the history comes from" style={{ gap: 8 }}>
        {SOURCES.map(([id, label, hint]) => (
          <button key={id} role="radio" aria-checked={source === id} className={`btn${source === id ? " primary" : ""}`} title={hint} onClick={() => { setSource(id); setResult(null); setMapping(null); }}>
            {label}
          </button>
        ))}
      </div>
      <span className="faint" style={{ fontSize: "0.84rem" }}>{SOURCES.find((s) => s[0] === source)![2]}</span>

      <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
        {source === "csv" ? (
          <label className="stack" style={{ gap: 4, flex: "1 1 280px" }}>
            <span className="eyebrow">CSV file</span>
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setCsv({ name: f.name, text: await f.text() });
                setResult(null);
                setMapping(null);
              }}
            />
          </label>
        ) : (
          <>
            <label className="stack" style={{ gap: 4, flex: "1 1 320px" }}>
              <span className="eyebrow">{source === "jira" ? "JQL" : "WIQL WHERE clause"} (optional)</span>
              <input className="input" value={query} placeholder={source === "jira" ? "project = LOAN AND resolved >= -90d" : "[System.TeamProject] = 'Loans' AND [System.State] = 'Closed'"} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className="stack" style={{ gap: 4, width: 110 }}>
              <span className="eyebrow">Items</span>
              <input className="input" type="number" min={1} max={2000} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))} />
            </label>
          </>
        )}
        <label className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Statistic</span>
          <select className="select" value={stat} onChange={(e) => setStat(e.target.value as typeof stat)}>
            <option value="median">Median</option>
            <option value="mean">Mean</option>
            <option value="p85">85th percentile</option>
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">From</span>
          <input className="input" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">To</span>
          <input className="input" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </label>
        <button className="btn primary" disabled={!canRun || busy} onClick={() => void run(false)}>
          {busy ? "Reading…" : result ? "Recalculate" : "Read the history"}
        </button>
      </div>

      {err ? <ErrorList title="Could not calculate" items={[{ message: err }]} /> : null}

      {result && mapping ? (
        <>
          <div className="row" style={{ gap: 10 }}>
            <span className="chip">{result.derived.items} of {result.items} items counted</span>
            <span className="chip">{result.statuses.length} statuses</span>
            {result.derived.period.from ? (
              <span className="chip">
                {result.derived.period.from.slice(0, 10)} to {result.derived.period.to?.slice(0, 10)}
              </span>
            ) : null}
          </div>

          <div className="scroll-x">
            <table className="table" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Waiting statuses</th>
                  <th>Working statuses</th>
                  <th style={{ textAlign: "right" }}>Wait</th>
                  <th style={{ textAlign: "right" }}>Active</th>
                  <th style={{ textAlign: "right" }}>%C&amp;A</th>
                  <th style={{ textAlign: "right" }}>Items</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {mapping.map((m, i) => {
                  const d = result.derived.steps.find((s) => s.name === m.name);
                  return (
                    <tr key={`${ver}-${i}`}>
                      <td><input className="input" aria-label="Step name" value={m.name} onChange={(e) => setStep(i, { name: e.target.value })} /></td>
                      <td><input className="input" aria-label={`Waiting statuses for ${m.name}`} defaultValue={m.wait.join(", ")} onBlur={(e) => setStep(i, { wait: list(e.target.value) })} /></td>
                      <td><input className="input" aria-label={`Working statuses for ${m.name}`} defaultValue={m.active.join(", ")} onBlur={(e) => setStep(i, { active: list(e.target.value) })} /></td>
                      <td style={{ textAlign: "right" }}>{d ? (d.measure.wait === null ? "n/a" : `${d.measure.wait} ${unit}`) : "…"}</td>
                      <td style={{ textAlign: "right" }}>{d ? `${d.measure.active} ${unit}` : "…"}</td>
                      <td style={{ textAlign: "right" }} title={d ? `${d.sample.reworked} of ${d.sample.passed} came back` : undefined}>{d ? `${d.measure.ca}%` : "…"}</td>
                      <td style={{ textAlign: "right" }}>{d?.sample.items ?? "…"}</td>
                      <td>
                        <button className="btn small ghost" aria-label={`Remove ${m.name}`} onClick={() => { setMapping(mapping.filter((_, k) => k !== i)); setVer((v) => v + 1); }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {result.statuses.some((s) => !claimed.has(s.trim().toLowerCase())) ? (
            <div className="row" style={{ gap: 6 }}>
              <span className="eyebrow">Not mapped</span>
              {result.statuses
                .filter((s) => !claimed.has(s.trim().toLowerCase()))
                .map((s) => (
                  <button key={s} className="chip" title="Add as a new step" onClick={() => setMapping([...mapping, { name: s, wait: [], active: [s] }])}>
                    + {s}
                  </button>
                ))}
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn small" onClick={() => setMapping([...mapping, { name: "New step", wait: [], active: [] }])}>
              Add a step
            </button>
            <div className="row">
              <label className="row" style={{ gap: 6, fontSize: "0.86rem" }}>
                <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                Replace the map&apos;s steps
              </label>
              <button className="btn" disabled={busy} onClick={() => void run(false)}>
                Recalculate with this mapping
              </button>
              <button className="btn primary" disabled={busy || dirty} title={dirty ? "Save or discard your edits first" : undefined} onClick={() => void run(true)}>
                Use as the current state
              </button>
            </div>
          </div>
          <span className="faint" style={{ fontSize: "0.82rem" }}>
            Steps matching an existing step by name take the calculated current state; new steps are added, with the future state starting equal to the current one. Steps not in the mapping keep their numbers, unless you replace the map&apos;s steps.
          </span>
        </>
      ) : null}
    </section>
  );
}
