"use client";

// The public website. One long page in the "Session" design: a speech-bubble hero with an
// audience toggle, the three modules (Classes, Templates, OKRs) with a demo each, the kit, the
// comparison, integrations, pricing by module, a chat-style FAQ and the sign-up. Everything
// here describes what the app does today.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api, setApiKey, type ApiFailure } from "@/lib/api";
import { CopyKey } from "@/components/copy-key";
import { InlinePayment, money, type Claim, type Subscription } from "@/components/pay-inline";
import { INTEGRATIONS, SiteFooter, SiteNav } from "@/components/site-nav";
import { COMPARISON, FAQ, PLANS, priceFor, type PlanId } from "@/lib/pricing";

const INK = "#14123a";
const STICKY = ["#ffe27a", "#ff9fc6", "#5ff0e0", "#b9c6ff"];
const TILT = ["-2deg", "1.5deg", "-1deg", "2deg"];

type Audience = "trainer" | "enterprise";

const HERO: Record<Audience, { eyebrow: string; a: string; b: string; c: string; p: string }> = {
  trainer: {
    eyebrow: "BUILT FOR TRAINERS · OPEN SOURCE · SELF-HOSTABLE",
    a: "The classroom for ",
    b: "anyone",
    c: " who trains.",
    p: "Run workshops on live boards your learners open by link. Timeboxes, breakout tables, the PI planning simulation and a readout drafted for you, so you teach instead of wrangling tools.",
  },
  enterprise: {
    eyebrow: "FOR AGILE RELEASE TRAINS · JIRA AND AZURE DEVOPS · SELF-HOSTED",
    a: "One planning room for every ",
    b: "train",
    c: " you run.",
    p: "PI planning boards, templates in every method's own words and an OKR dashboard for the board, in step with Jira and Azure DevOps: inside the trackers as a Jira app and an Azure DevOps extension, or on your own server.",
  },
};

const ROSTER: [string, string][] = [["Priya", "#ff9fc6"], ["Marcus", "#5ff0e0"], ["Lena", "#ffe27a"], ["Diego", "#b9c6ff"], ["Aiko", "#ff9fc6"]];

const MODULES = [
  {
    tab: "Classes",
    tag: "CLASSES · TRAINER",
    h: "Run the class.",
    p: "Each class is a board: a start-here strip, one frame per lesson with its exercises, and a PI planning simulation. Open one per cohort and hand out the link.",
    items: ["Leading SAFe, SPC, Advanced SPC, POPM, RTE", "Breakout tables, timeboxes, a day plan", "Import your Miro class boards"],
    href: "/classes",
    bg: "#fff",
    fg: INK,
  },
  {
    tab: "Templates",
    tag: "TEMPLATES · ACADEMY",
    h: "Pick the method.",
    p: "Fifty-odd boards across SAFe, Scrum, Kanban, Lean, Six Sigma and the shop floor, each in its method's own words. Pick one and the whole board changes shape: SAFe becomes a train, Kanban enforces WIP limits.",
    items: ["Nine method themes", "WIP limits, capacity and human gates enforced", "Or bring your own from Miro, Mural, Trello, monday.com or iObeya"],
    href: "/methods",
    bg: "#4a5fe8",
    fg: "#fff",
  },
  {
    tab: "OKRs",
    tag: "OKRs · INSIGHTS",
    h: "Show what the money bought.",
    p: "OKRs, KPIs and funding from every system that holds the evidence: CRM, finance, the learning platform, surveys, Jira. Weekly check-ins by drag, one-pagers for the executive team and the board.",
    items: ["Dashboard, alignment and check-in", "Initiatives with funders and spend", "Printable one-pagers per entity"],
    href: "/insights",
    bg: "#ff9fc6",
    fg: INK,
  },
] as const;

