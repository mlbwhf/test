"use client";

import { useEffect, useState, useTransition } from "react";
import type { OrganizationSale } from "@/lib/api";
import { endSaleAction, saveSaleAction } from "@/app/(organizer)/money/sale-actions";

type Step = { last: string; pct: string };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** The step's end: the start of the day after its last day, in the organizer's own time zone. */
const endOf = (day: string) => {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};
/** Last day of a step from its stored end (the moment the next day starts). */
const lastDayOf = (iso: string) => ymd(new Date(Date.parse(iso) - 1));

/** Black Friday is the day after the fourth Thursday of November; Cyber Monday three days later. */
function blackFriday(year: number): { friday: Date; monday: Date } {
  const first = new Date(year, 10, 1);
  const thursday = 1 + ((4 - first.getDay() + 7) % 7) + 21;
  const friday = new Date(year, 10, thursday + 1);
  return { friday, monday: new Date(year, 10, thursday + 4) };
}

const fmtDay = (iso: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(Date.parse(iso) - 1));

/** Money › Settings: a sale on all your classes, in steps (e.g. 15% until Black Friday, then 10% until Cyber Monday). */
export function SaleCard({ sale, canEdit }: { sale: OrganizationSale | null; canEdit: boolean }) {
  const [label, setLabel] = useState(sale?.label ?? "");
  const [steps, setSteps] = useState<Step[]>([{ last: "", pct: "" }]);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  // Days and times are the organizer's own (browser) time zone, so they are filled in after the page loads.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (sale) setSteps(sale.steps.map((x) => ({ last: lastDayOf(x.until), pct: String(x.percentOff) })));
  }, [sale]);
  if (now === null)
    return (
      <section className="card sale-card" aria-labelledby="sale-title" id="sale">
        <h2 id="sale-title">Sale</h2>
      </section>
    );
  const running = sale && Date.parse(sale.startsAt) <= now ? sale.steps.find((x) => now < Date.parse(x.until)) : undefined;
  const ended = sale && !running && sale.steps.every((x) => Date.parse(x.until) <= now);

  const preset = () => {
    const year = new Date().getFullYear();
    let { friday, monday } = blackFriday(year);
    if (monday.getTime() < now) ({ friday, monday } = blackFriday(year + 1));
    setLabel("Black Friday");
    setSteps([
      { last: ymd(friday), pct: "15" },
      { last: ymd(monday), pct: "10" },
    ]);
    setResult(null);
  };

  const save = () => {
    setResult(null);
    const clean = steps.filter((x) => x.last && x.pct);
    if (!label.trim()) return setResult({ ok: false, message: "Give the sale a name, e.g. Black Friday." });
    if (!clean.length) return setResult({ ok: false, message: "Add at least one step: a last day and a percentage." });
    const payload = { label: label.trim(), ...(sale && Date.parse(sale.startsAt) <= now ? { startsAt: sale.startsAt } : {}), steps: clean.map((x) => ({ until: endOf(x.last), percentOff: Number(x.pct) })) };
    start(async () => setResult(await saveSaleAction(payload)));
  };
  const end = () => {
    setResult(null);
    start(async () => {
      const r = await endSaleAction();
      setResult(r);
      if (r.ok) {
        setLabel("");
        setSteps([{ last: "", pct: "" }]);
      }
    });
  };

  return (
    <section className="card sale-card" aria-labelledby="sale-title" id="sale">
      <h2 id="sale-title">Sale</h2>
      <p className="hint">
        A percentage off every class, applied automatically to your class pages, checkout and Find a class; learners see the regular price struck through. While it runs,
        the enrollclass.com homepage shows a banner for it. Whole-dollar prices stay whole.
      </p>
      {sale && (
        <p className={`result ${running ? "result-ok" : ""}`} role="status">
          {running
            ? `Running now: ${sale.label}, ${running.percentOff}% off until the end of ${fmtDay(running.until)}${sale.steps.length > 1 ? `; ends ${fmtDay(sale.steps[sale.steps.length - 1]!.until)}` : ""}.`
            : ended
              ? `${sale.label} has ended; regular prices apply.`
              : `${sale.label} is scheduled.`}
        </p>
      )}
      <label className="pd-field">
        Name learners see
        <input type="text" maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Black Friday" disabled={!canEdit} />
      </label>
      <div className="sale-steps">
        {steps.map((x, i) => (
          <div key={i} className="sale-step">
            <label className="pd-field">
              {i === 0 ? "Until the end of" : "Then, until the end of"}
              <input type="date" value={x.last} onChange={(e) => setSteps((l) => l.map((y, j) => (j === i ? { ...y, last: e.target.value } : y)))} disabled={!canEdit} />
            </label>
            <label className="pd-field">
              Percent off
              <input type="number" min={1} max={50} step={1} value={x.pct} onChange={(e) => setSteps((l) => l.map((y, j) => (j === i ? { ...y, pct: e.target.value } : y)))} placeholder="15" disabled={!canEdit} />
            </label>
            {canEdit && steps.length > 1 && (
              <button type="button" className="btn" aria-label={`Remove step ${i + 1}`} onClick={() => setSteps((l) => l.filter((_, j) => j !== i))}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="pd-row">
          {steps.length < 4 && (
            <button type="button" className="btn" onClick={() => setSteps((l) => [...l, { last: "", pct: "" }])}>
              + Add a step
            </button>
          )}
          <button type="button" className="btn" onClick={preset}>
            Black Friday preset
          </button>
          <span style={{ flex: 1 }} />
          {sale && !ended && (
            <button type="button" className="btn" onClick={end} disabled={pending}>
              End sale now
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : sale ? "Save sale" : "Start sale"}
          </button>
        </div>
      )}
      {result && (
        <p className={`result result-${result.ok ? "ok" : "error"}`} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </section>
  );
}
