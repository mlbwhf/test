"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keyOf, type CatalogCategory, type CatalogItem } from "@/lib/catalog-types";

export type FinderState = {
  q: string;
  view: "cards" | "table";
  sort: "soonest" | "price";
  cats: string[];
  modes: string[];
  badges: string[];
  provs: string[];
  /** Upper price bound in major units; null = any. */
  max: number | null;
  sel: string | null;
};

const FORMAT_LABELS: Record<string, string> = { live_virtual: "Live virtual", in_person: "In person", hybrid: "Hybrid", self_paced: "Self-paced" };
const BADGE_LABELS: Record<string, string> = { accredited: "Accredited", selling_fast: "Selling fast", new: "New", early_bird: "Early bird" };
const BADGE_ORDER = ["accredited", "selling_fast", "new", "early_bird"];
const LOGO_TINTS = ["oklch(0.45 0.14 20)", "oklch(0.22 0.05 260)", "oklch(0.5 0.12 240)", "oklch(0.35 0.08 300)", "oklch(0.5 0.1 155)", "oklch(0.55 0.15 60)"];
const LOGO_SHAPES = ["12px", "50%", "12px 50% 12px 50%", "50% 50% 12px 12px"];
const MAX_COMPARE = 3;


function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Monogram tile until providers can upload a logo: initials, with tint and shape fixed per provider. */
function ProviderLogo({ c, size }: { c: CatalogItem; size: number }) {
  const words = c.organizationName.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  const mono = (words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 1)).toUpperCase();
  const h = hash(c.organizationId);
  if (c.logoUrl) {
    return (
      <span className="fc-logo fc-logo-img" style={{ width: size, height: size }}>
        <img src={c.logoUrl} alt={`${c.organizationName} logo`} loading="lazy" />
      </span>
    );
  }
  return (
    <span className="fc-logo" aria-hidden="true" style={{ width: size, height: size, borderRadius: LOGO_SHAPES[h % LOGO_SHAPES.length], background: LOGO_TINTS[h % LOGO_TINTS.length], fontSize: Math.round(size * 0.38) }}>
      {mono}
    </span>
  );
}

const PLATFORM_LABELS: Record<string, string> = { own: "Verified badge", credly: "Credly badge", accredible: "Accredible badge", badgr: "Badgr badge", certopus: "Certopus badge", other: "Digital badge" };

/** The digital badge learners earn: image when there is one, else a seat-green seal. */
function DigitalBadge({ c, size, label }: { c: CatalogItem; size: number; label?: boolean }) {
  const b = c.digitalBadge;
  if (!b) return null;
  return (
    <span className="fc-dbadge" title={`Earns: ${b.name}`}>
      {b.imageUrl ? <img src={b.imageUrl} alt="" width={size} height={size} loading="lazy" /> : <span className="fc-dbadge-seal" style={{ width: size, height: size }} aria-hidden="true">★</span>}
      {label && (
        <span className="fc-dbadge-text">
          <span>{PLATFORM_LABELS[b.platform] ?? "Digital badge"}</span>
          <strong>{b.name}</strong>
        </span>
      )}
    </span>
  );
}

function Badge({ c, big }: { c: CatalogItem; big?: boolean }) {
  if (!c.badge && !c.promoted) return null;
  return (
    <span className="fc-badges">
      {c.badge && <span className={`fc-badge fc-badge-${c.badge}${big ? " fc-badge-big" : ""}`}>{BADGE_LABELS[c.badge]}</span>}
      {c.promoted && <span className={`fc-badge fc-badge-sponsored${big ? " fc-badge-big" : ""}`}>Sponsored</span>}
    </span>
  );
}

function money(minor: number | null | undefined, currency: string | undefined): string {
  if (minor === null || minor === undefined || !currency) return "Sold out";
  if (minor === 0) return "Free";
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const major = minor / 10 ** digits;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: Number.isInteger(major) ? 0 : digits, minimumFractionDigits: Number.isInteger(major) ? 0 : digits }).format(major);
}