const METHOD_DEMO: { id: string; label: string; dot: string; bg: string; lane: string; line: string; cards: string[]; train?: boolean }[] = [
  { id: "safe", label: "SAFe", dot: "#ffb627", bg: "#efe8d8", lane: "#fffaf0", line: "#0d1815", cards: ["#ffd37a", "#cde0f2", "#cfe8d4"], train: true },
  { id: "scrum", label: "Scrum", dot: "#2f6bff", bg: "#eef3ff", lane: "#fff", line: "#cdd9ff", cards: ["#fff0b8", "#d6e4ff", "#d2f5e3"] },
  { id: "kanban", label: "Kanban", dot: "#5ff0e0", bg: "#0e1117", lane: "#171c25", line: "#3a4658", cards: ["#4a4326", "#233a5a", "#1f4a3f"] },
  { id: "lean", label: "Lean", dot: "#d93a2b", bg: "#fbfbf8", lane: "#fff", line: "#1a1a1a", cards: ["#fff08a", "#ffb3ab", "#c9f2c7"] },
  { id: "six-sigma", label: "Six Sigma", dot: "#0f9d8f", bg: "#eefaf8", lane: "#fff", line: "#a6d9d3", cards: ["#fff4c2", "#d3f0ee", "#d7f5d0"] },
  { id: "manufacturing", label: "Manufacturing", dot: "#ffd400", bg: "#e9e9e4", lane: "#f7f7f2", line: "#1b1b1b", cards: ["#ffd400", "#cfe0ee", "#cdeccb"] },
  { id: "innovation", label: "Innovation", dot: "#c6ff3d", bg: "#1a1033", lane: "#241547", line: "#7a5cd0", cards: ["#5c4a14", "#2a3f7a", "#1d5a3b"] },
  { id: "mutation", label: "Mutation", dot: "#ff5a36", bg: "#12100f", lane: "#1c1715", line: "#6a554b", cards: ["#4d3d12", "#1f3b5c", "#1f4a34"] },
];

const KIT: [string, string, string][] = [
  ["Boards that are lessons", "PI planning board with milestones and dependency strings, team breakouts, ROAM, story map, Kanban and roadmap boards, pre-built and facilitator-ready.", "M5 5h15v15H5zM24 5h15v9H24zM24 18h15v21H24zM5 24h15v15H5z"],
  ["A clock the room sees", "Timeboxes on every lane board, and a day plan that holds each half-day to 180 minutes, so a full-day class stays on schedule.", "M22 12v10l6 4M22 4v4M14 4h16M22 40a16 16 0 1 0 0-32 16 16 0 0 0 0 32z"],
  ["Share a link", "Participants open the board in a browser. Viewers watch, planners move cards. Nothing to install.", "M6 22h16M16 14l8 8-8 8M28 8h10v28H28"],
  ["Simulations", "The PI planning simulation with its backlog, Coach Sync checkpoints, ROAM and the confidence vote, built into the class boards.", "M6 32l9-9 6 6 13-15M26 14h8v8"],
  ["Breakout teams", "Tables of four: drag people in, or seat everyone at random. A full table refuses the fifth.", "M14 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM30 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM4 30a10 10 0 0 1 20 0M20 30a10 10 0 0 1 20 0M22 40a5 5 0 1 0 0-10"],
  ["A co-trainer", "Drafts PI objectives, suggests ROAM, reviews a board and writes the readout. You approve everything.", "M22 8v6M22 30v6M8 22h6M30 22h6M13 13l4 4M27 27l4 4M31 13l-4 4M17 27l-4 4"],
  ["Instant readout", "Dashboards by team, increment and work level, with the narrative written for you.", "M6 38V22M16 38V12M26 38V26M36 38V8"],
  ["Bring your material", "Connect Miro, Mural, Trello or monday.com, upload an iObeya export, or drop a CSV. Boards arrive as they are; add any template beside them.", "M6 14h12l3 4h17v18H6zM22 24v8M18 28l4 4 4-4"],
];

const MARQUEE = ["Class boards", "PI planning", "Scrum", "Kanban", "Lean", "Six Sigma", "OKRs", "Value streams", "Jira & Azure DevOps"];

