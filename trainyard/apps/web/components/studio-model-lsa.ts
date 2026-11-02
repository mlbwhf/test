// What the Leading SAFe boards show and do, ported from the design's logic (Trainyard Class
// Studio.dc.html, renderVals and xtra, multi-class release) so the generated layouts in
// studio-views-lsa.tsx behave exactly as designed. As in studio-model.ts, the class shares one
// state per exercise (the frame's state, changed one op at a time); a person's own view choices
// (the selected card, the viewed team, a picked principle) stay local.

import type { StateOp } from "@trainyard/core";
import type { StudioCtx } from "./studio-model";
import { STK } from "./studio-model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Op = (c: StateOp) => void;
type Item = { id: string; [k: string]: any };
type Key = React.KeyboardEvent<HTMLInputElement>;
type Ev = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type Blur = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;
type Drag = React.DragEvent;

const ROT = ["-1.5deg", "1deg", "-.5deg", "1.8deg"];
const A = "/courses/lsa/";
/** A 1×1 transparent image, so a hidden <img> never asks for the page itself. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

/** The Leading SAFe board kinds drawn from the design (the PI simulation's five views share one board). */
export const LSA_KINDS = new Set(["vote", "vsid", "delay", "prin", "sbd", "dec", "emp", "feat", "wsjf", "rse", "cap", "attr", "ov", "pib", "pcs", "ppr", "pbv", "prm"]);

