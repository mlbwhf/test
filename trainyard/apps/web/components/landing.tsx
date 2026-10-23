"use client";

// The public website. One long page in the "Session" design: a speech-bubble hero with an
// audience toggle, three rooms, the kit, the comparison, pricing, a chat-style FAQ and the
// sign-up. Everything here describes what the app does today; the design's trainer-room
// features that are not built (timers, breakout rooms) are not promised.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api, setApiKey, type ApiFailure } from "@/lib/api";
import { CopyKey } from "@/components/copy-key";
import { InlinePayment, money, type Claim, type Subscription } from "@/components/pay-inline";
import { REPO_URL } from "@/lib/site";
import { COMPARISON, FAQ, PLANS, priceFor, type PlanId } from "@/lib/pricing";

const INK = "#14123a";
const STICKY = ["#ffe27a", "#ff9fc6", "#5ff0e0", "#b9c6ff"];
const TILT = ["-2deg", "1.5deg", "-1deg", "2deg"];

type Audience = "trainer" | "enterprise";

const HERO: Record<Audience, { eyebrow: string; a: string; b: string; c: string; p: string }> = {
  trainer: {
    eyebrow: "BUILT FOR COACHES AND TRAINERS · OPEN SOURCE · SELF-HOSTABLE",
    a: "The classroom for ",
    b: "anyone",
    c: " who trains.",
    p: "Run workshops and PI planning on live boards your participants open by link. Nineteen ready boards, the SAFe canvases, value stream workshops and a co-trainer that drafts and never decides.",
  },
  enterprise: {
    eyebrow: "FOR AGILE RELEASE TRAINS · JIRA AND AZURE DEVOPS · SELF-HOSTED",
    a: "One planning room for every ",
    b: "train",
    c: " you run.",
    p: "PI planning, program boards, portfolio Kanban and value stream maps that stay in step with Jira and Azure DevOps: inside the trackers as a Jira app and an Azure DevOps extension, or on your own server.",
  },
};

const ROSTER: [string, string][] = [["Priya", "#ff9fc6"], ["Marcus", "#5ff0e0"], ["Lena", "#ffe27a"], ["Diego", "#b9c6ff"], ["Aiko", "#ff9fc6"]];

const ROOMS = [
  {
    tab: "Planning",
    tag: "PLANNING ROOM",
    h: "Plan it live.",
    p: "Run PI planning from one template, or AI-Native SAFe's one-day PI Outcome Planning: the outcome tree, the PI Outcome Planning Board, team boards, the management review and the confidence vote. Move a card and the iteration changes in Jira or Azure DevOps.",
    items: ["Nineteen ready boards", "Sticky notes, dependencies, votes", "Two-way Jira and Azure DevOps"],
    bg: "#fff",
    fg: INK,
  },
  {
    tab: "Workshop",
    tag: "WORKSHOP ROOM",
    h: "Teach it together.",
    p: "Value stream identification, SWOT into TOWS into a portfolio vision, story maps and the SAFe canvases, on boards the whole room writes on. Bring your own from iObeya, Miro or Mural.",
    items: ["Share the board link, no install", "SAFe canvases as structured data", "Import the boards you already teach from"],
    bg: "#4a5fe8",
    fg: "#fff",
  },
  {
    tab: "Measuring",
    tag: "MEASURING ROOM",
    h: "Measure it honestly.",
    p: "Value stream maps with wait time, active time and %C&A calculated from status history, flow dashboards with a narrative, and a PI planning readiness score against the launch timeline.",
    items: ["Numbers from Jira, Azure DevOps or a CSV", "Flow, predictability and WSJF metrics", "Readiness scored against the date"],
    bg: "#ff9fc6",
    fg: INK,
  },
] as const;

