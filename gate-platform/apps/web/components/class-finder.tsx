"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogCategory, CatalogItem } from "@/lib/catalog-types";
import { COMMON_ZONES, detectedZone, zoneName } from "@/lib/class-time";
import {
  blurbOf, classUrl, dayTimes, formatLabel, fromPrice, groupCertifications, isInPerson, isLow, isOnline, langName, languagesOf, lengthOf, majorUnits, money, monthLabel, monthOf,
  nextOpen, registerUrl, seatsShort, shortRange, whereOf, type Cert, type Cohort,
} from "@/lib/finder";

export type FinderState = {
  q: string;
  quick: string;
  cat: string;
  month: string;
  format: "any" | "online" | "in_person";
  lang: string;
  provs: string[];
  sort: "soonest" | "seats" | "price";
  sel: string | null;
  cmp: string[];
};

export const EMPTY_FILTERS = { quick: "", cat: "", month: "", format: "any", lang: "", provs: [] as string[] } satisfies Partial<FinderState>;
const MAX_COMPARE = 3;

function queryOf(s: FinderState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.quick) p.set("quick", s.quick);
  if (s.cat) p.set("category", s.cat);
  if (s.month) p.set("month", s.month);
  if (s.format !== "any") p.set("format", s.format);
  if (s.lang) p.set("lang", s.lang);
  if (s.provs.length) p.set("provider", s.provs.join(","));
  if (s.sort !== "soonest") p.set("sort", s.sort);
  if (s.sel) p.set("class", s.sel);
  if (s.cmp.length) p.set("compare", s.cmp.join(","));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** Badge ring: the badge artwork when the organizer uploaded one, else its short code. */