// ---- the design's data ---------------------------------------------------------------------
const BPC: [number, string, string, string, string, string][] = [[1, "Why SAFe", "Business agility in the digital age. The case for change, from the customer and business value back to how we work.", "80%", "40%", "#cde0f2"], [2, "Leadership mindset", "Leaders start by adopting the Lean-Agile mindset, values and principles that everything else stands on.", "14%", "91%", "#cfe8d4"], [3, "Team and technical agility", "Agile Teams and sound technical practices deliver working increments every iteration.", "29%", "52%", "#f6b9ae"], [4, "Product development flow", "The Agile Release Train plans, builds and releases together along the continuous delivery pipeline.", "49%", "63%", "#d9cdf0"], [5, "Lean Portfolio Management", "Strategy, funding and governance connect the portfolio to the value streams.", "33%", "17%", "#f0d9a8"], [6, "Leading the change", "Back to leadership: the responsibility leaders carry toward the change, leading by example.", "15%", "19%", "#e6d3f0"]];
const LK: Record<number, string> = { 1: "Everything starts with a reason: the customer and the business value we must deliver.", 2: "From why to who: before anything else changes, leaders adopt the Lean-Agile mindset.", 3: "Mindset becomes practice: teams build the team and technical agility to deliver value.", 4: "Teams do not work alone: they align on one Agile Release Train and a shared flow of value.", 5: "Flow needs direction and funding: Lean Portfolio Management feeds and governs the trains.", 6: "Back to leadership: leaders carry the change and lead by example." };
const AT = [["Insatiable learning", "Keeps learning and unlearning, treats failure as data, and stays curious about what is next."], ["Authenticity", "Acts in line with stated values. Honest, transparent and consistent in word and deed."], ["Emotional competence", "Recognizes and manages their own emotions and responds with empathy to others."], ["Courage", "Speaks up, takes principled risks and makes the hard decisions."], ["Growing others", "Coaches and mentors, and invests in the growth and success of other people."], ["Decentralized decision-making", "Pushes decisions to the people closest to the information and the work."]];
const SK: [string, string][] = [["Option", "#ffd37a"], ["Milestone", "#cde0f2"], ["Decision point", "#f6b9ae"]];
const PSH = ["Customer satisfaction", "Welcome change", "Deliver frequently", "Business and developers together", "Motivated individuals", "Face-to-face conversation", "Working software", "Sustainable pace", "Technical excellence", "Simplicity", "Self-organizing teams", "Reflect and adjust"];
const PF = ["Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.", "Welcome changing requirements, even late in development. Agile processes harness change for the customer’s competitive advantage.", "Deliver working software frequently, from a couple of weeks to a couple of months, with a preference to the shorter timescale.", "Business people and developers must work together daily throughout the project.", "Build projects around motivated individuals. Give them the environment and support they need, and trust them to get the job done.", "The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.", "Working software is the primary measure of progress.", "Agile processes promote sustainable development. The sponsors, developers, and users should be able to maintain a constant pace indefinitely.", "Continuous attention to technical excellence and good design enhances agility.", "Simplicity, the art of maximizing the amount of work not done, is essential.", "The best architectures, requirements, and designs emerge from self-organizing teams.", "At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly."];
const PL: [string, string, string][] = [["Not applicable at scale", "#e7e2d6", "Holds, but nothing special at scale"], ["Works as is at scale", "#cfe8d4", "Same wording, same practice"], ["Requires rethinking for scale", "#f6b9ae", "Needs a new practice or structure"]];
const EK: [string, string, string, string][] = [["who", "WHO are we empathizing with?", "Who is the person we want to understand? What is the situation they are in? What is their role in the situation?", "#cde0f2"], ["goal", "What do they need to DO?", "What do they need to do differently? What job(s) do they want or need to get done? What decision(s) do they need to make? How will we know they were successful?", "#cfe8d4"], ["see", "SEE", "What do they see in the marketplace and in their immediate environment? What do they see others saying and doing? What are they watching and reading?", "#d9cdf0"], ["hear", "HEAR", "What are they hearing others say? From friends? From colleagues? Second-hand?", "#f0d9a8"], ["say", "SAY", "What have we heard them say? What can we imagine them saying?", "#ffd37a"], ["does", "DO", "What do they do today? What behavior have we observed? What can we imagine them doing?", "#f6b9ae"], ["think", "THINK & FEEL", "What other thoughts and feelings might motivate their behavior?", "#fffaf0"], ["pain", "PAINS", "Fears, frustrations and anxieties.", "#f6b9ae"], ["gain", "GAINS", "Wants, needs, hopes and dreams.", "#cfe8d4"]];
const VD: [string, string][] = [["Lean Portfolio Management", "lpm"], ["Team and Technical Agility", "team"], ["Product Development Flow", "flow"], ["Large Solution Integration and Delivery", "sol"], ["Leadership and Culture", "lead"]];
const DIS = [{ t: "Lean Portfolio Management", img: A + "disc-lpm.png", d: "Aligns strategy, funding and governance so investment flows to the work that creates the most value." }, { t: "Team and Technical Agility", img: A + "disc-team.png", d: "Builds high-performing, cross-functional teams that apply Agile and technical practices to deliver quality." }, { t: "Product Development Flow", img: A + "disc-flow.png", d: "Optimizes the flow of value from idea to customer, from discovery through delivery and release." }, { t: "Large Solution Integration and Delivery", img: A + "disc-sol.png", d: "Coordinates many teams and suppliers to build, integrate and deliver large, complex solutions." }, { t: "Leadership and Culture", img: A + "disc-lead.png", d: "Leaders model the mindset, values and principles that make the whole system work." }];
const DP: [number, number, number][] = [[17, 22, -2], [83, 22, 1.5], [88, 66, -1.5], [50, 88, 1], [12, 66, 2]];
const LESSON_COLORS = ["#cde0f2", "#cfe8d4", "#f6b9ae", "#d9cdf0", "#f0d9a8", "#e6d3f0"];
const FIB = ["1", "2", "3", "5", "8", "13", "20"];
const ANIM: [string, string][] = [["chicken", "Chicken"], ["horse", "Horse"], ["croc", "Crocodile"], ["giraffe", "Giraffe"], ["gorilla", "Gorilla"], ["hyena", "Hyena"], ["elephant", "Elephant"]];
const DECK = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100", "∞", "?"];
const RISKS = ["Team member X is a bottleneck. They are the only one who can handle critical parts of the implementation for an important Feature that is scheduled for delivery in the Iteration.", "No system team is available yet. The integration infrastructure is in poor condition and could put the integration and/or the System Demo at risk.", "Two teams have a shared Product Owner. This might have a negative impact on the team’s Iteration Planning and demos.", "The QA team is pointing out that application performance might be at risk during Iteration 3, as there will be an influx of new users. They are unsure how this might impact the ART.", "In Iteration 3, an important supplier might be delayed with their crucial delivery. They have been late before, and this time it might impact several teams.", "There is a holiday mid-PI, and many people will be on vacation."];
const PIT: [string, string][] = [["Team 1", "#cde0f2"], ["Team 2", "#cfe8d4"], ["Team 3", "#f6b9ae"], ["Team 4", "#d9cdf0"], ["Team 5", "#f0d9a8"], ["Team 6", "#c9e07a"], ["Team 7", "#ffd37a"], ["Team 8", "#e6d3f0"]];
const PIQ = ["Have you identified the capacity for each Iteration of the PI?", "Have you identified most of the Stories for the first two Iterations and begun estimating?", "Have you begun resolving dependencies with other teams?", "Are you discussing tradeoffs and conflicting priorities with your Business Owners?", "Have you identified any ART PI Risks?", "Will you be ready to start writing PI Objectives in the next 15 minutes?", "Is there anything you need to discuss with other Scrum Masters/Team Coaches? If so, stay for the meet-after."];
type Story = [string, string, number, "G" | "P" | "Y"];
type Sim = { n: string; d: string; f: { t: string; s: Story[] }[] };
const PIS: Record<string, Sim> = {
  alice: { n: "ALICE", d: "Autonomous delivery vehicle", f: [{ t: "Show routing calculations between the five most frequent destinations", s: [["Store the top five destinations", "As a dispatcher, I want the five most frequent destinations stored so routes can be pre-computed.", 3, "G"], ["Calculate the shortest route", "Given two stops, return distance and ETA using the road graph.", 5, "G"], ["Display routes in the ops console", "Show all five routes with distance and ETA on one screen.", 2, "G"]] }, { t: "Navigate autonomously from the distribution center to the most frequent destination", s: [["Keep the lane along the route", "The vehicle follows the planned path within the lane without manual input.", 8, "G"], ["Detect obstacles and stop", "Stop safely when an obstacle is detected within braking distance.", 5, "G"], ["Signal arrival at the destination", "Notify the dispatcher and customer when the vehicle arrives.", 3, "G"]] }, { t: "Parallel park for a delivery", s: [["Detect a free parking space", "Identify a space long enough for the vehicle using side sensors.", 5, "G"], ["Run the park-assist maneuver", "Execute the parallel park sequence within 30 cm of the curb.", 8, "G"], ["Upgrade sensor firmware", "Maintenance: update proximity sensor firmware before field tests.", 3, "P"]] }, { t: "Return to the distribution center after delivery", s: [["Resume the route after drop-off", "After the customer confirms the delivery, plan the way back automatically.", 3, "G"], ["Run the depot gate sequence", "Authenticate and enter the depot gate without stopping traffic.", 5, "G"], ["Check battery before returning", "Warn the dispatcher if the charge is too low to complete the return trip.", 2, "G"]] }, { t: "Include traffic data in route planning", s: [["Ingest the live traffic feed", "Pull congestion data every minute from the traffic provider.", 5, "G"], ["Weight route cost by congestion", "Prefer a longer but faster road when congestion crosses a threshold.", 5, "G"], ["Fall back when the feed is down", "Use historical averages if the live feed is unavailable.", 3, "G"]] }, { t: "Recall a delivery that is already in progress", s: [["Send a recall command", "A dispatcher can recall a vehicle from the console.", 3, "G"], ["Pull over safely", "The vehicle finds a safe stopping point before turning around.", 5, "G"], ["Reroute to the depot", "Plan the quickest way back to the distribution center.", 3, "G"]] }, { t: "Spike: reduce GPS signal loss by 25%", s: [["Measure current GPS signal loss", "Log dropouts over one week of test drives to set the baseline.", 2, "Y"], ["Evaluate dead reckoning", "Test whether wheel odometry fills short GPS gaps accurately.", 3, "Y"], ["Prototype antenna placement", "Compare three antenna positions on the roof.", 5, "Y"]] }, { t: "Demonstrate real-time rerouting around delays", s: [["Detect a delay event", "Recognize an accident or road closure from the traffic feed.", 3, "G"], ["Recompute the route mid-trip", "Switch to a better route without stopping the vehicle.", 8, "G"], ["Notify the dispatcher of the change", "Send the new ETA and reason to the console.", 2, "G"]] }] },
  geek: { n: "GeekBooks", d: "Online bookstore (placeholder features)", f: [{ t: "Search and browse the catalog", s: [["Keyword search", "As a reader, I want to search by title, author or ISBN so I can find a book quickly.", 5, "G"], ["Filter by genre and price", "Narrow results with genre and price range filters.", 3, "G"], ["Paginate the results", "Show 20 results per page with page controls.", 2, "G"]] }, { t: "Personalized book recommendations", s: [["Capture browsing history", "Record the books a reader views, with consent.", 3, "G"], ["Rank the recommendation list", "Score books by similarity to history and purchases.", 8, "G"], ["Show recommendations on the home page", 'Display a "You may like" row for signed-in readers.', 3, "G"]] }, { t: "One-click checkout", s: [["Save a payment method", "Let a reader store a card securely for later orders.", 5, "G"], ["Add the one-click order button", "Place an order with the saved card and address in one tap.", 3, "G"], ["Send the confirmation email", "Email an order summary within a minute of purchase.", 2, "G"]] }, { t: "Gift cards and vouchers", s: [["Issue a gift card code", "Generate a unique code for a chosen amount.", 5, "G"], ["Redeem at checkout", "Apply a code to the order total.", 5, "G"], ["Look up the balance", "Show the remaining balance for a code.", 2, "G"]] }, { t: "Reader reviews and ratings", s: [["Submit a review", "Verified buyers can add a rating and text.", 3, "G"], ["Show the star-rating summary", "Display the average rating and a histogram.", 3, "G"], ["Moderate flagged reviews", "Staff can hide reviews that break the rules.", 5, "P"]] }, { t: "Wishlists and reading lists", s: [["Add a book to a wishlist", "One tap from any book page.", 2, "G"], ["Share a list", "Create a public link to a reading list.", 3, "G"], ["Price-drop alert", "Notify the reader when a wishlist book gets cheaper.", 5, "G"]] }, { t: "Order tracking", s: [["Order status page", "Show placed, packed, shipped and delivered states.", 3, "G"], ["Integrate carrier tracking", "Pull tracking events from the carrier API.", 8, "G"], ["Delivery notifications", "Push or email when the parcel is out for delivery.", 3, "G"]] }, { t: "Returns and refunds portal", s: [["Start a return", "Pick the item and reason within 30 days.", 3, "G"], ["Print the return label", "Generate a prepaid label as a PDF.", 3, "G"], ["Issue the refund", "Refund the original payment method once the parcel arrives.", 5, "G"]] }] },
};
const TC: Record<string, [string, string]> = { G: ["#c9e07a", "#7a9a1c"], P: ["#d4a6e2", "#8b3fa0"], Y: ["#ffd95a", "#c79a00"] };
const ROAMS: [string, string, string, string][] = [["R", "Resolved", "Has been addressed. No longer a concern.", "#cfe8d4"], ["O", "Owned", "Someone has taken responsibility.", "#cde0f2"], ["A", "Accepted", "Nothing more can be done. If the risk occurs, the release may be compromised.", "#ffd37a"], ["M", "Mitigated", "The team has plans to adjust as necessary.", "#d9cdf0"]];
const SYC: Record<string, [string, string]> = { y: ["#cfe8d4", "Yes"], p: ["#ffd37a", "Partly"], n: ["#f6b9ae", "No"] };

