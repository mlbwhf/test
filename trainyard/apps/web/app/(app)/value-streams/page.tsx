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
  const cols = vsi.steps.length + 2;
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

  return (
    <>
      <section className="panel panel-body stack">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 4, maxWidth: 760 }}>
            <span className="eyebrow">Value stream identification · {vsi.name}</span>
            <p className="muted" style={{ margin: 0 }}>{STAGES[stage - 1]![1]}</p>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
              {editing ? "Close editor" : "Edit the workshop"}
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
                  {vsi.trigger}
                </div>
              </div>
              {vsi.steps.map((s) => (
                <div key={s.id} style={{ minWidth: 0 }}>
                  <div className="vs-actor" aria-hidden="true">
                    {s.actor === "customer" ? <Person /> : <Group />}
                  </div>
                  <button className="vs-chev" aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                    {s.name}
                  </button>
                </div>
              ))}
              <div>
                <div className="vs-actor" />
                <div className="vs-cap">
                  <Doc />
                  {vsi.value}
                </div>
              </div>
            </div>

            {stage >= 2 ? (
              <>
                <div className="vs-lane-label">2 · Supporting systems</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {vsi.systems.map((s, i) => {
                    const g = spanOf(s.stepIds);
                    return g ? (
                      <div key={s.id} className={`vs-bar vs-sys ${dim([s.id])}`} style={{ gridColumn: g, animationDelay: `${i * 80}ms` }}>
                        <b>{s.name}</b>
                        {s.note ? (
                          <>
                            <br />
                            <span className="muted">{s.note}</span>
                          </>
                        ) : null}
                      </div>
                    ) : null;
                  })}
                </div>
              </>
            ) : null}

            {stage >= 3 ? (
              <>
                <div className="vs-lane-label">3 · People and locations</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoFlow: "row dense" }}>
                  {vsi.groups.map((g, i) => {
                    const span = spanOf(sysSteps(g.systemIds));
                    return span ? (
                      <div key={g.id} className={`vs-bar vs-people ${dim(g.systemIds)}`} style={{ gridColumn: span, animationDelay: `${i * 80}ms` }}>
                        <span>
                          <b>{g.people} people</b> · {g.locations}
                        </span>
                        <span className="mono" style={{ fontSize: "0.72rem" }}>
                          {vsi.systems.filter((s) => g.systemIds.includes(s.id)).map((s) => s.name.replace(/ system$/i, "")).join(" · ")}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </>
            ) : null}

            {stage >= 4 ? (
              <>
                <div className="vs-lane-label">4 · Development value streams</div>
                <div className="vs-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {vsi.devStreams.map((d, i) => {
                    const span = spanOf(sysSteps(d.systemIds));
                    const people = vsi.groups.filter((g) => g.systemIds.some((x) => d.systemIds.includes(x))).reduce((n, g) => n + g.people, 0);
                    return span ? (
                      <div key={d.id} className={`vs-bar vs-dvs ${dim(d.systemIds)}`} style={{ gridColumn: span, animationDelay: `${i * 100}ms` }}>
                        <b>{d.name}</b> · {people} people
                        <span className="vs-mini" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    ) : null;
                  })}
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
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <b style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{a.name}</b>
                      <span className="mono">{a.people} people</span>
                    </div>
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

      {editing ? <IdentifyEditor vsi={vsi} onChange={onChange} /> : null}
    </>
  );
}