function Ring({ cert, size, on }: { cert: Cert; size: number; on?: boolean }) {
  return (
    <span className={`cf-ring${on ? " is-on" : ""}${cert.badgeImage ? " has-img" : ""}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.22) }} aria-hidden="true">
      {cert.badgeImage ? <img src={cert.badgeImage} alt="" loading="lazy" /> : cert.code}
    </span>
  );
}

type Quick = { id: string; label: string; cohort?: (c: Cohort) => boolean; cert?: (c: Cert, matching: Cohort[]) => boolean };

export function ClassFinder({ items, categories, initial, appUrl }: { items: CatalogItem[]; categories: CatalogCategory[]; initial: FinderState; appUrl: string }) {
  const [s, setS] = useState<FinderState>(initial);
  const [tz, setTz] = useState<string | null>(null);
  const [pickZone, setPickZone] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const set = useCallback((patch: Partial<FinderState>) => setS((prev) => ({ ...prev, ...patch })), []);

  useEffect(() => setTz(detectedZone()), []);
  // Filters, sort, the previewed class and the compare list live in the URL so a search can be shared.
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${queryOf(s)}`);
  }, [s]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const certs = useMemo(() => groupCertifications(items), [items]);
  const byId = useMemo(() => new Map(certs.map((c) => [c.id, c])), [certs]);
  const catLabel = useCallback((id: string) => categories.find((c) => c.id === id)?.label ?? "Other", [categories]);
  const allCohorts = useMemo(() => certs.flatMap((c) => c.cohorts), [certs]);

  // Quick picks follow what is actually on offer.
  const quicks = useMemo<Quick[]>(() => {
    const out: Quick[] = [];
    if (allCohorts.some(isLow)) out.push({ id: "soon", label: "Filling fast", cohort: isLow });
    if (allCohorts.some(isOnline)) out.push({ id: "online", label: "Live online", cohort: isOnline });
    if (allCohorts.some((c) => c.format === "in_person")) out.push({ id: "in_person", label: "In person", cohort: isInPerson });
    const NATIVE: Record<string, string> = { FR: "En français", ES: "En español", DE: "Auf Deutsch", PT: "Em português" };
    for (const l of [...new Set(allCohorts.map((c) => c.lang))].filter((l) => l && l !== "EN")) out.push({ id: `lang-${l}`, label: NATIVE[l] ?? `In ${langName(l)}`, cohort: (c) => c.lang === l });
    const prices = certs.map((c) => fromPrice(c.cohorts)).filter((p): p is number => p !== null && p > 0);
    const ccy = new Set(certs.map((c) => c.currency));
    if (prices.length >= 3 && ccy.size === 1) {
      const cur = [...ccy][0]!;
      const sorted = prices.map((p) => majorUnits(p, cur)).sort((a, b) => a - b);
      const cap = Math.ceil(sorted[Math.floor(sorted.length / 2)]! / 500) * 500;
      const label = new Intl.NumberFormat("en-US", { style: "currency", currency: cur, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(cap);
      if (cap > sorted[0]!) out.push({ id: "under", label: `Under ${label}`, cert: (_c, m) => { const p = fromPrice(m); return p !== null && majorUnits(p, cur) <= cap; } });
    }
    return out;
  }, [allCohorts, certs]);
  const quick = quicks.find((q) => q.id === s.quick);

  const needle = s.q.trim().toLowerCase();
  type Skip = "cat" | "month" | "format" | "lang" | "provs";
  const matching = useCallback(
    (c: Cert, skip?: Skip): Cohort[] | null => {
      if (needle && !`${c.title} ${c.orgName} ${c.code} ${c.badgeName ?? ""} ${c.certificationBody ?? ""} ${catLabel(c.category)} ${c.courses.map((x) => x.name).join(" ")}`.toLowerCase().includes(needle)) return null;
      if (skip !== "cat" && s.cat && c.category !== s.cat) return null;
      if (skip !== "provs" && s.provs.length && !s.provs.includes(c.orgId)) return null;
      const m = c.cohorts.filter(
        (x) =>
          (skip === "month" || !s.month || monthOf(x) === s.month) &&
          (skip === "format" || s.format === "any" || (s.format === "online" ? isOnline(x) : isInPerson(x))) &&
          (skip === "lang" || !s.lang || x.lang === s.lang) &&
          (!quick?.cohort || quick.cohort(x)),
      );
      if (!m.length) return null;
      if (quick?.cert && !quick.cert(c, m)) return null;
      return m;
    },
    [needle, s.cat, s.provs, s.month, s.format, s.lang, quick, catLabel],
  );

  const list = useMemo(() => {
    const rows = certs.map((c) => ({ c, m: matching(c) })).filter((r): r is { c: Cert; m: Cohort[] } => r.m !== null);
    const minSeats = (m: Cohort[]) => Math.min(...m.map((x) => (x.capacity ? x.seatsLeft : Infinity)));
    rows.sort((a, b) =>
      s.sort === "price" ? (fromPrice(a.m) ?? Infinity) - (fromPrice(b.m) ?? Infinity) : s.sort === "seats" ? minSeats(a.m) - minSeats(b.m) : a.m[0]!.startsAt.localeCompare(b.m[0]!.startsAt),
    );
    if (s.sort !== "soonest") return rows;
    // Paid placements lead the default order (and their topic); they are labelled Sponsored.
    const lead = (r: { c: Cert }) => r.c.promoted === "top" || (r.c.promoted === "category" && s.cat !== "" && r.c.category === s.cat);
    return [...rows.filter(lead), ...rows.filter((r) => !lead(r))];
  }, [certs, matching, s.sort, s.cat]);

  const count = (skip: Skip, pred: (c: Cert, m: Cohort[]) => boolean) =>
    certs.reduce((n, c) => {
      const m = matching(c, skip);
      return m && pred(c, m) ? n + 1 : n;
    }, 0);
  const months = useMemo(() => [...new Set(allCohorts.map(monthOf))].sort().slice(0, 6), [allCohorts]);
  const langs = useMemo(() => [...new Set(allCohorts.map((c) => c.lang).filter(Boolean))].sort(), [allCohorts]);
  const providers = useMemo(() => {
    const m = new Map<string, { id: string; name: string; logo: string | null }>();
    for (const c of certs) m.set(c.orgId, { id: c.orgId, name: c.orgName, logo: c.logoUrl });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [certs]);
  const active = (s.cat ? 1 : 0) + (s.month ? 1 : 0) + (s.format !== "any" ? 1 : 0) + (s.lang ? 1 : 0) + s.provs.length + (s.quick ? 1 : 0);
  const reset = () => set({ ...EMPTY_FILTERS, q: "" });

  const selRow = (s.sel ? list.find((r) => r.c.id === s.sel) : undefined) ?? list[0];
  const sel = selRow?.c ?? null;
  const selCohorts = selRow?.m ?? [];
  const zone = tz ?? selCohorts[0]?.timezone ?? "UTC";

  const toggleCmp = (id: string) => {
    if (s.cmp.includes(id)) return set({ cmp: s.cmp.filter((x) => x !== id) });
    if (s.cmp.length >= MAX_COMPARE) return setToast(`Compare up to ${MAX_COMPARE} certifications. Remove one first.`);
    set({ cmp: [...s.cmp, id] });
  };
  const tray = s.cmp.map((id) => byId.get(id)).filter((c): c is Cert => Boolean(c));
  const compareHref = `/classes/compare?ids=${tray.map((c) => encodeURIComponent(c.id)).join(",")}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sheet) setSheet(false);
      else if (s.sel) set({ sel: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, s.sel, set]);

  const zones = useMemo(() => {
    const l = COMMON_ZONES.map((z) => ({ id: z.id, label: z.label }));
    const d = detectedZone();
    for (const extra of [tz, d]) if (extra && !l.some((z) => z.id === extra)) l.unshift({ id: extra, label: zoneName(extra) });
    return l;
  }, [tz]);

  const filters = (
    <>
      <div className="cf-group">
        <div className="cf-label">CATEGORY</div>
        {[{ id: "", label: "All" }, ...categories].map((c) => {
          const n = count("cat", (x) => !c.id || x.category === c.id);
          if (c.id && n === 0 && s.cat !== c.id) return null;
          return (
            <button key={c.id || "all"} type="button" className="cf-row" aria-pressed={s.cat === c.id} onClick={() => set({ cat: c.id })}>
              <span>{c.label}</span>
              <span className="cf-n">{n}</span>
            </button>
          );
        })}
      </div>
      {months.length > 1 && (
        <div className="cf-group">
          <div className="cf-label">STARTS</div>
          <div className="cf-months">
            {months.map((m) => (
              <button key={m} type="button" className="cf-pill" aria-pressed={s.month === m} onClick={() => set({ month: s.month === m ? "" : m })} title={m}>
                {monthLabel(m)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="cf-group">
        <div className="cf-label">FORMAT</div>
        {(
          [
            ["any", "Any format"],
            ["online", "Live online"],
            ["in_person", "In person"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className="cf-row" aria-pressed={s.format === id} onClick={() => set({ format: id })}>
            <span>{label}</span>
            {id !== "any" && <span className="cf-n">{count("format", (_c, m) => m.some(id === "online" ? isOnline : isInPerson))}</span>}
          </button>
        ))}
      </div>
      {langs.length > 1 && (
        <div className="cf-group">
          <div className="cf-label">LANGUAGE</div>
          <div className="cf-wrap">
            {["", ...langs].map((l) => (
              <button key={l || "all"} type="button" className="cf-pill" aria-pressed={s.lang === l} onClick={() => set({ lang: l })} title={l ? langName(l) : "All languages"}>
                {l || "All"}
              </button>
            ))}
          </div>
        </div>
      )}
      {providers.length > 0 && (
        <div className="cf-group">
          <div className="cf-label">PROVIDER</div>
          {providers.map((p) => {
            const on = s.provs.includes(p.id);
            return (
              <button key={p.id} type="button" className="cf-prov" aria-pressed={on} onClick={() => set({ provs: on ? s.provs.filter((x) => x !== p.id) : [...s.provs, p.id] })}>
                {p.logo ? <img src={p.logo} alt="" /> : <span className="cf-mono">{p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="cf">
      <section className="cf-hero">
        <div className="cf-in">
          <h1>Find a live class. Earn the badge.</h1>
          <div className="cf-searchrow">
            <label className="cf-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="cf-sr">Search</span>
              <input type="search" value={s.q} onChange={(e) => set({ q: e.target.value })} placeholder="Certification, skill or provider, e.g. RTE, SPC, AI-Native" />
            </label>
            <span className="cf-zone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {pickZone ? (
                <select
                  aria-label="Show times in"
                  value={zone}
                  autoFocus
                  onChange={(e) => {
                    setTz(e.target.value);
                    setPickZone(false);
                  }}
                  onBlur={() => setPickZone(false)}
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.label} time
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  Times in {tz ? zoneName(tz) : "each class's zone"} ·{" "}
                  <button type="button" onClick={() => setPickZone(true)}>
                    change
                  </button>
                </>
              )}
            </span>
          </div>
          {quicks.length > 0 && (
            <div className="cf-quick" role="group" aria-label="Quick picks">
              {quicks.map((q) => (
                <button key={q.id} type="button" aria-pressed={s.quick === q.id} onClick={() => set({ quick: s.quick === q.id ? "" : q.id })}>
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="cf-main">
        <aside className="cf-filters" aria-label="Filters">
          {filters}
        </aside>

        <section className="cf-results" aria-label="Results">
          <div className="cf-bar">
            <div aria-live="polite">
              <strong>{list.length}</strong>{" "}
              <span className="rx-muted">
                certification{list.length === 1 ? "" : "s"} · {list.reduce((n, r) => n + r.m.length, 0)} upcoming class{list.reduce((n, r) => n + r.m.length, 0) === 1 ? "" : "es"}
              </span>
            </div>
            <div className="cf-sort" role="group" aria-label="Sort">
              {(
                [
                  ["soonest", "Soonest"],
                  ["seats", "Seats left"],
                  ["price", "Price"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={s.sort === k} onClick={() => set({ sort: k })}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {list.map(({ c, m }) => {
            const on = sel?.id === c.id;
            const ls = languagesOf(c.cohorts);
            const open = nextOpen(m)!;
            const price = fromPrice(m);
            const compared = s.cmp.includes(c.id);
            return (
              <article key={c.id} className={`cf-card${on ? " is-sel" : ""}`}>
                <div className="cf-card-top">
                  <button type="button" className="cf-ring-btn" onClick={() => set({ sel: c.id })} aria-label={`Preview ${c.title}`}>
                    <Ring cert={c} size={76} on={on} />
                  </button>
                  <div className="cf-card-main">
                    <div className="cf-meta">
                      <strong>{c.orgName}</strong>
                      <span aria-hidden="true">·</span>
                      <span>{catLabel(c.category)}</span>
                      {m.some(isLow) && <span className="cf-hot">Filling fast</span>}
                      {c.promoted && <span className="cf-spons">Sponsored</span>}
                    </div>
                    <h2>
                      <button type="button" onClick={() => set({ sel: c.id })}>
                        {c.title}
                      </button>
                    </h2>
                    {blurbOf(c) && <p className="cf-blurb">{blurbOf(c)}</p>}
                    <div className="cf-tags">
                      <span>{lengthOf(c)}</span>
                      <span>{formatLabel(c.cohorts)}</span>
                      {ls.length > 0 && <span className="cf-tag-lang">{ls.map(langName).join(" · ")}</span>}
                      {c.badgeName && <span className="cf-tag-badge">Badge included</span>}
                    </div>
                  </div>
                  <div className="cf-price">
                    {price !== null && price > 0 && <span className="rx-muted">from</span>}
                    <strong>{money(price, c.currency)}</strong>
                  </div>
                </div>
                <div className="cf-next">
                  <span className="cf-label">NEXT CLASSES</span>
                  {m.slice(0, 3).map((x) => (
                    <a key={x.key} className="cf-date" href={classUrl(appUrl, c, x)}>
                      <strong>{shortRange(x)}</strong>
                      <span className={isLow(x) ? "is-low" : undefined}>
                        {whereOf(x)}
                        {x.lang ? ` · ${x.lang}` : ""} · {seatsShort(x)}
                      </span>
                    </a>
                  ))}
                  {m.length > 3 && (
                    <button type="button" className="cf-more" onClick={() => set({ sel: c.id })}>
                      +{m.length - 3} more
                    </button>
                  )}
                  <span className="cf-grow" />
                  <label className="cf-cmp">
                    <input type="checkbox" checked={compared} onChange={() => toggleCmp(c.id)} />
                    Compare
                  </label>
                  <a className="cf-reg" href={registerUrl(appUrl, c, open)}>
                    Register
                  </a>
                </div>
              </article>
            );
          })}

          {list.length === 0 && (
            <div className="cf-empty">
              <strong>{certs.length ? "No classes match these filters." : "No upcoming classes are listed right now."}</strong>
              <span className="rx-muted">{certs.length ? "Try another month, format or language: organizers add classes every week." : "Organizers add classes every week; check back soon."}</span>
              {certs.length > 0 && (
                <button type="button" onClick={reset}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {sel && (
          <aside className={`cf-preview${s.sel ? " is-open" : ""}`} aria-label="Quick preview">
            <div className="cf-pv">
              <div className="cf-pv-head">
                <Ring cert={sel} size={64} on />
                <div>
                  <div className="cf-pv-eyebrow">{sel.badgeName ? "YOU EARN" : sel.certificationBody ? "CERTIFICATION" : "CLASS BY"}</div>
                  <div className="cf-pv-badge">{sel.badgeName ?? sel.certificationBody ?? sel.orgName}</div>
                </div>
                <button type="button" className="cf-pv-close" onClick={() => set({ sel: null })} aria-label="Close preview">
                  ✕
                </button>
              </div>
              <div className="cf-pv-body">
                <h2>{sel.title}</h2>
                {(sel.tagline || sel.blurb) && <p className="cf-pv-blurb">{sel.tagline ?? (sel.blurb!.length > 220 ? `${sel.blurb!.slice(0, 220).trimEnd()}…` : sel.blurb)}</p>}
                <div className="cf-pv-classes">
                  {selCohorts.slice(0, 5).map((x) => {
                    const taken = x.capacity ? Math.round(((x.capacity - x.seatsLeft) / x.capacity) * 100) : 0;
                    return (
                      <a key={x.key} className="cf-pv-class" href={classUrl(appUrl, sel, x)}>
                        <span className="cf-pv-row">
                          <strong>{shortRange(x)}</strong>
                          <span>
                            {x.format === "live_virtual" ? "Live online" : whereOf(x)}
                            {x.lang ? ` · ${x.lang}` : ""}
                          </span>
                        </span>
                        {x.capacity > 0 && (
                          <span className="cf-bar-track" role="img" aria-label={`${x.seatsLeft} of ${x.capacity} seats left`}>
                            <span style={{ width: `${taken}%` }} />
                          </span>
                        )}
                        <span className="cf-pv-sub">
                          {x.capacity ? (x.seatsLeft ? `${x.seatsLeft} of ${x.capacity} seats left` : "Full: join the waitlist") : "Open enrollment"}
                          {x.format !== "self_paced" ? ` · ${x.format === "in_person" ? `${dayTimes(x, x.timezone)}, local time` : dayTimes(x, zone)}` : ""}
                        </span>
                      </a>
                    );
                  })}
                  {selCohorts.length > 5 && <span className="rx-muted cf-pv-sub">+{selCohorts.length - 5} more dates on the class page</span>}
                </div>
                <ul className="cf-pv-incl">
                  {(sel.included.length ? sel.included.slice(0, 4) : [sel.badgeName ? `Verified digital badge: ${sel.badgeName}` : null, "Ticket and calendar invitation by email"].filter((x): x is string => Boolean(x))).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                  {sel.heldUntilDelivery && <li>Payment held until the class runs</li>}
                </ul>
                {(() => {
                  const open = nextOpen(selCohorts);
                  const price = fromPrice(selCohorts);
                  return open ? (
                    <a className="cf-pv-reg" href={registerUrl(appUrl, sel, open)}>
                      {open.capacity && !open.seatsLeft ? "Join the waitlist" : `Register${price !== null ? ` — ${money(price, sel.currency)}` : ""}`}
                    </a>
                  ) : null;
                })()}
                <a className="cf-pv-link" href={selCohorts[0] ? classUrl(appUrl, sel, selCohorts[0]) : "#"}>
                  Full class page, agenda and video
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>

      {tray.length > 0 && (
        <div className="cf-tray" role="region" aria-label="Compare">
          <div className="cf-in">
            <strong>Compare</strong>
            {tray.map((c) => (
              <button key={c.id} type="button" className="cf-tray-chip" onClick={() => toggleCmp(c.id)} aria-label={`Remove ${c.title} from compare`}>
                {c.code} · {c.title.length > 28 ? `${c.title.slice(0, 26).trimEnd()}…` : c.title} <span aria-hidden="true">✕</span>
              </button>
            ))}
            <span className="cf-grow" />
            <span className="cf-tray-hint">{tray.length < 2 ? "Pick one more to compare" : `Up to ${MAX_COMPARE}`}</span>
            {tray.length >= 2 ? (
              <a className="cf-tray-go" href={compareHref}>
                Compare ({tray.length})
              </a>
            ) : (
              <span className="cf-tray-go" aria-disabled="true">
                Compare ({tray.length})
              </span>
            )}
          </div>
        </div>
      )}

      <div className="cf-float">
        <button type="button" className="cf-float-ink" onClick={() => setSheet(true)}>
          Filters{active ? ` · ${active}` : ""}
        </button>
        {tray.length >= 2 ? (
          <a className="cf-float-light" href={compareHref}>
            Compare ({tray.length})
          </a>
        ) : (
          <button type="button" className="cf-float-light" onClick={() => setToast(tray.length ? "Pick one more certification to compare." : "Tick Compare on two or three certifications.")}>
            Compare ({tray.length})
          </button>
        )}
      </div>

      {sheet && (
        <div className="cf-overlay" onClick={() => setSheet(false)}>
          <div className="cf-sheet" role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.stopPropagation()}>
            <div className="cf-sheet-head">
              <h2>Filters</h2>
              {active > 0 && (
                <button type="button" className="cf-link" onClick={reset}>
                  Clear all
                </button>
              )}
              <button type="button" className="cf-pv-close" onClick={() => setSheet(false)} aria-label="Close filters">
                ✕
              </button>
            </div>
            <div className="cf-sheet-body">{filters}</div>
            <button type="button" className="cf-sheet-go" onClick={() => setSheet(false)}>
              Show {list.length} certification{list.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="cf-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