function Ring({ size, r, stroke, color, track, value, children, viewBox = 200 }: { size: number; r: number; stroke: number; color: string; track: string; value: number; children?: React.ReactNode; viewBox?: number }) {
  const c = 2 * Math.PI * r;
  const half = viewBox / 2;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        <circle cx={half} cy={half} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={half} cy={half} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform={`rotate(-90 ${half} ${half})`} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      {children}
    </div>
  );
}

/** A timebox counting down from four minutes, the way it does on a lane board. */
function useTimebox(total = 240) {
  const [left, setLeft] = useState(total);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s <= 0 ? total : s - 1)), 1000);
    return () => clearInterval(t);
  }, [total]);
  return { left, share: left / total, label: `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}` };
}

export function Landing() {
  const [aud, setAud] = useState<Audience>("trainer");
  const [mod, setMod] = useState(0);
  const [method, setMethod] = useState(0);
  const [open, setOpen] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [plan, setPlan] = useState<PlanId>("trainer");
  const ringRef = useRef<SVGCircleElement>(null);
  const timer = useTimebox();

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(201 * (1 - p));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hero = HERO[aud];
  const cur = MODULES[mod]!;
  const md = METHOD_DEMO[method]!;
  const roster = ROSTER.map(([n, c], i) => ({ n, c, d: `${i * 0.35}s` }));
  const choose = (id: PlanId) => {
    setPlan(id);
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="ly">
      <div className="ly-ring" aria-hidden="true">
        <a href="#top" title="Back to the top">
          <svg width="100%" height="100%" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="40" fill={INK} />
            <circle cx="42" cy="42" r="32" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="6" />
            <circle ref={ringRef} cx="42" cy="42" r="32" fill="none" stroke="#ff9fc6" strokeWidth="6" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="201" transform="rotate(-90 42 42)" />
            <rect x="29" y="27" width="26" height="8" rx="2.5" fill="#fff" />
            <rect x="38" y="35" width="8" height="20" rx="2.5" fill="#fff" />
          </svg>
        </a>
      </div>

      <SiteNav />

      <header id="top" className="ly-hero">
        <div className="toggle" role="group" aria-label="Who is this for">
          <button aria-pressed={aud === "trainer"} onClick={() => setAud("trainer")}>
            For trainers
          </button>
          <button aria-pressed={aud === "enterprise"} onClick={() => setAud("enterprise")}>
            For enterprise
          </button>
        </div>
        <div className="cols">
          <div className="left">
            <div className="ly-bubble">
              <div className="eyebrow">
                <span className="dot" />
                {hero.eyebrow}
              </div>
              <h1>
                {hero.a}
                <span className="chip">{hero.b}</span>
                {hero.c}
              </h1>
              <p>{hero.p}</p>
              <div className="ctas">
                <a href="#join" className="a">
                  Register free
                </a>
                <a href="#modules" className="b">
                  See the three modules
                </a>
              </div>
            </div>
            <div className="ly-tail-back" />
            <div className="ly-tail" />
          </div>
          <div className="right">
            <div className="ly-card ly-ready">
              <div className="clock">
                <Ring size={110} r={88} stroke={16} color={INK} track="#14123a33" value={timer.share}>
                  <b>{timer.label}</b>
                </Ring>
              </div>
              <div>
                <div className="tag">TIMEBOX · LIVE</div>
                <div className="hand">Draft plans, 4 min</div>
                <div className="tag" style={{ marginTop: 8 }}>LAUNCH IN 5 MIN, NOT 3 WEEKS</div>
              </div>
            </div>
            <div className="ly-card ly-roster">
              <div className="tag">ON THE BOARD · {roster.length} / 24</div>
              {roster.map((r) => (
                <div key={r.n} className="row" style={{ animationDelay: r.d }}>
                  <span className="av" style={{ background: r.c }} />
                  <b>{r.n}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="ly-marquee" aria-hidden="true">
        <div className="track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="item">
              {m}
              <span className="sq" style={{ background: STICKY[i % 4] }} />
            </span>
          ))}
        </div>
      </div>

      <section id="free" className="ly-free" aria-label="Free classes and templates">
        <div className="ly-cards">
          <div className="ly-card ly-free-card" style={{ background: STICKY[0] }}>
            <div className="tag">TEACH CLASSES · FREE</div>
            <h3>Teach your classes for free.</h3>
            <p>Leading SAFe, SPC, Advanced SPC, POPM and RTE class boards, lesson by lesson with the exercises, the PI planning simulation and the votes built in. Sign up free, open a classroom, teach.</p>
            <a href="#join">Sign up free →</a>
          </div>
          <div className="ly-card ly-free-card" style={{ background: STICKY[1] }}>
            <div className="tag">READY-MADE TEMPLATES</div>
            <h3>Fifty boards, each in its method's own words.</h3>
            <p>SAFe named as SAFe names it; Scrum from the Scrum Guide; Kanban, Lean, Six Sigma and the shop floor each with their own boards. Sized to your teams and iterations the moment you create one.</p>
            <Link href="/methods">See the templates →</Link>
          </div>
          <div className="ly-card ly-free-card" style={{ background: STICKY[2] }}>
            <div className="tag">OR BRING YOUR OWN</div>
            <h3>Your template, your way.</h3>
            <p>Import from Miro, Mural, Trello, monday.com, iObeya or a CSV, keep it exactly as it came, and save it as a template for the next class or the next PI.</p>
            <Link href="/imports">Bring a board →</Link>
          </div>
        </div>
      </section>

      <section id="modules">
        <div className="eyebrow">01 / THREE MODULES, ONE YARD</div>
        <h2 className="h2">Classes, templates, OKRs.</h2>
        <div className="ly-tabs" role="tablist" aria-label="Modules">
          {MODULES.map((r, i) => (
            <button key={r.tab} role="tab" aria-selected={mod === i} onClick={() => setMod(i)} style={mod === i ? { background: r.bg, color: r.fg, boxShadow: `4px 4px 0 ${INK}` } : undefined}>
              <span className="sw" style={{ background: r.bg }} />
              {r.tab}
            </button>
          ))}
        </div>
        <div className="ly-rooms">
          <div className="ly-room" style={{ background: cur.bg, color: cur.fg }}>
            <div className="tag">{cur.tag}</div>
            <h3>{cur.h}</h3>
            <p>{cur.p}</p>
            <Link href={cur.href} className="pill navy md-open" style={mod === 1 ? { background: "#fff", color: INK } : undefined}>
              Open {cur.tab} →
            </Link>
            <ul>
              {cur.items.map((it) => (
                <li key={it}>
                  <span>✦</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <div className="ly-demo">
            {mod === 0 ? (
              <div className="md-list" aria-label="Class boards, one per cohort">
                <div className="tag">CLASS BOARDS · ONE PER COHORT</div>
                {(
                  [
                    ["LS", "Leading SAFe", "2 days"],
                    ["SPC", "SAFe Practice Consultant", "4 days"],
                    ["ASPC", "Advanced SPC", "3 days"],
                    ["POPM", "Product Owner / Manager", "2 days"],
                    ["RTE", "Release Train Engineer", "3 days"],
                  ] as const
                ).map(([k, n, d], i) => (
                  <Link key={k} href="/classes" className="r" style={{ background: STICKY[i % 4], color: INK, textDecoration: "none", animationDelay: `${i * 0.08}s` }}>
                    <span className="mono">{k}</span>
                    <span>{n}</span>
                    <span>{d}</span>
                  </Link>
                ))}
              </div>
            ) : mod === 1 ? (
              <div className="md-methods">
                <div className="md-chips" role="group" aria-label="Method">
                  {METHOD_DEMO.map((m, i) => (
                    <button key={m.id} aria-pressed={method === i} onClick={() => setMethod(i)}>
                      <span className="d" style={{ background: m.dot }} />
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="md-mini" style={{ background: md.bg }} aria-label={`${md.label} board`}>
                  {["To do", "Doing", "Done"].map((t, i) => (
                    <div key={t} className="ln" style={{ background: md.lane, border: `2px solid ${md.line}`, borderRadius: md.train ? "12px 12px 4px 4px" : md.id === "lean" || md.id === "manufacturing" ? 2 : 12, color: md.bg === "#0e1117" || md.bg === "#1a1033" || md.bg === "#12100f" ? "#fff" : INK }}>
                      <b>{md.id === "safe" ? ["Iteration 1", "Iteration 2", "IP"][i] : md.id === "kanban" ? ["Ready · WIP 4", "Doing · WIP 3", "Done"][i] : md.id === "mutation" ? ["Signal", "Response", "Learning"][i] : md.id === "lean" ? ["Plan", "Do", "Check"][i] : md.id === "six-sigma" ? ["Measure", "Analyze", "Improve"][i] : t}</b>
                      {md.cards.slice(0, 3 - i).map((c, j) => (
                        <span key={j} className="cd" style={{ background: c, border: `1.5px solid ${md.line}`, borderRadius: md.id === "lean" ? 2 : 6 }} />
                      ))}
                    </div>
                  ))}
                </div>
                {md.train ? <div className="md-mini-rail" aria-hidden="true" /> : null}
              </div>
            ) : (
              <div className="md-exec" aria-label="OKR dashboard example">
                <div className="hd">
                  <b>Q4 dashboard</b>
                  <span>38 DAYS LEFT</span>
                </div>
                <div className="top">
                  <div className="ring">
                    <Ring size={98} r={80} stroke={18} color="#0f2342" track="#0f234222" value={0.87} />
                    <b>87%</b>
                  </div>
                  <div className="cnt">
                    <div>
                      <b style={{ color: "#2f8f5b" }}>6</b>on track
                    </div>
                    <div>
                      <b style={{ color: "#b87a00" }}>2</b>at risk
                    </div>
                    <div>
                      <b style={{ color: "#b42318" }}>1</b>off track
                    </div>
                  </div>
                </div>
                {(
                  [
                    ["Grow reach in low-income countries", 87],
                    ["Raise learning impact", 100],
                    ["Run the programme efficiently", 75],
                  ] as const
                ).map(([t, v]) => (
                  <div key={t} className="obj">
                    <div className="row">
                      <span>{t}</span>
                      <span>{v}%</span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="kit">
        <div className="eyebrow">02 / THE KIT</div>
        <h2 className="h2">Everything a trainer sticks on the wall.</h2>
        <div className="ly-kit">
          {KIT.map(([h, p, d], i) => (
            <article key={h} className="ly-note" style={{ background: STICKY[i % 4], transform: `rotate(${TILT[i % 4]})` }}>
              <div className="tape" />
              <svg width="48" height="48" viewBox="0 0 44 44" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={d} />
              </svg>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="compare">
        <div className="eyebrow">03 / COMPARED</div>
        <h2 className="h2">PI planning tools compared: Jira apps, iObeya, Miro and Trainyard.</h2>
        <div className="ly-table">
          <table>
            <thead>
              <tr>
                <th scope="col">TOOL</th>
                <th scope="col">HOSTING</th>
                <th scope="col">PI PLANNING</th>
                <th scope="col">ART LEVEL</th>
                <th scope="col">PORTFOLIO AND BEYOND</th>
                <th scope="col">INTEGRATION</th>
                <th scope="col">PRICED BY</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.tool} className={c.ours ? "ours" : undefined}>
                  <td>{c.tool}</td>
                  <td>{c.hosting}</td>
                  <td>{c.pi}</td>
                  <td>{c.art}</td>
                  <td>{c.beyond}</td>
                  <td>{c.integration}</td>
                  <td>{c.pricedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">Capabilities from a side-by-side evaluation of PI planning dashboard tools and each vendor&apos;s public pages. Products change; check each vendor for its current features. Product names are trademarks of their owners.</p>
      </section>

      <section id="integrations">
        <div className="eyebrow">04 / INTEGRATIONS</div>
        <h2 className="h2">Plugs into what you already use.</h2>
        <div className="it-grid">
          {INTEGRATIONS.map((g, i) => (
            <article key={g.t} className="it-card" style={{ background: STICKY[i % 4], transform: `rotate(${TILT[i % 4]})` }}>
              <div className="tape" />
              <div className="tag">{g.t}</div>
              {g.items.map(([n, d]) => (
                <div key={n}>
                  <h3>{n}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section id="pricing">
        <div className="eyebrow">05 / PRICING</div>
        <h2 className="h2">Priced by module, not by headcount.</h2>
        <div className="toggle" role="group" aria-label="Billing" style={{ marginBottom: 40 }}>
          <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly · 2 months free
          </button>
        </div>
        <div className="ly-plans">
          {PLANS.map((p, i) => {
            const price = priceFor(p, yearly);
            return (
              <div key={p.id} className="ly-plan" style={{ background: p.bg, color: p.fg, transform: `rotate(${["-1.5deg", "0deg", "1deg", "-0.5deg"][i % 4]})` }}>
                <div className="top">
                  <span>{p.tag}</span>
                  <span>{p.badge ?? ""}</span>
                </div>
                <div className="name">{p.name}</div>
                <div className="price">
                  <b>{price.amount}</b>
                  <span>{price.unit}</span>
                </div>
                <p>{p.blurb}</p>
                <ul>
                  {p.items.map((it) => (
                    <li key={it}>
                      <span>✦</span>
                      {it}
                    </li>
                  ))}
                </ul>
                <button className="cta" style={{ background: p.fg, color: p.bg }} onClick={() => choose(p.id)}>
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>
        <div className="ly-why">
          <div>
            <b>Why not per user?</b>A PI planning room holds a whole train. Tools that charge per member make the room itself the expensive part; here a 50-person train and a 150-person train cost the same.
          </div>
          <div>
            <b>Why not per room?</b>Per-room licences come with a minimum number of rooms. A train is a unit you already have, and one train is a fine place to start.
          </div>
          <div>
            <b>What about self-hosting?</b>The whole product is Apache-2.0. Practice is not a trial: run it yourself, with every feature, for as long as you like. Paid plans add hosting, the plugins, SSO and a person to call.
          </div>
        </div>
        <p className="fine">
          Every paid plan starts with a <strong>free 30-day trial</strong>, then month by month: no card charge today, a reminder by email 7 days before the first charge, no yearly commitment to begin. Not satisfied in your first paid month? <strong>Money back</strong>, claimed by you from Plan &amp; billing, no questions asked. Yearly billing (ten months for twelve) is a switch you make after the first month. Prices in USD, before tax. Portfolios with more than ten trains, on-premises support agreements and public-sector terms: talk to us.
        </p>
      </section>

      <section id="faq" className="ly-faq">
        <div className="head">
          <div className="eyebrow">06 / ASK THE ROOM</div>
          <h2 className="h2">Questions, answered out loud.</h2>
        </div>
        <div className="list">
          {FAQ.map((f, i) => (
            <div key={f.q} className="ly-q">
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
              </button>
              <div className="a" data-open={open === i}>
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="join" className="ly-joinsec">
        <div className="cols">
          <div className="copy">
            <div className="eyebrow">07 / REGISTER</div>
            <h2>
              Your class starts at <span className="chip">00:00</span>.
            </h2>
            <p>Register, pick a module and send learners a link. Practice is ready at once. Trainer, Academy and Insights start with a free 30-day trial, month by month, with a money-back guarantee on the first paid month.</p>
          </div>
          <SignupForm plan={plan} setPlan={setPlan} audience={aud} yearly={yearly} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

type BillingConfig = { enabled: boolean; inPage: boolean; publishableKey?: string; plans: Record<string, boolean>; trialDays: number; guaranteeDays?: number };

function SignupForm({ plan, setPlan, audience, yearly }: { plan: PlanId; setPlan: (p: PlanId) => void; audience: Audience; yearly: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [seats, setSeats] = useState("");
  const [note, setNote] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; email: string; plan: PlanId; paying?: boolean; claim?: Claim } | null>(null);
  const [pay, setPay] = useState<Subscription | null>(null);
  const def = useMemo(() => PLANS.find((p) => p.id === plan)!, [plan]);
  const [billing, setBilling] = useState<BillingConfig | null>(null);
  useEffect(() => {
    api<BillingConfig>("GET", "/v1/billing/config").then(setBilling, () => setBilling(null));
  }, []);
  // Every paid plan starts month by month with a free trial; yearly is chosen later from Billing.
  const interval = "monthly" as const;
  const canPay = plan !== "practice" && !!billing?.enabled && !!billing.plans[`${plan}-${interval}`];
  void yearly;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const created = await api<{ signup: { id: string }; apiKey?: string; workspace?: { id: string; name: string; plan: string } }>("POST", "/v1/signups", {
        name: name.trim(),
        email: email.trim(),
        password,
        plan,
        audience,
        ...(company.trim() ? { company: company.trim() } : {}),
        ...(seats && Number(seats) > 0 ? { seats: Number(seats) } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(hp ? { website: hp } : {}),
        source: typeof window !== "undefined" ? window.location.pathname : "/",
      });
      const quantity = seats && Number(seats) > 0 ? Number(seats) : 1;
      if (created.apiKey) {
        // Practice: the workspace exists already; the key is shown once, right here.
        setDone({ name: name.trim(), email: email.trim(), plan, claim: { status: "paid", plan: "practice", apiKey: created.apiKey, name: name.trim(), email: email.trim() } });
      } else if (canPay && billing?.inPage && billing.publishableKey && created.signup?.id) {
        // Paid plan: the subscription is created now and paid right here, on this page.
        const sub = await api<Subscription>("POST", "/v1/billing/subscribe", { signupId: created.signup.id, interval, quantity });
        setPay(sub);
      } else if (canPay && created.signup?.id) {
        // No publishable key on the server: hosted Checkout, with the welcome page handing over the key.
        setDone({ name: name.trim(), email: email.trim(), plan, paying: true });
        try {
          const { url } = await api<{ url: string }>("POST", "/v1/billing/checkout", { signupId: created.signup.id, interval, quantity });
          window.location.assign(url);
          return;
        } catch {
          setDone({ name: name.trim(), email: email.trim(), plan });
        }
      } else setDone({ name: name.trim(), email: email.trim(), plan });
    } catch (x) {
      const f = x as ApiFailure;
      setErr(f.status === 429 ? "Too many sign-ups from this connection; try again in a minute." : f.code === "EMAIL_TAKEN" ? "There is already a sign-in for this email. Use Sign in at the top, or write to us for a new key." : f.message);
    } finally {
      setBusy(false);
    }
  };

  if (pay && billing?.publishableKey) {
    const qty = seats && Number(seats) > 0 ? Number(seats) : 1;
    const unit = plan === "academy" ? "train" : plan === "insights" ? "source pack" : "trainer";
    return (
      <div className="ly-form">
        <div className="ly-step">
          <span className="ly-step-n">2</span> Payment · {name.trim()}, {email.trim()}
        </div>
        <InlinePayment
          publishableKey={billing.publishableKey}
          sub={pay}
          email={email.trim()}
          summary={`${def.name} · ${qty} ${unit}${qty > 1 ? "s" : ""} · month by month`}
          onPaid={(claim) => {
            setPay(null);
            setDone({ name: name.trim(), email: email.trim(), plan, claim });
          }}
          onBack={() => setPay(null)}
        />
      </div>
    );
  }
  if (done?.claim) {
    const c = done.claim;
    return (
      <div className="ly-form">
        <div className="ly-done" role="status">
          <div className="check">✓</div>
          <div className="big">{c.status === "paid" ? `Welcome aboard, ${done.name}.` : `Almost there, ${done.name}.`}</div>
          {c.status === "paid" && c.apiKey ? (
            <>
              <p>
                {c.plan === "practice" ? (
                  <>
                    Your <strong>Practice</strong> workspace is ready: one room, up to 5 people, free. Sign in with your email and password. The key below is for scripts and integrations; it is shown once.
                  </>
                ) : (
                  <>
                    Your <strong>{def.name}</strong> subscription is active. Sign in with your email and password. The key below is for scripts and integrations; it is shown once. A receipt from Stripe is on its way to {done.email}.
                  </>
                )}
              </p>
              <CopyKey value={c.apiKey} />
              <button
                onClick={() => {
                  setApiKey(c.apiKey!);
                  window.location.assign("/dashboards");
                }}
              >
                Open Trainyard →
              </button>
            </>
          ) : c.status === "paid" ? (
            <p>
              The key for this payment was already shown. <Link href="/login">Sign in</Link> with it, or write to us from {done.email} for a new one.
            </p>
          ) : (
            <p>
              Your payment is still being confirmed{c.status === "open" ? " (bank payments can take a moment)" : ""}. Open <Link href="/welcome">the welcome page</Link> in a minute, or check the email from Stripe.
            </p>
          )}
        </div>
      </div>
    );
  }
  if (done?.paying) {
    return (
      <div className="ly-form">
        <div className="ly-done" role="status">
          <div className="check">→</div>
          <div className="big">Taking you to payment, {done.name}.</div>
          <p>Stripe handles the card. You come back here with your sign-in key.</p>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="ly-form">
        <div className="ly-done" role="status">
          <div className="check">✓</div>
          <div className="big">You&apos;re in, {done.name}.</div>
          <p>
            We will send the sign-in for the <strong>{PLANS.find((p) => p.id === done.plan)!.name}</strong> plan to {done.email}.
            {done.plan === "practice" ? " Meanwhile the demo workspace is open: " : " "}
            {done.plan === "practice" ? (
              <Link href="/dashboards">have a look around</Link>
            ) : (
              <>
                Prefer to start now? The <Link href="/dashboards">demo workspace</Link> is open
              </>
            )}
            .
          </p>
          <button
            onClick={() => {
              setDone(null);
              setName("");
              setEmail("");
              setCompany("");
              setSeats("");
              setNote("");
            }}
          >
            Add another trainer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ly-form">
      <form onSubmit={(e) => void submit(e)} style={{ position: "relative" }}>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Ada Lovelace" autoComplete="name" />
        </label>
        <label>
          Work email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} placeholder="ada@company.com" autoComplete="email" />
        </label>
        <label>
          Choose a password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} maxLength={200} placeholder="10 characters or more" autoComplete="new-password" />
        </label>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Plan</div>
        <div className="plans" role="group" aria-label="Plan">
          {PLANS.map((p) => (
            <button key={p.id} type="button" className={`pill${plan === p.id ? " on" : ""}`} onClick={() => setPlan(p.id)} aria-pressed={plan === p.id}>
              {p.name}
            </button>
          ))}
        </div>
        {plan !== "practice" ? (
          <div className="two">
            <label>
              {plan === "academy" ? "Organisation" : "Company (optional)"}
              <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} required={plan === "academy"} autoComplete="organization" />
            </label>
            <label>
              {plan === "academy" ? "Trains" : plan === "insights" ? "Packs of 10 data sources" : "Trainers"}
              <input type="number" min={1} max={100000} value={seats} onChange={(e) => setSeats(e.target.value)} placeholder={plan === "academy" ? "e.g. 3" : "1"} />
            </label>
          </div>
        ) : null}
        {plan === "academy" ? (
          <label>
            Anything we should know (optional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Jira or Azure DevOps, on-premises, SSO provider, when the next PI planning is…" />
          </label>
        ) : null}
        <label className="hp" aria-hidden="true">
          Website
          <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </label>
        {err ? <div className="err" role="alert">{err}</div> : null}
        <button type="submit" className="submit" disabled={busy}>
          {busy ? "One moment…" : canPay && billing?.inPage ? (billing.trialDays ? `${def.cta}: free for ${billing.trialDays} days →` : `${def.cta}: ${money((def.monthly ?? 0) * 100 * (seats && Number(seats) > 0 ? Number(seats) : 1), "usd")} a month →`) : def.cta + " →"}
        </button>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>Your email is your sign-in and the address for receipts. No newsletter, no resale.</p>
      </form>
    </div>
  );
}