function IdentifyEditor({ vsi, onChange }: { vsi: Vsi; onChange: (v: Vsi) => void }) {
  const set = (patch: Partial<Vsi>) => onChange({ ...vsi, ...patch });
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const move = <T,>(xs: T[], i: number, d: number): T[] => {
    const j = i + d;
    if (j < 0 || j >= xs.length) return xs;
    const out = [...xs];
    [out[i], out[j]] = [out[j]!, out[i]!];
    return out;
  };
  return (
    <section className="panel panel-body stack" aria-label="Edit the workshop">
      <h2>Edit the workshop</h2>
      <div className="row">
        <label className="field" style={{ flex: "1 1 200px" }}>
          Name
          <input className="input" value={vsi.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="field" style={{ flex: "1 1 200px" }}>
          Trigger
          <input className="input" value={vsi.trigger} onChange={(e) => set({ trigger: e.target.value })} />
        </label>
        <label className="field" style={{ flex: "1 1 200px" }}>
          Value delivered
          <input className="input" value={vsi.value} onChange={(e) => set({ value: e.target.value })} />
        </label>
      </div>

      <h3>Operational steps</h3>
      {vsi.steps.map((s, i) => (
        <div key={s.id} className="row">
          <input className="input" aria-label="Step name" style={{ flex: "1 1 240px" }} value={s.name} onChange={(e) => set({ steps: vsi.steps.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} />
          <select className="select" aria-label="Who does it" value={s.actor} onChange={(e) => set({ steps: vsi.steps.map((x) => (x.id === s.id ? { ...x, actor: e.target.value as "customer" | "staff" } : x)) })}>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
          </select>
          <button className="btn small ghost" onClick={() => set({ steps: move(vsi.steps, i, -1) })} aria-label={`Move ${s.name} earlier`}>
            ↑
          </button>
          <button className="btn small ghost" onClick={() => set({ steps: move(vsi.steps, i, 1) })} aria-label={`Move ${s.name} later`}>
            ↓
          </button>
          <button className="btn small ghost" onClick={() => set({ steps: vsi.steps.filter((x) => x.id !== s.id), systems: vsi.systems.map((y) => ({ ...y, stepIds: y.stepIds.filter((z) => z !== s.id) })) })}>
            Remove
          </button>
        </div>
      ))}
      <div>
        <button className="btn small" onClick={() => set({ steps: [...vsi.steps, { id: uid("step"), name: "New step", actor: "staff" }] })}>
          Add a step
        </button>
      </div>

      <h3>Supporting systems</h3>
      {vsi.systems.map((s) => (
        <div key={s.id} className="stack card" style={{ padding: 12, gap: 8 }}>
          <div className="row">
            <input className="input" aria-label="System name" style={{ flex: "1 1 200px" }} value={s.name} onChange={(e) => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} />
            <input className="input" aria-label="Note" placeholder="What it does" style={{ flex: "1 1 200px" }} value={s.note ?? ""} onChange={(e) => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, note: e.target.value } : x)) })} />
            <button className="btn small ghost" onClick={() => set({ systems: vsi.systems.filter((x) => x.id !== s.id), groups: vsi.groups.map((g) => ({ ...g, systemIds: g.systemIds.filter((z) => z !== s.id) })), devStreams: vsi.devStreams.map((d) => ({ ...d, systemIds: d.systemIds.filter((z) => z !== s.id) })), arts: vsi.arts.map((a) => ({ ...a, systemIds: a.systemIds.filter((z) => z !== s.id) })) })}>
              Remove
            </button>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <span className="faint" style={{ fontSize: "0.8rem" }}>
              Supports:
            </span>
            {vsi.steps.map((st) => (
              <label key={st.id} className="chip" style={{ textTransform: "none", letterSpacing: 0, cursor: "pointer" }}>
                <input type="checkbox" checked={s.stepIds.includes(st.id)} onChange={() => set({ systems: vsi.systems.map((x) => (x.id === s.id ? { ...x, stepIds: toggle(x.stepIds, st.id) } : x)) })} /> {st.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div>
        <button className="btn small" onClick={() => set({ systems: [...vsi.systems, { id: uid("sys"), name: "New system", stepIds: [] }] })}>
          Add a system
        </button>
      </div>

      <h3>People and locations</h3>
      {vsi.groups.map((g) => (
        <div key={g.id} className="stack card" style={{ padding: 12, gap: 8 }}>
          <div className="row">
            <input className="input" type="number" min={0} aria-label="People" style={{ width: 110 }} value={g.people} onChange={(e) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, people: Math.max(0, Math.round(Number(e.target.value) || 0)) } : x)) })} />
            <input className="input" aria-label="Locations" style={{ flex: "1 1 220px" }} value={g.locations} onChange={(e) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, locations: e.target.value } : x)) })} />
            <button className="btn small ghost" onClick={() => set({ groups: vsi.groups.filter((x) => x.id !== g.id) })}>
              Remove
            </button>
          </div>
          <SystemPicks vsi={vsi} selected={g.systemIds} onToggle={(id) => set({ groups: vsi.groups.map((x) => (x.id === g.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) })} label="Builds:" />
        </div>
      ))}
      <div>
        <button className="btn small" onClick={() => set({ groups: [...vsi.groups, { id: uid("grp"), people: 10, locations: "Location", systemIds: [] }] })}>
          Add people
        </button>
      </div>

      <h3>Development value streams</h3>
      {vsi.devStreams.map((d) => (
        <div key={d.id} className="stack card" style={{ padding: 12, gap: 8 }}>
          <div className="row">
            <input className="input" aria-label="Development value stream name" style={{ flex: "1 1 260px" }} value={d.name} onChange={(e) => set({ devStreams: vsi.devStreams.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)) })} />
            <button className="btn small ghost" onClick={() => set({ devStreams: vsi.devStreams.filter((x) => x.id !== d.id), arts: vsi.arts.map((a) => (a.devStreamId === d.id ? strip(a, ["devStreamId"]) : a)) })}>
              Remove
            </button>
          </div>
          <SystemPicks vsi={vsi} selected={d.systemIds} onToggle={(id) => set({ devStreams: vsi.devStreams.map((x) => (x.id === d.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) })} label="Systems:" />
        </div>
      ))}
      <div>
        <button className="btn small" onClick={() => set({ devStreams: [...vsi.devStreams, { id: uid("dvs"), name: "New development value stream", systemIds: [] }] })}>
          Add a development value stream
        </button>
      </div>

      <h3>Agile Release Trains</h3>
      {vsi.arts.map((a) => (
        <div key={a.id} className="stack card" style={{ padding: 12, gap: 8 }}>
          <div className="row">
            <input className="input" aria-label="Train name" style={{ flex: "1 1 200px" }} value={a.name} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)) })} />
            <input className="input" type="number" min={0} aria-label="People" style={{ width: 110 }} value={a.people} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, people: Math.max(0, Math.round(Number(e.target.value) || 0)) } : x)) })} />
            <input className="input" aria-label="Locations" style={{ flex: "1 1 200px" }} value={a.locations} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, locations: e.target.value } : x)) })} />
            <select className="select" aria-label="Development value stream" value={a.devStreamId ?? ""} onChange={(e) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? (e.target.value ? { ...x, devStreamId: e.target.value } : strip(x, ["devStreamId"])) : x)) })}>
              <option value="">No development value stream</option>
              {vsi.devStreams.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button className="btn small ghost" onClick={() => set({ arts: vsi.arts.filter((x) => x.id !== a.id) })}>
              Remove
            </button>
          </div>
          <SystemPicks vsi={vsi} selected={a.systemIds} onToggle={(id) => set({ arts: vsi.arts.map((x) => (x.id === a.id ? { ...x, systemIds: toggle(x.systemIds, id) } : x)) })} label="Owns:" />
        </div>
      ))}
      <div>
        <button className="btn small" onClick={() => set({ arts: [...vsi.arts, { id: uid("art"), name: "New train", people: 80, locations: "", systemIds: [] }] })}>
          Add a train
        </button>
      </div>
    </section>
  );
}