// ---- PI simulation state -----------------------------------------------------------------
type PiStory = { id: string; t: string; type: "G" | "P" | "Y"; pts: number; it: number };
type PiObj = { id: string; t: string; bv: number | null; u: boolean };
type PiRisk = { id: string; t: string; roam: string | null };
type PiTeam = { cap: [number, number]; st: PiStory[]; pl: Record<string, number>; pe: Record<string, number>; ob: PiObj[]; rk: PiRisk[]; sy: Record<string, string> };
type PiMeta = { sim: string | null; fa: (number | null)[] | null; pres: number };
type Groups = { n: number; roster: string[]; mode: "auto" | "manual"; man: Record<string, number>; seed: number };
const piBlank = (): PiTeam => ({ cap: [40, 40], st: [], pl: {}, pe: {}, ob: [], rk: [], sy: {} });
const uid = () => Math.random().toString(36).slice(2, 8);
/** The drag source, one per browser (the design kept it on the component instance). */
let drag: { k: string; id: string | number } | null = null;
/** Autoplay of the Big Picture story, per board. */
const bpTimers = new Map<string, ReturnType<typeof setInterval>>();
/** Who is voting from this browser: a random id kept here, never a name. */
function voter(): string {
  try {
    let v = localStorage.getItem("trainyard.voter");
    if (!v) localStorage.setItem("trainyard.voter", (v = uid() + uid()));
    return v;
  } catch {
    return "anon";
  }
}
function shuffle<T>(arr: T[], seed: number): T[] {
  let x = seed * 9301 + 49297;
  const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function lsaModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi } = c;
  const op: Op = (x) => (c.readOnly ? undefined : c.op(x));
  const list = <T = Item>(k: string): T[] => (Array.isArray(S[k]) ? (S[k] as T[]) : []);
  const str = (k: string) => (typeof S[k] === "string" ? (S[k] as string) : "");
  const obj = <T>(k: string, d: T): T => (S[k] && typeof S[k] === "object" && !Array.isArray(S[k]) ? ({ ...d, ...(S[k] as object) } as T) : d);
  const set = (k: string, v: unknown) => op({ key: k, op: "set", value: v ?? null });
  const stkOf = (k: string) => list<Item>(k).map((x, j) => ({ t: x.text, c: STK[j % 4], rot: ROT[j % 4] }));
  const push = (k: string) => (e: Key) => {
    const t = e.currentTarget;
    if (e.key === "Enter" && t.value.trim()) {
      const v = t.value.trim();
      t.value = "";
      op({ key: k, op: "push", value: { text: v } });
    }
  };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const ovr = (e: Drag) => e.preventDefault();
  const steps = (c.frame.activity?.steps ?? "").split("\n").filter(Boolean).map((x, i) => {
    const m = /^Step\s*\d+:\s*(.*)$/.exec(x);
    return { n: `Step ${i + 1}:`, t: m ? m[1] : x };
  });
  const v: Record<string, any> = { ex: { prompt: cfg.prompt ?? "" }, steps, stk: stkOf("stk"), addStk: push("stk"), addPh: "Add a sticky, press Enter" };

  if (c.kind === "vote") {
    const me = voter();
    const votes = list<Item>("votes");
    const mine = votes.find((x) => x.voter === me);
    const total = votes.length;
    v.vote = {
      items: VD.map((d, i) => {
        const n = votes.filter((x) => x.d === i).length;
        const on = mine?.d === i;
        return { t: d[0], img: `${A}disc-${d[1]}.png`, n, lab: n === 1 ? "vote" : "votes", w: (total ? Math.round((n / total) * 100) : 0) + "%", on, bg: on ? "#ffd37a" : "#fffaf0", sh: on ? "4px 4px 0 #0d1815" : "2px 2px 0 #0d1815", go: () => {
          if (mine) op({ key: "votes", op: "remove", id: mine.id });
          if (!on) op({ key: "votes", op: "push", value: { voter: me, d: i } });
        } };
      }),
    };
  }

  // ---- value stream (vsid) and its delays (delay): one shared board
  const vsd = obj<{ trig: string; steps: { id: string; t: string }[] }>("vs", { trig: "Trigger", steps: ["Define", "Build", "Validate", "Release"].map((n, i) => ({ id: "d" + i, t: n })) });
  if (c.kind === "vsid") {
    const setVsd = (p: Partial<typeof vsd>) => set("vs", { ...vsd, ...p });
    v.vsid = {
      trig: vsd.trig, saveTrig: (e: Blur) => setVsd({ trig: e.target.value }), add: () => setVsd({ steps: [...vsd.steps, { id: "n" + Date.now().toString(36), t: "New step" }] }),
      steps: vsd.steps.map((x, i) => ({
        id: x.id, t: x.t, bg: ui.vdrag === i ? "#c3d4d1" : "#dbe6e4",
        save: (e: Blur) => setVsd({ steps: vsd.steps.map((y) => (y.id === x.id ? { ...y, t: e.target.value } : y)) }),
        del: () => setVsd({ steps: vsd.steps.filter((y) => y.id !== x.id) }),
        dragStart: (e: Drag) => { drag = { k: "vs", id: i }; setUi({ vdrag: i }); try { e.dataTransfer.setData("text/plain", String(i)); } catch { /* some browsers */ } },
        over: ovr,
        drop: (e: Drag) => { e.preventDefault(); const f = drag?.k === "vs" ? (drag.id as number) : null; drag = null; setUi({ vdrag: null }); if (f == null || f === i) return; const a = vsd.steps.slice(); const [m] = a.splice(f, 1); a.splice(i, 0, m!); setVsd({ steps: a }); },
      })),
    };
  }
  if (c.kind === "delay") {
    const d = (id: string) => obj<{ w: string; c: string }>(`dly:${id}`, { w: "", c: "" });
    v.delay = {
      trig: vsd.trig,
      chev: vsd.steps.map((x, i) => ({ t: x.t, gap: i < vsd.steps.length - 1, w: d(x.id).w || "•••" })),
      gaps: vsd.steps.slice(0, -1).map((x, i) => ({ id: x.id, title: `${x.t} → ${vsd.steps[i + 1]!.t}`, w: d(x.id).w, c: d(x.id).c, sw: (e: Blur) => set(`dly:${x.id}`, { ...d(x.id), w: e.target.value }), sc: (e: Blur) => set(`dly:${x.id}`, { ...d(x.id), c: e.target.value }) })),
    };
  }

  if (c.kind === "prin") {
    const rate = (i: number) => str(`prin:${i}`);
    const psel: number | null = ui.prinSel ?? null;
    const setR = (i: number, lane: string) => set(`prin:${i}`, lane || null);
    const card = (i: number) => ({ n: i + 1, t: PSH[i], bg: psel === i ? "#ffb627" : "#fff", sh: psel === i ? "3px 3px 0 #0d1815" : "1.5px 1.5px 0 #0d1815", go: (e: React.MouseEvent) => { e.stopPropagation(); setUi({ prinSel: psel === i ? null : i }); }, ds: (e: Drag) => { drag = { k: "pr", id: i }; setUi({ prinSel: i }); try { e.dataTransfer.setData("text/plain", String(i)); } catch { /* ignore */ } } });
    const zone = (lane: string) => ({ ov: ovr, drop: (e: Drag) => { e.preventDefault(); if (drag?.k === "pr") setR(drag.id as number, lane); drag = null; }, put: () => { if (psel != null) { setR(psel, lane); setUi({ prinSel: null }); } } });
    const idx = PSH.map((_, i) => i);
    v.pr2 = {
      full: psel != null ? `${psel + 1}. ${PF[psel]}` : "Pick a principle, then tap a lane. Or drag it there.",
      tray: idx.filter((i) => !rate(i)).map(card), trayZ: zone(""), trayN: idx.filter((i) => !rate(i)).length,
      lanes: PL.map((l) => ({ t: l[0], bg: l[1], d: l[2], n: idx.filter((i) => rate(i) === l[0]).length, cards: idx.filter((i) => rate(i) === l[0]).map(card), ...zone(l[0]) })),
    };
  }

  if (c.kind === "sbd") {
    const sk2: number = ui.sbdK ?? 0;
    const pins = list<Item>("sbdP");
    v.sbd = {
      kinds: SK.map((k, i) => ({ t: k[0], dot: k[1], bg: i === sk2 ? k[1] : "#fffaf0", sh: i === sk2 ? "3px 3px 0 #0d1815" : "none", go: () => setUi({ sbdK: i }) })),
      place: (e: React.MouseEvent) => { const r = (e.currentTarget as Element).getBoundingClientRect(); const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10; op({ key: "sbdP", op: "push", value: { x, y, k: sk2, t: "" } }); },
      clear: () => pins.forEach((p) => op({ key: "sbdP", op: "remove", id: p.id })), n: pins.length,
      pins: pins.map((p) => ({ key: "sp" + p.id, x: p.x + "%", y: p.y + "%", tx: p.x > 68 ? "translateX(-100%)" : "none", bg: SK[p.k]![1], k: SK[p.k]![0], v: p.t, stop, save: (e: Blur) => op({ key: "sbdP", op: "update", id: p.id, value: { t: e.target.value } }), del: (e: React.MouseEvent) => { e.stopPropagation(); op({ key: "sbdP", op: "remove", id: p.id }); } })),
    };
  }

  if (c.kind === "dec") {
    type Row = { n?: string; f?: string; t?: string; e?: string };
    const rows = (Array.isArray(S.dec) ? (S.dec as Row[]) : [{}, {}, {}]);
    const setDec = (r: Row[]) => set("dec", r);
    const opts = (val: string) => ["0", "1", "2"].map((o) => ({ o, sel: val === o }));
    v.dec = {
      cols: [["Frequent?", "Y=2  N=0"], ["Time-critical?", "Y=2  N=0"], ["Economies of scale?", "Y=0  N=2"]].map((x) => ({ a: x[0], b: x[1] })),
      rows: rows.map((r, i) => {
        const keys = ["f", "t", "e"] as const;
        const rated = keys.every((k) => r[k] != null && r[k] !== ""), tot = keys.reduce((a, k) => a + (+(r[k] ?? 0) || 0), 0);
        const up = (p: Row) => setDec(rows.map((x, j) => (j === i ? { ...x, ...p } : x)));
        return { key: "d" + i, name: r.n ?? "", saveName: (e: Blur) => up({ n: e.target.value }), cells: keys.map((k) => ({ val: r[k] ?? "", opts: opts(r[k] ?? ""), blank: r[k] == null || r[k] === "", set: (e: Ev) => up({ [k]: e.target.value }) })), total: rated ? String(tot) : "—", verdict: rated ? (tot <= 3 ? "Centralize" : "Decentralize") : "Rate all three", bg: !rated ? "#f3ead3" : tot <= 3 ? "#cde0f2" : "#cfe8d4", del: () => setDec(rows.filter((_, j) => j !== i)) };
      }),
      add: () => setDec([...rows, {}]),
    };
  }

  if (c.kind === "emp") {
    const cell = (k: string, pad: string, rad: string, mh: string) => { const e = EK.find((x) => x[0] === k)!; return { key: k, label: e[1], hint: e[2], bg: e[3], pad, rad, mh, list: stkOf(`em:${k}`).map((x) => ({ t: x.t })), add: push(`em:${k}`) }; };
    v.em2 = {
      who: str("who"), saveWho: (e: Blur) => set("who", e.target.value || null),
      top: [cell("who", "12px 14px", "10px", "120px"), cell("goal", "12px 14px", "10px", "120px")],
      mid: [cell("see", "12px 22% 14px 14px", "10px", "210px"), cell("hear", "12px 14px 14px 22%", "10px", "210px"), cell("say", "12px 22% 14px 14px", "10px", "210px"), cell("does", "12px 14px 14px 22%", "10px", "210px")],
      think: [cell("think", "12px 16px", "50%", "150px")], bot: [cell("pain", "12px 14px", "10px", "110px"), cell("gain", "12px 14px", "10px", "110px")],
    };
  }

  // ---- features (feat) and their WSJF (wsjf): one shared board
  type Feat = { t?: string; h?: string; a?: string };
  const feats = (Array.isArray(S.feat) ? (S.feat as Feat[]) : [{}, {}, {}]);
  if (c.kind === "feat") {
    const setFeat = (i: number, p: Feat) => set("feat", feats.map((x, j) => (j === i ? { ...x, ...p } : x)));
    v.feat = { cards: feats.map((f, i) => ({ key: "f" + i, n: String(i + 1), t: f.t ?? "", h: f.h ?? "", a: f.a ?? "", st: (e: Blur) => setFeat(i, { t: e.target.value }), sh: (e: Blur) => setFeat(i, { h: e.target.value }), sa: (e: Blur) => setFeat(i, { a: e.target.value }) })) };
  }
  if (c.kind === "wsjf") {
    type W = { u?: string; t?: string; r?: string; j?: string };
    const rows = (Array.isArray(S.wsjf) ? (S.wsjf as W[]) : [{}, {}, {}]);
    const setWs = (i: number, p: W) => set("wsjf", rows.map((x, j) => (j === i ? { ...x, ...p } : x)));
    const calc = rows.map((r) => { const ok3 = r.u && r.t && r.r; const cod = ok3 ? +r.u! + +r.t! + +r.r! : null; const w = cod != null && r.j ? cod / +r.j : null; return { cod, w }; });
    const sorted = calc.map((x) => x.w).filter((w): w is number => w != null).sort((a, b) => b - a);
    const cell = (i: number, k: keyof W) => ({ val: rows[i]![k] ?? "", opts: FIB.map((o) => ({ o, sel: rows[i]![k] === o })), blank: !rows[i]![k], set: (e: Ev) => setWs(i, { [k]: e.target.value }) });
    v.wsjf = { rows: rows.map((_, i) => ({ key: "w" + i, name: feats[i]?.t || `Feature ${i + 1}`, u: cell(i, "u"), t: cell(i, "t"), rr: cell(i, "r"), j: cell(i, "j"), cod: calc[i]!.cod != null ? String(calc[i]!.cod) : "—", wsjf: calc[i]!.w != null ? String(Math.round(calc[i]!.w! * 10) / 10) : "—", rank: calc[i]!.w != null ? "#" + (sorted.indexOf(calc[i]!.w!) + 1) : "", bg: calc[i]!.w != null && sorted.indexOf(calc[i]!.w!) === 0 ? "#cfe8d4" : "#f2f2f2" })) };
  }

  if (c.kind === "rse") {
    const map = obj<Record<string, string>>("rse", {});
    const sel: string | null = ui.rseSel ?? null;
    const num = (x: string) => (x === "∞" || x === "?" ? 9999 : +x);
    v.rse = {
      deck: DECK.map((d) => { const used = Object.values(map).includes(d), on = sel === d; return { v: d, bg: on ? "#ffb627" : "#fffaf0", sh: on ? "4px 4px 0 #0d1815" : "2px 2px 0 #0d1815", ty: on ? "-6px" : "0px", op: used && !on ? 0.5 : 1, go: () => setUi({ rseSel: on ? null : d }) }; }),
      hasSel: !!sel, hint: sel ? `Card ${sel} selected. Click an animal to give it to them.` : "Pick a card from the deck, then click an animal.",
      animals: ANIM.map((a) => { const val = map[a[0]]; return { img: `${A}animal-${a[0]}.png`, name: a[1], v: val ?? "", has: !!val, bg: val ? "#ffd37a" : "#fffaf0", go: () => { const m = { ...map }; if (sel) { m[a[0]] = sel; set("rse", m); setUi({ rseSel: null }); } else { delete m[a[0]]; set("rse", m); } } }; }),
      order: ANIM.filter((a) => map[a[0]]).sort((x, y) => num(map[x[0]]!) - num(map[y[0]]!)).map((a) => `${a[1]} ${map[a[0]]}`).join("  <  "),
    };
  }

  if (c.kind === "cap") {
    type CRow = { r: string; n: number; a: number; on: boolean };
    const cap = obj<{ rows: CRow[]; vac: number }>("cap", { rows: [{ r: "Developers", n: 3, a: 100, on: true }, { r: "Testers", n: 2, a: 100, on: true }, { r: "Product Owner", n: 1, a: 100, on: false }, { r: "Scrum Master / Team Coach", n: 1, a: 100, on: false }], vac: 0 });
    const setCap = (p: Partial<typeof cap>) => set("cap", { ...cap, ...p });
    const upRow = (i: number, p: Partial<CRow>) => setCap({ rows: cap.rows.map((x, j) => (j === i ? { ...x, ...p } : x)) });
    const pts = (r: CRow) => (r.on ? Math.round((+r.n || 0) * 8 * (+r.a || 0)) / 100 : 0);
    const gross = cap.rows.reduce((a, r) => a + pts(r), 0);
    v.cap = {
      rows: cap.rows.map((r, i) => ({ key: "c" + i, role: r.r, saveRole: (e: Blur) => upRow(i, { r: e.target.value }), n: String(r.n), saveN: (e: Blur) => upRow(i, { n: +e.target.value || 0 }), a: String(r.a), aOpts: ["100", "75", "50", "25"].map((o) => ({ o, v: o, sel: String(r.a) === o })), setA: (e: Ev) => upRow(i, { a: +e.target.value }), on: r.on ? "y" : "n", onOpts: [{ o: "Yes", v: "y", sel: r.on }, { o: "No", v: "n", sel: !r.on }], setOn: (e: Ev) => upRow(i, { on: e.target.value === "y" }), pts: String(pts(r)), dim: r.on ? "1" : ".45", del: () => setCap({ rows: cap.rows.filter((_, j) => j !== i) }) })),
      add: () => setCap({ rows: [...cap.rows, { r: "Team member", n: 1, a: 100, on: true }] }), vac: String(cap.vac || 0), saveVac: (e: Blur) => setCap({ vac: +e.target.value || 0 }), gross: String(Math.round(gross * 10) / 10), total: String(Math.max(0, Math.round((gross - (cap.vac || 0)) * 10) / 10)),
    };
  }

  if (c.kind === "attr") {
    const at = obj<{ sel: number[]; txt: Record<string, string> }>("at", { sel: [], txt: {} });
    v.at = {
      cards: AT.map((a, i) => { const on = at.sel.includes(i); return { t: a[0], d: a[1], bg: on ? "#ffd37a" : "#fffaf0", sh: on ? "4px 4px 0 #0d1815" : "2px 2px 0 #0d1815", mark: on ? "FOCUS" : "", go: () => set("at", { ...at, sel: on ? at.sel.filter((k) => k !== i) : at.sel.concat([i]).slice(-2) }) }; }),
      picks: at.sel.map((i) => ({ key: "at" + i, t: AT[i]![0], v: at.txt[i] ?? "", save: (e: Blur) => set("at", { ...at, txt: { ...at.txt, [i]: e.target.value } }) })),
      hint: at.sel.length ? "Write the potential impact of each focus attribute in your context." : "Pick one or two attributes to focus on.",
    };
  }

  if (c.kind === "ov") {
    v.view = cfg.view ?? "dis";
    // The chapters of this class, from its lesson frames (the Welcome lesson is not a chapter).
    const lessons = c.board.frames.filter((f) => !f.parentId && /^Lesson\s+\d+:/i.test(f.title)).sort((x, y) => x.y - y.y).slice(1);
    v.ov = { chs: lessons.map((l, i) => ({ n: String(i + 1).padStart(2, "0"), t: l.title.replace(/^Lesson\s+\d+:\s*/i, ""), bg: LESSON_COLORS[i % 6] })) };
    const dI: number = ui.disI ?? 0, dN = DIS.length, dAct = dI - 1;
    v.dsk = {
      n: dI, go: (i: number) => setUi({ disI: i }), next: () => setUi({ disI: Math.min(dN, dI + 1) }), back: () => setUi({ disI: Math.max(0, dI - 1) }), all: () => setUi({ disI: dN }), reset: () => setUi({ disI: 0 }),
      nextL: dI === 0 ? "Start: first discipline" : dI >= dN ? "All five shown" : "Next discipline", canBack: dI > 0 ? 1 : 0.4, canNext: dI >= dN ? 0.4 : 1,
      showTitle: dI > 0 ? "block" : "none", hintShow: dI === 0 ? "block" : "none", cur: dAct >= 0 ? DIS[dAct] : { t: "", d: "", img: BLANK }, curN: dAct >= 0 ? `${dAct + 1} of ${dN}` : "",
      nodes: DIS.map((d, i) => { const p = DP[i % 5]!, on = i < dI, act = i === dAct; return { t: d.t, img: d.img, n: i + 1, l: p[0] + "%", tp: p[1] + "%", tr: on ? `translate(-50%,-50%) rotate(${p[2]}deg) scale(${act ? 1.12 : 1})` : "translate(-50%,-50%) scale(.3)", op: on ? 1 : 0, pe: on ? "auto" : "none", bg: act ? "#ffe9a8" : "#fff", sh: act ? "5px 5px 0 #0d1815" : "2px 2px 0 #0d1815", z: act ? 5 : 3, go: () => setUi({ disI: i + 1 }), x2: p[0], y2: p[1], off: on ? 0 : 1, lop: on ? 1 : 0 }; }),
    };
    const psel2: number = ui.priSel ?? 0;
    const pv: Record<string, any> = { pick: psel2 ? `Your pick: principle #${psel2}. Tap another to change it.` : "Tap the principle you most want to apply at work." };
    for (let n = 1; n <= 10; n++) pv["p" + n] = { on: psel2 === n, bg: psel2 === n ? "#ffd37a" : "#fffaf0", sh: psel2 === n ? "5px 5px 0 #0d1815" : "3px 3px 0 #0d1815", show: psel2 === n ? "block" : "none", go: () => setUi({ priSel: psel2 === n ? 0 : n }) };
    v.pv = pv;
    const bpI: number = ui.bpI ?? 1, bpC = BPC.find((x) => x[0] === bpI)!;
    const XY = BPC.map((x) => [parseFloat(x[3]), parseFloat(x[4])] as [number, number]);
    const curve = (a: [number, number], b: [number, number], k: number) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1, o = k * L; return `M${a[0]} ${a[1]} Q${mx - (dy / L) * o} ${my + (dx / L) * o} ${b[0]} ${b[1]}`; };
    const segs = [1, 2, 3, 4, 5].map((j) => { const cur = j + 1 === bpI, seen = j + 1 <= bpI; return { d: curve(XY[j - 1]!, XY[j]!, 0.18), c: cur ? "#ff3d8f" : seen ? "#1a6a80" : "#0d181855", w: cur ? "4" : "2.5", dash: seen ? "none" : "1 5", op: seen ? 1 : 0.8 }; });
    segs.push({ d: curve(XY[5]!, XY[1]!, -0.28), c: bpI === 6 ? "#ff3d8f" : "#0d181833", w: bpI === 6 ? "3" : "2", dash: "2 4", op: bpI === 6 ? 1 : 0.7 });
    const stopPlay = () => { const t = bpTimers.get(c.frame.id); if (t) clearInterval(t); bpTimers.delete(c.frame.id); };
    const goTo = (n: number) => () => { stopPlay(); setUi({ bpI: n }); };
    v.bp = {
      segs, loopBg: bpI === 6 ? "#ffd37a" : "#fffaf0", cur: bpC[1], curD: bpC[2],
      play: () => { stopPlay(); let n = 1; setUi({ bpI: 1 }); bpTimers.set(c.frame.id, setInterval(() => { if (n >= 6) { stopPlay(); return; } n += 1; setUi({ bpI: n }); }, 2600)); },
      pins: BPC.map((x) => ({ n: x[0], x: x[3], y: x[4], bg: x[0] === bpI ? "#ffb627" : x[0] < bpI ? x[5] : "#fffaf0", sz: x[0] === bpI ? "44px" : "34px", z: x[0] === bpI ? 3 : 2, go: goTo(x[0]) })),
      chs: BPC.map((x) => ({ n: x[0], t: x[1], d: x[2], link: LK[x[0]], showLink: x[0] === bpI ? "block" : "none", tag: x[0] === 2 || x[0] === 6 ? "LEADERSHIP" : "", tagD: x[0] === 2 || x[0] === 6 ? "inline-block" : "none", nbg: x[0] === bpI ? "#ffb627" : x[0] < bpI ? x[5] : "#fffaf0", lineBg: x[0] < bpI ? "#1a6a80" : "#0d181833", lineD: x[0] === 6 ? "none" : "block", bg: x[0] === bpI ? x[5] : "#fffaf0", sh: x[0] === bpI ? "4px 4px 0 #0d1815" : "2px 2px 0 #0d1815", show: x[0] === bpI ? "block" : "none", go: goTo(x[0]) })),
    };
  }

  // ---- the PI Planning simulation: p1 board, p2 Coach Sync, p3 plan review, p4 business value, p5 ROAM, one shared board
  if (c.kind === "pib" || c.kind === "pcs" || c.kind === "ppr" || c.kind === "pbv" || c.kind === "prm") {
    const gp = obj<Groups>("gp", { n: 4, roster: Array.isArray(ui.students) ? ui.students : [], mode: "auto", man: {}, seed: 1 });
    if (!(S.gp as Groups | undefined)?.roster?.length && Array.isArray(ui.students)) gp.roster = ui.students;
    const gset = (p: Partial<Groups>) => set("gp", { ...gp, ...p });
    const N = Math.max(2, Math.min(8, gp.n || 4));
    const meta = obj<PiMeta>("pim", { sim: null, fa: null, pres: 0 });
    const T: PiTeam[] = Array.from({ length: 8 }, (_, i) => ({ ...piBlank(), ...obj<Partial<PiTeam>>(`pit:${i}`, {}) }));
    const setMeta = (p: Partial<PiMeta>) => set("pim", { ...meta, ...p });
    const setTeam = (i: number, fn: (t: PiTeam) => void) => { const t = structuredClone(T[i]!); fn(t); set(`pit:${i}`, t); };
    const team = Math.min(ui.piTeam ?? 0, N - 1), pres = Math.min(meta.pres, N - 1), tm = T[team]!, PT = PIT.slice(0, N);
    const sim0 = meta.sim ?? "alice", SIM = PIS[sim0]!, fl = SIM.f;
    const autoFa = () => Array.from({ length: 8 }, (_, k) => (k < 2 * N ? k % N : null));
    const FA = (meta.fa ?? autoFa()).map((x) => (x != null && x < N ? x : null));
    const lib = (ti: number) => { const r: (PiStory & { key: string; lib: boolean; d: string })[] = []; fl.forEach((f, k) => { if (FA[k] === ti) f.s.forEach((x, j) => { const key = `${sim0}:${k}:${j}`, tt = T[ti]!; r.push({ id: "L|" + key, key, lib: true, t: x[0], d: x[1], pts: tt.pe[key] ?? x[2], type: x[3], it: tt.pl[key] ?? 0 }); }); }); return r; };
    const combo = (ti: number) => [...lib(ti), ...T[ti]!.st.map((x) => ({ ...x, key: "", d: "", lib: false }))];
    const ld = (ti: number, it: number) => combo(ti).filter((x) => x.it === it).reduce((a, x) => a + (+x.pts || 0), 0);
    const setIt = (q: PiTeam, id: string, it: number) => { if (id.startsWith("L|")) q.pl[id.slice(2)] = it; else { const y = q.st.find((z) => z.id === id); if (y) y.it = it; } };
    const featsOf = (ti: number) => fl.map((f, k) => ({ k, f })).filter((o) => FA[o.k] === ti).map((o) => ({ n: "F" + (o.k + 1), t: o.f.t, c: o.f.s.length + " stories" }));
    const done = (ti: number) => { const t2 = T[ti]!, cc = combo(ti); return [t2.cap.every((x) => x > 0), cc.length > 0 && cc.every((x) => x.pts), cc.some((x) => x.it > 0), t2.ob.length > 0, t2.ob.some((o) => o.u), t2.rk.length > 0]; };
    const cur = (fn: (t: PiTeam) => void) => setTeam(team, fn);
    const dsF = (k: string, id: string) => (e: Drag) => { drag = { k, id }; try { e.dataTransfer.setData("text/plain", id); } catch { /* ignore */ } };
    const pf = ui.pf ?? { type: "G", pts: 3 };
    // Team builder (A5): who is on which team.
    const assign = (): string[][] => { const out: string[][] = Array.from({ length: N }, () => []); if (gp.mode === "manual") gp.roster.forEach((r, i) => out[Math.min(gp.man[r] ?? i % N, N - 1)]!.push(r)); else shuffle(gp.roster, gp.seed * 31 + 3).forEach((r, i) => out[i % N]!.push(r)); return out; };
    const G = assign();
    const curMap = () => Object.fromEntries(G.flatMap((m, qi) => m.map((r) => [r, qi])));
    const gsel: string | null = ui.gsel ?? null;
    const tmb = { n: N, minus: () => gset({ n: Math.max(2, N - 1) }), plus: () => gset({ n: Math.min(8, N + 1) }), shuffle: () => { gset({ mode: "auto", seed: gp.seed + 1 }); setUi({ gsel: null }); }, mode: gp.mode === "manual" ? "Assigned by you" : "Shuffled", hint: gsel ? `Moving ${gsel}: tap a team to place them.` : gp.roster.length ? "Tap a student, then tap a team to move them." : "Add students to the class (Students, top right) and they appear here.", count: gp.roster.length + " students",
      teams: PT.map((x, i) => ({ name: x[0], bg: x[1], sh: gsel ? "3px 3px 0 #ffb627" : "2px 2px 0 #0d1815", n: (G[i] ?? []).length, put: () => { if (gsel) { gset({ mode: "manual", man: { ...curMap(), [gsel]: i } }); setUi({ gsel: null }); } }, members: (G[i] ?? []).map((r) => ({ name: r, bg: gsel === r ? "#ffb627" : "#fff", go: (e: React.MouseEvent) => { e.stopPropagation(); setUi({ gsel: gsel === r ? null : r }); } })) })) };
    const tabs = PT.map((x, i) => ({ label: x[0], bg: i === team ? x[1] : "#fffaf0", sh: i === team ? "3px 3px 0 #0d1815" : "none", go: () => setUi({ piTeam: i }) }));
    const sims = ([["alice", "OPTION A"], ["geek", "OPTION B"]] as const).map((m) => ({ n: PIS[m[0]]!.n, d: PIS[m[0]]!.d, tag: m[1], bg: meta.sim === m[0] ? "#ffd37a" : "#fffaf0", sh: meta.sim === m[0] ? "4px 4px 0 #0d1815" : "2px 2px 0 #0d1815", mark: meta.sim === m[0] ? "SELECTED" : "", go: () => setMeta({ sim: m[0] }) }));
    const feats = featsOf(team);
    const stCard = (x: ReturnType<typeof combo>[number]) => ({ t: x.t, d: x.d, dd: x.d && x.it === 0 ? "block" : "none", dx: x.lib ? "none" : "block", type: x.type, pts: x.pts, bg: TC[x.type]![0], bd: TC[x.type]![1], ds: dsF("st", x.id), move: () => cur((q) => setIt(q, x.id, (x.it + 1) % 3)), est: (e: React.MouseEvent) => { e.stopPropagation(); const sc = [1, 2, 3, 5, 8, 13], nx = sc[(sc.indexOf(+x.pts) + 1) % sc.length]!; cur((q) => { if (x.lib) q.pe[x.key] = nx; else { const y = q.st.find((z) => z.id === x.id); if (y) y.pts = nx; } }); }, del: (e: React.MouseEvent) => { e.stopPropagation(); cur((q) => { q.st = q.st.filter((z) => z.id !== x.id); }); } });
    const cmb = combo(team);
    const zones = [0, 1, 2].map((it) => { const l = ld(team, it), cp = it ? tm.cap[it - 1]! : 0; return { title: it ? "Iteration 1." + it : "Team backlog", hasCap: !!it, cap: cp, load: l, tone: it && l > cp ? "#f6b9ae" : "#eef0ec", note: it ? (l > cp ? `Over by ${l - cp}` : `${cp - l} free`) : `${cmb.filter((x) => x.it === 0).length} to place`, hd: it ? "#dcdcdc" : "#e9dfc7", cards: cmb.filter((x) => x.it === it).map(stCard), ov: ovr, drop: (e: Drag) => { e.preventDefault(); if (drag?.k === "st") cur((q) => setIt(q, String(drag!.id), it)); drag = null; }, setCap: (e: Ev) => { const val = Math.max(0, +e.target.value || 0); cur((q) => { q.cap[it - 1] = val; }); } }; });
    const SN = ["Capacity", "Estimate", "Load", "Objectives", "Uncommitted", "Risks"];
    const stepsRow = done(team).map((d, i) => ({ n: d ? "✓" : String(i + 1), t: SN[i], bg: d ? "#cfe8d4" : "#fffaf0" }));
    const faList = fl.map((f, k) => { const val = FA[k] != null ? String(FA[k]) : ""; return { n: "F" + (k + 1), t: f.t, cnt: f.s.length + " stories", bg: val ? PT[FA[k]!]![1] : "#fff", v: val, opts: [{ v: "", t: "Unassigned", sel: val === "" }, ...PT.map((x, i) => ({ v: String(i), t: x[0], sel: val === String(i) }))], set: (e: Ev) => { const nv = e.target.value; const fa = (meta.fa ?? autoFa()).slice(); fa[k] = nv === "" ? null : +nv; setMeta({ fa }); } }; });
    const obRow = (o: PiObj, n: number) => ({ n, id: o.id, t: o.t, bv: o.bv == null ? "" : String(o.bv), u: o.u, ds: dsF("ob", o.id), save: (e: Blur) => cur((q) => { const y = q.ob.find((z) => z.id === o.id); if (y) y.t = e.target.value; }), setBv: (e: Ev) => { const val = e.target.value; cur((q) => { const y = q.ob.find((z) => z.id === o.id); if (y) y.bv = val ? +val : null; }); }, tog: () => cur((q) => { const y = q.ob.find((z) => z.id === o.id); if (y) y.u = !y.u; }), togL: o.u ? "Commit" : "Uncommit", del: () => cur((q) => { q.ob = q.ob.filter((z) => z.id !== o.id); }) });
    const cO = tm.ob.filter((o) => !o.u), uO = tm.ob.filter((o) => o.u), bvS = (a: PiObj[]) => a.reduce((n, o) => n + (+(o.bv ?? 0) || 0), 0);
    const dropOb = (u: boolean) => (e: Drag) => { e.preventDefault(); if (drag?.k === "ob") cur((q) => { const y = q.ob.find((z) => z.id === drag!.id); if (y) y.u = u; }); drag = null; };
    const np = { c: cO.map((o, i) => obRow(o, i + 1)), u: uO.map((o, i) => obRow(o, cO.length + i + 1)), ov: ovr, dropC: dropOb(false), dropU: dropOb(true), bvC: bvS(cO), bvU: bvS(uO), nC: cO.length, nU: uO.length, add: (e: Key) => { const t = e.currentTarget; if (e.key === "Enter" && t.value.trim()) { const val = t.value.trim(); t.value = ""; cur((q) => { q.ob.push({ id: uid(), t: val, bv: null, u: false }); }); } } };
    const rks = tm.rk.map((r) => ({ t: r.t, del: () => cur((q) => { q.rk = q.rk.filter((z) => z.id !== r.id); }) }));
    const addRk = (e: Key) => { const t = e.currentTarget; if (e.key === "Enter" && t.value.trim()) { const val = t.value.trim(); t.value = ""; cur((q) => { q.rk.push({ id: uid(), t: val, roam: null }); }); } };
    const addSt = (e: Key) => { const t = e.currentTarget; if (e.key === "Enter" && t.value.trim()) { const val = t.value.trim(); t.value = ""; cur((q) => { q.st.push({ id: uid(), t: val, type: pf.type, pts: pf.pts, it: 0 }); }); } };
    const typeBtns = ([["G", "User story"], ["P", "Maintenance"], ["Y", "Exploration enabler"]] as const).map((b) => ({ k: b[0], t: b[1], bg: TC[b[0]]![0], sh: pf.type === b[0] ? "3px 3px 0 #0d1815" : "none", go: () => setUi({ pf: { ...pf, type: b[0] } }) }));
    const ptsBtns = [1, 2, 3, 5, 8, 13].map((val) => ({ v: val, bg: pf.pts === val ? "#ffb627" : "#fffaf0", go: () => setUi({ pf: { ...pf, pts: val } }) }));
    // Coach Sync
    const sync = { gt: `minmax(260px,1fr) repeat(${N},92px)`, mw: `${260 + N * 92}px`, head: PT.map((x) => ({ t: x[0], bg: x[1] })), rows: PIQ.map((q, qi) => ({ q, cells: T.slice(0, N).map((t2, ti) => { const val = t2.sy[qi] ?? ""; return { bg: val ? SYC[val]![0] : "#fff", lab: val ? SYC[val]![1] : "·", go: () => setTeam(ti, (q2) => { q2.sy[qi] = ({ "": "y", y: "p", p: "n", n: "" } as Record<string, string>)[q2.sy[qi] ?? ""]!; if (!q2.sy[qi]) delete q2.sy[qi]; }) }; }) })), sum: T.slice(0, N).map((t2, ti) => { const cnt = (val: string) => Object.values(t2.sy).filter((x) => x === val).length; return { t: `${cnt("y")} yes · ${cnt("p")} partly · ${cnt("n")} no`, bg: PT[ti]![1] }; }) };
    // Draft plan review
    const pt = T[pres]!, pc = (val: string) => Object.values(pt.sy).filter((x) => x === val).length;
    const ppr = { teams: PT.map((x, i) => ({ name: x[0], bg: i === pres ? x[1] : "#fffaf0", sh: i === pres ? "5px 5px 0 #0d1815" : "2px 2px 0 #0d1815", op: i === pres ? 1 : 0.72, badge: i === pres ? "PRESENTING" : `${done(i).filter(Boolean).length}/6 steps`, bb: i === pres ? "#0d1815" : "#fff", bf: i === pres ? "#fff" : "#0d1815", go: () => setMeta({ pres: i }) })),
      name: PT[pres]![0], c: PT[pres]![1], feats: featsOf(pres),
      its: [1, 2].map((it) => { const l = ld(pres, it), cp = pt.cap[it - 1]!, over = l > cp; return { title: "Iteration 1." + it, cap: cp, load: l, pct: (cp ? Math.min(100, Math.round((l / cp) * 100)) : 0) + "%", bar: over ? "#d93a2b" : "#2f8f5b", note: over ? "Over capacity" : "Within capacity", cards: combo(pres).filter((x) => x.it === it).map((x) => ({ t: x.t, pts: x.pts, bg: TC[x.type]![0] })) }; }),
      obs: pt.ob.map((o, i) => ({ n: i + 1, t: o.t || "(untitled)", tag: o.u ? "Uncommitted" : "Committed", tbg: o.u ? "#fff3d0" : "#cfe8d4" })), noObs: pt.ob.length ? "none" : "block",
      rks: pt.rk.map((r) => ({ t: r.t })), noRk: pt.rk.length ? "none" : "block", sync: `${pc("y")} yes · ${pc("p")} partly · ${pc("n")} no`,
      next: () => setMeta({ pres: (pres + 1) % N }), prev: () => setMeta({ pres: (pres + N - 1) % N }) };
    // ROAM
    const sel: string | null = ui.piSel ?? null;
    const allR = T.slice(0, N).flatMap((t2, ti) => t2.rk.map((r) => ({ id: r.id, t: r.t, roam: r.roam, ti, key: `${ti}:${r.id}` })));
    const rcard = (r: (typeof allR)[number]) => ({ t: r.t, tn: PT[r.ti]![0], tc: PT[r.ti]![1], bd: sel === r.key ? "#ffb627" : "#0d1815", sh: sel === r.key ? "0 0 0 3px #ffb627" : "2px 2px 0 #0d1815", ds: (e: Drag) => { drag = { k: "rk", id: r.key }; try { e.dataTransfer.setData("text/plain", r.key); } catch { /* ignore */ } }, go: (e: React.MouseEvent) => { e.stopPropagation(); setUi({ piSel: sel === r.key ? null : r.key }); } });
    const setRoam = (key: string, val: string | null) => { const [ti, id] = key.split(":"); setTeam(+ti!, (q) => { const r = q.rk.find((z) => z.id === id); if (r) r.roam = val; }); setUi({ piSel: null }); };
    const rz = (val: string | null) => ({ ov: ovr, drop: (e: Drag) => { e.preventDefault(); if (drag?.k === "rk") setRoam(String(drag.id), val); drag = null; }, put: () => { if (sel) setRoam(sel, val); } });
    const roam = { tray: allR.filter((r) => !r.roam).map(rcard), trayN: allR.filter((r) => !r.roam).length, trayZ: rz(null), total: allR.length, hint: sel ? "Now tap a quadrant to place the selected risk." : "Tap a risk, then a quadrant. Or drag it there.", zones: ROAMS.map((z) => ({ l: z[0], t: z[1], d: z[2], bg: z[3], n: allR.filter((r) => r.roam === z[1]).length, cards: allR.filter((r) => r.roam === z[1]).map(rcard), ...rz(z[1]) })) };
    // Example data and a clean slate (the design's "Fill example data" and "Clear all teams").
    const seed = () => {
      const fa = autoFa();
      setMeta({ sim: sim0, fa, pres: 0 });
      const F = PIS[sim0]!.f;
      for (let i = 0; i < 8; i++) {
        const t = piBlank();
        t.cap = [38 + i * 2, 34 + i * 2];
        const mine: number[] = []; fa.forEach((a, k) => { if (a === i) mine.push(k); });
        mine.forEach((k, j) => F[k]!.s.forEach((_, m) => { t.pl[`${sim0}:${k}:${m}`] = (j + m) % 3 === 2 ? 0 : ((j + m) % 2) + 1; }));
        t.st.push({ id: uid(), t: "Upgrade build pipeline", type: "P", pts: 3, it: 1 }, { id: uid(), t: "Spike: evaluate options", type: "Y", pts: 2, it: 2 });
        mine.forEach((k, j) => t.ob.push({ id: uid(), t: F[k]!.t, bv: null, u: j === 1 && i % 2 === 0 }));
        t.rk.push({ id: uid(), t: RISKS[(i * 2) % RISKS.length]!, roam: null }, { id: uid(), t: RISKS[(i * 2 + 1) % RISKS.length]!, roam: null });
        [0, 1, 2, 3, 4].forEach((q) => { t.sy[q] = (q + i) % 4 === 3 ? "p" : "y"; });
        set(`pit:${i}`, t);
      }
    };
    const reset = () => { set("pim", null); for (let i = 0; i < 8; i++) set(`pit:${i}`, null); setUi({ piSel: null, piTeam: 0 }); };
    v.pi = { started: !!meta.sim, gate: meta.sim ? "none" : "block", faList, autoFa: () => setMeta({ fa: autoFa() }), noFeat: feats.length ? "none" : "block", tmb, tabs, sims, feats, zones, stepsRow, np, rks, addRk, addSt, typeBtns, ptsBtns, sync, ppr, roam, seed, reset, teamName: PT[team]![0], teamBg: PT[team]![1], fcount: feats.length };
  }

  return v;
}