const KIT: [string, string, string][] = [
  ["Boards that are lessons", "PI planning, team breakouts, ROAM, program board, story map, Kanban and roadmap boards, pre-built and facilitator-ready.", "M5 5h15v15H5zM24 5h15v9H24zM24 18h15v21H24zM5 24h15v15H5z"],
  ["SAFe's own canvases", "Portfolio canvas, SWOT and TOWS, LACE mission, epic hypothesis, Lean business case, feature and enabler canvases, kept as data.", "M6 8h32v28H6zM6 18h32M19 18v18"],
  ["Value streams, measured", "Identify them in a workshop, then map one with numbers pulled from your tracker instead of guessed on a wall.", "M6 38V22M16 38V12M26 38V26M36 38V8"],
  ["Share a link", "Participants open the board in a browser. Viewers watch, planners move cards. Nothing to install.", "M6 22h16M16 14l8 8-8 8M28 8h10v28H28"],
  ["Jira and Azure DevOps, both ways", "Features, stories, risks and dependencies come from the tracker and go back to it, with a queue you can inspect first.", "M12 22a10 10 0 1 0 20 0 10 10 0 0 0-20 0zM22 4v8M22 32v8M4 22h8M32 22h8"],
  ["A co-trainer", "Drafts PI objectives, suggests ROAM, reviews a board and writes the readout. You approve everything.", "M22 8v6M22 30v6M8 22h6M30 22h6M13 13l4 4M27 27l4 4M31 13l-4 4M17 27l-4 4"],
  ["Instant readout", "Dashboards by team, increment and work level, with the narrative written for you.", "M6 32l9-9 6 6 13-15M26 14h8v8"],
  ["Bring your material", "Upload iObeya exports, connect Miro, Mural, monday.com or Trello, or drop a CSV. Boards arrive as they are.", "M6 14h12l3 4h17v18H6zM22 24v8M18 28l4 4 4-4"],
];

const MARQUEE = ["PI planning", "Program boards", "ROAM", "Value streams", "SAFe canvases", "Jira & Azure DevOps", "iObeya imports", "Any framework"];

function Logo({ size = 58 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" style={{ overflow: "visible" }} aria-hidden="true">
      <path d="M52 16h136a32 32 0 0 1 32 32v100a32 32 0 0 1-32 32H96l-46 38v-38h2A32 32 0 0 1 20 148V48a32 32 0 0 1 32-32z" fill="#4a5fe8" transform="translate(0 2)" />
      <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="10" />
      <circle cx="120" cy="98" r="58" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray="365" transform="rotate(-90 120 98)" style={{ animation: "ringL 6s linear infinite" }} />
      <rect x="92" y="72" width="56" height="16" rx="5" fill="#fff" />
      <rect x="112" y="88" width="16" height="42" rx="5" fill="#fff" />
      <rect x="70" y="100" width="17" height="17" rx="4" fill="#ffe27a" />
      <rect x="152" y="96" width="17" height="17" rx="4" fill="#ff9fc6" />
      <rect x="152" y="118" width="17" height="17" rx="4" fill="#5ff0e0" />
      <rect x="186" y="170" width="44" height="34" rx="12" fill="#ff3d8f" stroke="#f4f1ea" strokeWidth="5" />
    </svg>
  );
}

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

/** The readiness checklist ticking up, the way it does on the ART launch canvas. */
function useReadiness(total = 12) {
  const [done, setDone] = useState(6);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => (d >= total ? 4 : d + 1)), 1600);
    return () => clearInterval(t);
  }, [total]);
  return { done, total, share: done / total };
}