function SystemPicks({ vsi, selected, onToggle, label }: { vsi: Vsi; selected: string[]; onToggle: (id: string) => void; label: string }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      <span className="faint" style={{ fontSize: "0.8rem" }}>
        {label}
      </span>
      {vsi.systems.map((s) => (
        <label key={s.id} className="chip" style={{ textTransform: "none", letterSpacing: 0, cursor: "pointer" }}>
          <input type="checkbox" checked={selected.includes(s.id)} onChange={() => onToggle(s.id)} /> {s.name}
        </label>
      ))}
    </div>
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

function MapView({ vsm, dirty, onChange, onSave, onReset }: { vsm: Vsm; dirty: boolean; onChange: (m: Vsm) => void; onSave: () => void; onReset: () => void }) {
  const [state, setState] = useState<"current" | "future">("current");
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
          <button className="btn" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? "Close editor" : "Edit the map"}
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

      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <section className="panel panel-body stack" style={{ flex: "999 1 720px", minWidth: 0, gap: 16 }}>
          <div className="scroll-x">
            <div className="stack" style={{ minWidth: 760, gap: 20 }}>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: "grid", gridTemplateColumns: "84px minmax(0, 1fr) repeat(4, 66px minmax(0, 1fr))", columnGap: 4, rowGap: 2, alignItems: "center" }}>
                  <span />
                  {ri === 0 ? <div className="vsm-box start" style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{vsm.trigger}</div> : <span />}
                  {row.flatMap((s) => [
                    <span key={`${s.id}-c`} style={{ display: "flex", justifyContent: "center" }} aria-label={`${fmt(s[state].wait)} waiting before ${s.name}`}>
                      <Clock neck={m.bottleneck?.stepId === s.id} />
                    </span>,
                    <button key={s.id} className="vsm-box" aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                      {s.name}
                    </button>,
                  ])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-top-${k}`} />)}
                  <span className="vsm-cell vsm-act" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Active time
                  </span>
                  <span className="vsm-cell vsm-act" />
                  {row.flatMap((s) => [<span key={`${s.id}-a0`} className="vsm-cell vsm-act" />, <span key={`${s.id}-a`} className="vsm-cell vsm-act">{fmt(s[state].active)}</span>])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-a-${k}`} className="vsm-cell vsm-act" />)}
                  <span className="vsm-cell" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Wait time
                  </span>
                  <span />
                  {row.flatMap((s) => [<span key={`${s.id}-w`} className={`vsm-cell ${m.bottleneck?.stepId === s.id ? "vsm-neck" : ""}`}>{fmt(s[state].wait)}</span>, <span key={`${s.id}-w0`} />])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-w-${k}`} />)}
                  <span className="vsm-cell faint" style={{ textAlign: "left", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    %C&amp;A
                  </span>
                  <span />
                  {row.flatMap((s) => [<span key={`${s.id}-c0`} />, <span key={`${s.id}-ca`} className="vsm-cell faint">{s[state].ca}%</span>])}
                  {Array.from({ length: (4 - row.length) * 2 }, (_, k) => <span key={`pad-c-${k}`} />)}
                </div>
              ))}
            </div>
          </div>

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
              {selStep.kaizen ? (
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

      {editing ? <MapEditor vsm={vsm} onChange={onChange} /> : null}
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

function MapEditor({ vsm, onChange }: { vsm: Vsm; onChange: (m: Vsm) => void }) {
  const set = (patch: Partial<Vsm>) => onChange({ ...vsm, ...patch });
  const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v) || 0));
  const upd = (id: string, which: "current" | "future", key: "wait" | "active" | "ca", v: string) =>
    set({
      steps: vsm.steps.map((s) => {
        if (s.id !== id) return s;
        const n = key === "wait" ? num(v) : Math.max(0, Math.min(key === "ca" ? 100 : 1e6, Number(v) || 0));
        return { ...s, [which]: { ...s[which], [key]: n } };
      }),
    });
  return (
    <section className="panel panel-body stack" aria-label="Edit the map">
      <h2>Edit the map</h2>
      <div className="row">
        <label className="field" style={{ flex: "1 1 260px" }}>
          Name
          <input className="input" value={vsm.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="field" style={{ flex: "1 1 200px" }}>
          Trigger
          <input className="input" value={vsm.trigger} onChange={(e) => set({ trigger: e.target.value })} />
        </label>
        <label className="field">
          Unit
          <select className="select" value={vsm.unit} onChange={(e) => set({ unit: e.target.value as "hours" | "days" })}>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </label>
      </div>
      <div className="scroll-x">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980, fontSize: "0.86rem" }}>
          <thead>
            <tr className="faint" style={{ textAlign: "left" }}>
              <th style={{ padding: 6 }}>Step</th>
              <th style={{ padding: 6 }}>Wait now</th>
              <th style={{ padding: 6 }}>Active now</th>
              <th style={{ padding: 6 }}>%C&amp;A now</th>
              <th style={{ padding: 6 }}>Wait future</th>
              <th style={{ padding: 6 }}>Active future</th>
              <th style={{ padding: 6 }}>%C&amp;A future</th>
              <th style={{ padding: 6 }}>Improvement</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {vsm.steps.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: 4 }}>
                  <input className="input" aria-label="Step name" value={s.name} onChange={(e) => set({ steps: vsm.steps.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} />
                </td>
                {(["current", "future"] as const).flatMap((w) =>
                  (["wait", "active", "ca"] as const).map((k) => (
                    <td key={`${w}-${k}`} style={{ padding: 4 }}>
                      <input className="input mono" inputMode="decimal" aria-label={`${s.name} ${k} ${w}`} style={{ width: 80 }} value={s[w][k] === null ? "" : String(s[w][k])} placeholder={k === "wait" ? "variable" : ""} onChange={(e) => upd(s.id, w, k, e.target.value)} />
                    </td>
                  )),
                )}
                <td style={{ padding: 4 }}>
                  <input className="input" aria-label={`${s.name} improvement`} value={s.kaizen ?? ""} onChange={(e) => set({ steps: vsm.steps.map((x) => (x.id === s.id ? { ...x, kaizen: e.target.value } : x)) })} />
                </td>
                <td style={{ padding: 4 }}>
                  <button className="btn small ghost" onClick={() => set({ steps: vsm.steps.filter((x) => x.id !== s.id) })}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn small" onClick={() => set({ steps: [...vsm.steps, { id: uid("step"), name: "New step", current: { wait: 0, active: 1, ca: 100 }, future: { wait: 0, active: 1, ca: 100 } }] })}>
          Add a step
        </button>
      </div>
    </section>
  );
}