function major(c: CatalogItem): number | null {
  if (c.priceMinor === null || c.priceMinor === undefined || !c.currency) return null;
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: c.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return c.priceMinor / 10 ** digits;
}

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
const fullDay = (iso: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
const dateOf = (c: CatalogItem) => (c.format === "self_paced" ? "On demand" : day(c.nextStartsAt));
const formatOf = (c: CatalogItem) => FORMAT_LABELS[c.format ?? ""] ?? "Class";
const short = (t: string) => t.split(/\s+/).slice(0, 2).join(" ");

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function queryOf(s: FinderState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.cats.length) p.set("category", s.cats.join(","));
  if (s.modes.length) p.set("format", s.modes.join(","));
  if (s.badges.length) p.set("badge", s.badges.join(","));
  if (s.provs.length) p.set("provider", s.provs.join(","));
  if (s.max !== null) p.set("max", String(s.max));
  if (s.sort !== "soonest") p.set("sort", s.sort);
  if (s.view !== "cards") p.set("view", s.view);
  if (s.sel) p.set("class", s.sel);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export function ClassFinder({ items, categories, initial, appUrl }: { items: CatalogItem[]; categories: CatalogCategory[]; initial: FinderState; appUrl: string }) {
  const [s, setS] = useState<FinderState>(initial);
  const [showFilters, setShowFilters] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [cmp, setCmp] = useState<string[]>([]);
  const [showCmp, setShowCmp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const set = useCallback((patch: Partial<FinderState>) => setS((prev) => ({ ...prev, ...patch })), []);

  // Filters, sort, view and the open class live in the URL so a filtered page can be shared.
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${queryOf(s)}`);
  }, [s]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const byKey = useMemo(() => new Map(items.map((c) => [keyOf(c), c])), [items]);
  const providers = useMemo(() => {
    const m = new Map<string, { id: string; name: string; n: number }>();
    for (const c of items) m.set(c.organizationId, { id: c.organizationId, name: c.organizationName, n: (m.get(c.organizationId)?.n ?? 0) + 1 });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  const priceCap = useMemo(() => Math.max(50, Math.ceil(Math.max(0, ...items.map((c) => major(c) ?? 0)) / 50) * 50), [items]);

  const needle = s.q.trim().toLowerCase();
  const catLabel = useCallback((id: string | undefined) => categories.find((c) => c.id === id)?.label ?? "Other", [categories]);
  const matches = useCallback(
    (c: CatalogItem, skip?: "cats" | "modes" | "badges" | "provs") =>
      (!needle || `${c.name} ${c.organizationName} ${catLabel(c.category)} ${c.certificationBody ?? ""}`.toLowerCase().includes(needle)) &&
      (skip === "cats" || !s.cats.length || s.cats.includes(c.category ?? "other")) &&
      (skip === "modes" || !s.modes.length || s.modes.includes(c.format ?? "")) &&
      (skip === "badges" || !s.badges.length || (c.badge !== null && c.badge !== undefined && s.badges.includes(c.badge))) &&
      (skip === "provs" || !s.provs.length || s.provs.includes(c.organizationId)) &&
      (s.max === null || (major(c) ?? 0) <= s.max),
    [needle, s.cats, s.modes, s.badges, s.provs, s.max, catLabel],
  );

  const list = useMemo(() => {
    const out = items.filter((c) => matches(c));
    if (s.sort === "price") out.sort((a, b) => (major(a) ?? Infinity) - (major(b) ?? Infinity));
    else out.sort((a, b) => a.nextStartsAt.localeCompare(b.nextStartsAt));
    // Paid placements lead the default view (Featured) or their topic; they are labelled Sponsored.
    if (s.sort === "soonest") {
      const lead = (c: CatalogItem) => c.promoted === "top" || (c.promoted === "category" && s.cats.length > 0 && s.cats.includes(c.category ?? ""));
      return [...out.filter(lead), ...out.filter((c) => !lead(c))];
    }
    return out;
  }, [items, matches, s.sort, s.cats]);

  const count = (skip: "cats" | "modes" | "badges" | "provs", pred: (c: CatalogItem) => boolean) => items.filter((c) => matches(c, skip) && pred(c)).length;
  const groups = [
    { key: "cats" as const, title: "CATEGORY", round: false, opts: categories.map((c) => ({ id: c.id, label: c.label, n: count("cats", (x) => x.category === c.id) })) },
    { key: "modes" as const, title: "FORMAT", round: false, opts: Object.entries(FORMAT_LABELS).map(([id, label]) => ({ id, label, n: count("modes", (x) => x.format === id) })) },
    { key: "badges" as const, title: "BADGE", round: false, opts: BADGE_ORDER.map((id) => ({ id, label: BADGE_LABELS[id]!, n: count("badges", (x) => x.badge === id) })) },
    { key: "provs" as const, title: "PROVIDER", round: true, opts: providers.map((p) => ({ id: p.id, label: p.name, n: count("provs", (x) => x.organizationId === p.id) })) },
  ].map((g) => ({ ...g, opts: g.opts.filter((o) => o.n > 0 || s[g.key].includes(o.id)) }));
  const active = s.cats.length + s.modes.length + s.badges.length + s.provs.length + (s.max !== null ? 1 : 0);

  const sel = s.sel ? byKey.get(s.sel) ?? null : null;
  const selIndex = sel ? list.findIndex((c) => keyOf(c) === s.sel) : -1;
  const step = (d: number) => {
    if (!list.length) return;
    const i = selIndex < 0 ? 0 : (selIndex + d + list.length) % list.length;
    set({ sel: keyOf(list[i]!) });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCmp) setShowCmp(false);
        else if (sheet) setSheet(false);
        else set({ sel: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCmp, sheet, set]);

  const pageUrl = (c: CatalogItem) => `${appUrl}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}?via=enrollclass`;
  const openTab = (c: CatalogItem) => window.open(pageUrl(c), "_blank", "noopener");
  const toggleCmp = (c: CatalogItem) => {
    const k = keyOf(c);
    if (cmp.includes(k)) return setCmp(cmp.filter((x) => x !== k));
    if (cmp.length >= MAX_COMPARE) return setToast(`Compare up to ${MAX_COMPARE} classes. Remove one first.`);
    setCmp([...cmp, k]);
  };
  const cmpItems = cmp.map((k) => byKey.get(k)).filter((c): c is CatalogItem => Boolean(c));
  const providerCount = (c: CatalogItem) => providers.find((p) => p.id === c.organizationId)?.n ?? 1;

  const filters = (
    <>
      {groups.map((g) =>
        g.opts.length === 0 ? null : (
          <fieldset key={g.key} className="fc-group">
            <legend>{g.title}</legend>
            {g.opts.map((o) => {
              const on = s[g.key].includes(o.id);
              return (
                <label key={o.id} className="fc-opt">
                  <input type="checkbox" checked={on} onChange={() => set({ [g.key]: toggle(s[g.key], o.id) })} />
                  <span className={`fc-check${g.round ? " fc-check-round" : ""}`} aria-hidden="true">
                    {on ? "✓" : ""}
                  </span>
                  <span className="fc-opt-label">{o.label}</span>
                  <span className="fc-opt-n">{o.n}</span>
                </label>
              );
            })}
          </fieldset>
        ),
      )}
      <div className="fc-group">
        <label className="fc-range-head" htmlFor="fc-max">
          <span>MAX PRICE</span>
          <span>{s.max === null ? "Any" : s.max.toLocaleString("en-US")}</span>
        </label>
        <input
          id="fc-max"
          type="range"
          min={0}
          max={priceCap}
          step={50}
          value={s.max ?? priceCap}
          onChange={(e) => {
            const v = Number(e.target.value);
            set({ max: v >= priceCap ? null : v });
          }}
        />
      </div>
    </>
  );

  const cmpButton = (c: CatalogItem, size: "sm" | "md" = "sm") => {
    const on = cmp.includes(keyOf(c));
    return (
      <button
        type="button"
        className={`fc-cmp fc-cmp-${size}${on ? " is-on" : ""}`}
        aria-pressed={on}
        onClick={(e) => {
          e.stopPropagation();
          toggleCmp(c);
        }}
      >
        {on ? "✓ Added" : "+ Compare"}
      </button>
    );
  };

  return (
    <div className={`fc${sel ? " fc-has-sel" : ""}`}>
      <div className="fc-top">
        <input className="fc-search" type="search" value={s.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search classes, providers, certifications" aria-label="Search classes" />
      </div>
      <div className="fc-toolbar">
        <h1>Find a class</h1>
        <span className="fc-count" aria-live="polite">
          {list.length} result{list.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className={`fc-filters-btn${active ? " is-on" : ""}`}
          aria-expanded={showFilters}
          onClick={() => {
            if (window.matchMedia("(max-width: 899px)").matches) setSheet(true);
            else setShowFilters(!showFilters);
          }}
        >
          Filters{active ? ` · ${active}` : ""}
        </button>
        {active > 0 && (
          <button type="button" className="fc-clear" onClick={() => set({ cats: [], modes: [], badges: [], provs: [], max: null })}>
            Clear all
          </button>
        )}
        <span className="fc-spacer" />
        <div className="fc-seg" role="group" aria-label="Sort">
          {(
            [
              ["soonest", "Soonest"],
              ["price", "Price"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={s.sort === k} onClick={() => set({ sort: k })}>
              {l}
            </button>
          ))}
        </div>
        <div className="fc-seg" role="group" aria-label="View">
          {(
            [
              ["cards", "Cards"],
              ["table", "Table"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={s.view === k} onClick={() => set({ view: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="fc-body">
        {showFilters && (
          <aside className="fc-rail" aria-label="Filters">
            {filters}
          </aside>
        )}

        <section className="fc-results" aria-label="Classes">
          {list.length === 0 ? (
            <p className="fc-empty">{items.length ? "No classes match. Loosen a filter." : "No upcoming classes are listed right now."}</p>
          ) : s.view === "cards" ? (
            <ul className="fc-cards">
              {list.map((c, i) => {
                const k = keyOf(c);
                return (
                  <li key={k} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                    <article className={`fc-card${s.sel === k ? " is-sel" : ""}`} onClick={() => set({ sel: k })}>
                      <div className="fc-card-head">
                        <ProviderLogo c={c} size={42} />
                        <div className="fc-prov">
                          <span className="fc-prov-name">{c.organizationName}</span>
                          <Badge c={c} />
                        </div>
                        <span className="fc-card-meta">
                          {c.hours ? `${c.hours}h` : ""}
                          {c.hours ? <br /> : null}
                          {c.classes} date{c.classes === 1 ? "" : "s"}
                        </span>
                      </div>
                      <h2 className="fc-title">
                        <button type="button" onClick={() => set({ sel: k })}>
                          {c.name}
                        </button>
                      </h2>
                      <p className="fc-when">
                        {dateOf(c)} · {formatOf(c)}
                      </p>
                      {c.digitalBadge && (
                        <div className="fc-earns">
                          <DigitalBadge c={c} size={30} />
                          <span>
                            Earns <strong>{c.digitalBadge.name}</strong>
                          </span>
                        </div>
                      )}
                      <div className="fc-card-foot">
                        <span className="fc-price">{money(c.priceMinor, c.currency)}</span>
                        <a
                          className="fc-newtab"
                          href={pageUrl(c)}
                          target="_blank"
                          rel="noopener"
                          title="Open in new tab"
                          aria-label={`Open ${c.name} in a new tab`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↗
                        </a>
                        {cmpButton(c)}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="fc-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th aria-label="Provider logo" />
                    <th>CLASS</th>
                    <th>PROVIDER</th>
                    <th>START</th>
                    <th>FORMAT</th>
                    <th>SEATS</th>
                    <th className="fc-num">PRICE</th>
                    <th aria-label="Compare" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const k = keyOf(c);
                    return (
                      <tr key={k} className={s.sel === k ? "is-sel" : undefined} onClick={() => set({ sel: k })}>
                        <td>
                          <ProviderLogo c={c} size={36} />
                        </td>
                        <td className="fc-t-title">
                          <span className="fc-t-title-row">
                            <button type="button" onClick={() => set({ sel: k })}>
                              {c.name}
                            </button>
                            <DigitalBadge c={c} size={22} />
                          </span>
                        </td>
                        <td>
                          <div className="fc-prov">
                            <span className="fc-prov-name fc-prov-sm">{c.organizationName}</span>
                            <Badge c={c} />
                          </div>
                        </td>
                        <td className="fc-mono">{dateOf(c)}</td>
                        <td>{formatOf(c)}</td>
                        <td className="fc-mono">{c.capacity ? c.seatsLeft : "—"}</td>
                        <td className="fc-mono fc-num">{money(c.priceMinor, c.currency)}</td>
                        <td>{cmpButton(c)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {sel && (
          <aside className="fc-preview" aria-label="Quick preview">
            <div className="fc-preview-head">
              <span>QUICK PREVIEW</span>
              <button type="button" className="fc-round" onClick={() => step(-1)} aria-label="Previous class">
                ↑
              </button>
              <button type="button" className="fc-round" onClick={() => step(1)} aria-label="Next class">
                ↓
              </button>
              <button type="button" className="fc-round fc-round-ink" onClick={() => set({ sel: null })} aria-label="Close preview">
                ✕
              </button>
            </div>
            <div className="fc-preview-body">
              <div className="fc-preview-prov">
                <ProviderLogo c={sel} size={52} />
                <div className="fc-prov">
                  <span className="fc-prov-name">{sel.organizationName}</span>
                  <Badge c={sel} big />
                  <span className="fc-prov-note">
                    {providerCount(sel)} course{providerCount(sel) === 1 ? "" : "s"} on EnrollClass
                  </span>
                </div>
              </div>
              <h2>{sel.name}</h2>
              {sel.imageUrl && <img className="fc-preview-img" src={sel.imageUrl} alt="" />}
              {sel.description && <p className="fc-blurb">{sel.description.length > 420 ? `${sel.description.slice(0, 420).trimEnd()}…` : sel.description}</p>}
              <dl className="fc-facts">
                <div>
                  <dt>STARTS</dt>
                  <dd>{sel.format === "self_paced" ? "On demand" : fullDay(sel.nextStartsAt)}</dd>
                </div>
                <div>
                  <dt>FORMAT</dt>
                  <dd>
                    {formatOf(sel)}
                    {sel.hours ? ` · ${sel.hours}h` : ""}
                  </dd>
                </div>
                <div>
                  <dt>DATES</dt>
                  <dd>
                    {sel.classes} upcoming
                  </dd>
                </div>
                <div>
                  <dt>SEATS LEFT</dt>
                  <dd>{sel.capacity ? `${sel.seatsLeft} of ${sel.capacity}` : "—"}</dd>
                </div>
              </dl>
              {sel.capacity ? (
                <div className="fc-seats" role="img" aria-label={`${sel.seatsLeft} of ${sel.capacity} seats left`}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <span key={i} className={i < Math.round((20 * ((sel.capacity ?? 0) - (sel.seatsLeft ?? 0))) / (sel.capacity || 1)) ? "taken" : "free"} />
                  ))}
                </div>
              ) : null}
              {sel.digitalBadge && (
                <div className="fc-preview-badge">
                  <DigitalBadge c={sel} size={64} label />
                </div>
              )}
              <div>
                <h3>What&apos;s included</h3>
                <ul className="fc-learn">
                  {sel.certificationBody && <li>Certification course from {sel.certificationBody}</li>}
                  {sel.digitalBadge && <li>{sel.verifiedBadge ? `Verified digital badge (Open Badges 3.0): ${sel.digitalBadge.name}` : `Digital badge: ${sel.digitalBadge.name}`}</li>}
                  <li>Ticket and calendar invitation by email</li>
                  <li>Change or cancel from your booking link, within the provider&apos;s policy</li>
                </ul>
              </div>
            </div>
            <div className="fc-preview-foot">
              <div className="fc-preview-row">
                <span className="fc-price fc-price-lg">{money(sel.priceMinor, sel.currency)}</span>
                {cmpButton(sel, "md")}
                <a className="fc-pill" href={pageUrl(sel)} target="_blank" rel="noopener">
                  Open ↗
                </a>
              </div>
              <a className="fc-enroll" href={pageUrl(sel)}>
                {sel.seatsLeft === 0 && sel.capacity ? "Join the waitlist" : "Enroll"}
              </a>
            </div>
          </aside>
        )}
      </div>

      {cmpItems.length > 0 && (
        <div className="fc-tray" role="region" aria-label="Compare">
          <span className="fc-mono">
            COMPARE {cmpItems.length}/{MAX_COMPARE}
          </span>
          {cmpItems.map((c) => (
            <button key={keyOf(c)} type="button" className="fc-chip" onClick={() => toggleCmp(c)} aria-label={`Remove ${c.name} from compare`}>
              <ProviderLogo c={c} size={24} />
              {short(c.name)} ✕
            </button>
          ))}
          <button type="button" className="fc-cmp-now" disabled={cmpItems.length < 2} onClick={() => setShowCmp(true)}>
            Compare now
          </button>
        </div>
      )}

      {showCmp && cmpItems.length >= 2 && (
        <div className="fc-overlay" onClick={() => setShowCmp(false)}>
          <div className="fc-modal" role="dialog" aria-modal="true" aria-label="Compare classes" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-head">
              <h2>Compare classes</h2>
              <button type="button" className="fc-round fc-round-ink" onClick={() => setShowCmp(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="fc-compare" style={{ gridTemplateColumns: `110px repeat(${cmpItems.length}, minmax(0, 1fr))`, ["--n" as string]: cmpItems.length }}>
              <div />
              {cmpItems.map((c) => (
                <div key={keyOf(c)} className="fc-compare-col">
                  <div className="fc-compare-prov">
                    <ProviderLogo c={c} size={34} />
                    <span>{c.organizationName}</span>
                  </div>
                  <strong>{c.name}</strong>
                  <Badge c={c} />
                </div>
              ))}
              {(() => {
                // Only call a price best when every class is priced in the same currency.
                const sameCurrency = new Set(cmpItems.map((c) => c.currency)).size === 1;
                const prices = cmpItems.map((c) => major(c)).filter((x): x is number => x !== null);
                const best = sameCurrency && prices.length ? Math.min(...prices) : null;
                const rows: [string, (c: CatalogItem) => string, (c: CatalogItem) => boolean][] = [
                  ["PRICE", (c) => money(c.priceMinor, c.currency), (c) => best !== null && major(c) === best && cmpItems.length > 1],
                  ["STARTS", (c) => (c.format === "self_paced" ? "On demand" : fullDay(c.nextStartsAt)), () => false],
                  ["FORMAT", formatOf, () => false],
                  ["HOURS", (c) => (c.hours ? `${c.hours}h` : "—"), () => false],
                  ["DATES", (c) => `${c.classes} upcoming`, () => false],
                  ["SEATS LEFT", (c) => (c.capacity ? `${c.seatsLeft} of ${c.capacity}` : "—"), () => false],
                  ["CATEGORY", (c) => catLabel(c.category), () => false],
                  ["BADGE", (c) => c.digitalBadge?.name ?? "—", () => false],
                ];
                return rows.map(([label, value, win]) => [
                  <div key={label} className="fc-compare-label">
                    {label}
                  </div>,
                  ...cmpItems.map((c) => (
                    <div key={`${label}-${keyOf(c)}`} className={`fc-compare-cell${win(c) ? " is-best" : ""}`}>
                      {value(c)}
                    </div>
                  )),
                ]);
              })()}
              <div />
              {cmpItems.map((c) => (
                <a key={keyOf(c)} className="fc-enroll" href={pageUrl(c)} target="_blank" rel="noopener">
                  Open class ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet && (
        <div className="fc-overlay fc-overlay-sheet" onClick={() => setSheet(false)}>
          <div className="fc-sheet" role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal-head">
              <h2>Filters</h2>
              <button type="button" className="fc-round fc-round-ink" onClick={() => setSheet(false)} aria-label="Close filters">
                ✕
              </button>
            </div>
            <div className="fc-sheet-body">{filters}</div>
            <button type="button" className="fc-enroll" onClick={() => setSheet(false)}>
              Show {list.length} result{list.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fc-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