export function Landing() {
  const [aud, setAud] = useState<Audience>("trainer");
  const [room, setRoom] = useState(0);
  const [open, setOpen] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [plan, setPlan] = useState<PlanId>("trainer");
  const ringRef = useRef<SVGCircleElement>(null);
  const ready = useReadiness();

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
  const cur = ROOMS[room]!;
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

      <nav className="ly-nav" aria-label="Site">
        <a href="#top" className="brand">
          <Logo />
          <span className="word">
            Train<b>yard</b>
          </span>
        </a>
        <div className="links">
          <a href="#rooms">Rooms</a>
          <Link href="/classes">Classes</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/compare">Compare</Link>
          <a href="#pricing">Pricing</a>
          <Link href="/dashboards" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
          <a href="#join" className="pill navy">
            Join a class →
          </a>
        </div>
      </nav>

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
                  Open a classroom
                </a>
                <a href="#rooms" className="b">
                  See the three rooms
                </a>
              </div>
            </div>
            <div className="ly-tail-back" />
            <div className="ly-tail" />
          </div>
          <div className="right">
            <div className="ly-card ly-ready">
              <div className="clock">
                <Ring size={110} r={88} stroke={16} color={INK} track="#14123a33" value={ready.share}>
                  <b>
                    {ready.done} / {ready.total}
                  </b>
                </Ring>
              </div>
              <div>
                <div className="tag">PI READINESS · LIVE</div>
                <div className="hand">Launch in 3 weeks</div>
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

      <section id="rooms">
        <div className="eyebrow">01 / THREE ROOMS, ONE YARD</div>
        <h2 className="h2">Switch the room, keep the class.</h2>
        <div className="ly-tabs" role="tablist" aria-label="Rooms">
          {ROOMS.map((r, i) => (
            <button key={r.tab} role="tab" aria-selected={room === i} onClick={() => setRoom(i)} style={room === i ? { background: r.bg, color: r.fg, boxShadow: `4px 4px 0 ${INK}` } : undefined}>
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
            <ul>
              {cur.items.map((it) => (
                <li key={it}>
                  <span>✦</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <div className="ly-demo" aria-hidden="true">
            {room === 0 ? (
              <div className="ly-board">
                {(
                  [
                    ["ITERATION 1", [["Cart", 0], ["Pay", 1]]],
                    ["ITERATION 2", [["API", 2]]],
                    ["ITERATION 3", [["Index", 3], ["Gate", 0]]],
                  ] as [string, [string, number][]][]
                ).map(([t, notes], i) => (
                  <div key={t} className="ly-col">
                    <div className="t">{t}</div>
                    {notes.map(([n, c], j) => (
                      <div key={n} className="ly-sticky" style={{ background: STICKY[c], animationDelay: `${(i + j) * 0.4}s` }}>
                        {n}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : room === 1 ? (
              <div className="ly-join">
                <div className="tag">BOARD LINK · agileagilist.com/boards/vs-loan</div>
                {roster.map((r) => (
                  <div key={r.n} className="r" style={{ background: r.c, animationDelay: r.d }}>
                    <b>{r.n}</b>
                    <span>on the board ✓</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ly-bigring">
                <Ring size={270} r={88} stroke={14} color="#ff3d8f" track="#14123a26" value={0.05 + ready.share * 0.3}>
                  <div className="c">
                    <div className="n">{Math.round((0.05 + ready.share * 0.3) * 100)}%</div>
                    <div className="tag">FLOW EFFICIENCY</div>
                  </div>
                </Ring>
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
        <h2 className="h2">How the PI planning tools differ.</h2>
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

      <section id="pricing">
        <div className="eyebrow">04 / PRICING</div>
        <h2 className="h2">Priced per trainer and per train, never per person in the room.</h2>
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
              <div key={p.id} className="ly-plan" style={{ background: p.bg, color: p.fg, transform: `rotate(${["-1.5deg", "0deg", "1.5deg"][i]})` }}>
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
          Every paid plan starts with a <strong>free 14-day trial</strong>, then month by month: no card charge today, no yearly commitment to begin. Not satisfied in your first paid month? <strong>Money back</strong>, claimed by you from Plan &amp; billing, no questions asked. Yearly billing (ten months for twelve) is a switch you make after the first month. Prices in USD, before tax. Portfolios with more than ten trains, on-premises support agreements and public-sector terms: talk to us.
        </p>
      </section>

      <section id="faq" className="ly-faq">
        <div className="head">
          <div className="eyebrow">05 / ASK THE ROOM</div>
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
            <div className="eyebrow">06 / JOIN</div>
            <h2>
              Your class starts at <span className="chip">00:00</span>.
            </h2>
            <p>Tell us who you are and which plan fits. Practice is ready at once. Trainer and Academy start with a free 14-day trial, month by month, with a money-back guarantee on the first paid month.</p>
          </div>
          <SignupForm plan={plan} setPlan={setPlan} audience={aud} yearly={yearly} />
        </div>
      </section>

      <footer className="ly-foot">
        <div className="giant">Class dismissed.</div>
        <div className="meta">
          <span>Trainyard · Apache-2.0 · built by Agile Agilist</span>
          <span>
            <Link href="/pricing">Pricing</Link> · <Link href="/classes">Classes</Link> · <Link href="/guides">Guides</Link> · <Link href="/compare">Compare</Link> · <a href="/llms.txt">llms.txt</a> · <Link href="/login">Sign in</Link> ·{" "}
            <a href={REPO_URL} rel="noopener">
              Source
            </a>
          </span>
        </div>
        <p className="legal">SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Jira is a trademark of Atlassian. Azure DevOps is a trademark of Microsoft. Trainyard is not affiliated with them.</p>
      </footer>
    </div>
  );
}

type BillingConfig = { enabled: boolean; inPage: boolean; publishableKey?: string; plans: Record<string, boolean>; trialDays: number; guaranteeDays?: number };

function SignupForm({ plan, setPlan, audience, yearly }: { plan: PlanId; setPlan: (p: PlanId) => void; audience: Audience; yearly: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    const unit = plan === "academy" ? "train" : "trainer";
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
                    Your <strong>Practice</strong> workspace is ready: one room, up to 5 people, free. This is your sign-in key; it is shown once, so keep it in a password manager.
                  </>
                ) : (
                  <>
                    Your <strong>{def.name}</strong> subscription is active. This is your sign-in key; it is shown once, so keep it in a password manager. A receipt from Stripe is on its way to {done.email}.
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
              {plan === "academy" ? "Trains" : "Trainers"}
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
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>We use your email to send the sign-in and nothing else. No newsletter, no resale.</p>
      </form>
    </div>
  );
}
