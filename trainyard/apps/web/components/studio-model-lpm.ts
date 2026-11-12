// What the Lean Portfolio Management boards show and do, ported from the design's logic
// (Trainyard LPM handoff, src/comp.js and src/script.js) so the generated templates in
// studio-views-lpm.tsx behave exactly as designed. The class's teams are the design's groups: every
// exercise of the class keeps one state per team (the frame's state, changed one op at a time), and
// participatory budgeting is one class-wide event where each team is a table.
//
// Exercise content © Scaled Agile, Inc., used under the partner agreement (see packages/core/src/courses/NOTICE.md).

import { classTeams } from "@trainyard/core";
import type { StateOp } from "@trainyard/core";
import type { StudioCtx } from "./studio-model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Op = (c: StateOp) => void;
type Ev = { target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement } & Partial<React.SyntheticEvent>;
type KeyEv = React.KeyboardEvent<HTMLInputElement>;

const SC = ["#ffd37a", "#f6b9ae", "#cfe8d4", "#cde0f2"], QH = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let uidN = 1000;
const uid = (p: string) => p + ++uidN + Math.random().toString(36).slice(2, 5);

/* ---- 1-39 portfolio process flow ---- */
const CW = 1000, CH = 560;
const FT: Record<string, { w: number; h: number; l: string }> = { step: { w: 150, h: 62, l: "Step" }, dec: { w: 120, h: 120, l: "Decision" }, doc: { w: 140, h: 66, l: "Documents" }, cloud: { w: 130, h: 76, l: "Ad hoc" }, end: { w: 78, h: 78, l: "Start / end" } };
const FN = (id: string, type: string, x: number, y: number, t: string, pain?: number, painT?: string) => ({ id, type, x, y, t, pain: !!pain, painT: painT || "" });
const FLOW_EX = {
  nodes: [FN("a", "step", 20, 20, "Five-Year Strategy"), FN("b", "step", 300, 16, "Shareholder demands"), FN("c", "step", 150, 128, "Annual Strategy", 1, "Strategy is set once a year; new ideas wait up to 12 months."), FN("d", "dec", 360, 96, "Ideas · GMs · NSOs"), FN("e", "step", 560, 126, "Present, feedback, adjust"), FN("f", "doc", 400, 262, "Ballpark $; cost / benefit"), FN("g", "doc", 640, 262, "Annual Plan", 1, "Big upfront plan and budget; hard to change mid-year."), FN("h", "cloud", 20, 290, "Ad hoc requests"), FN("i", "step", 150, 400, "Monthly Steering", 1, "Decisions queue for the next steering meeting."), FN("j", "step", 400, 400, "Ops Strategy"), FN("k", "step", 650, 400, "Quarterly Planning"), FN("l", "step", 530, 488, "OKRs"), FN("m", "step", 290, 488, "Execution")],
  edges: [["a", "c"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "g"], ["f", "g"], ["g", "k"], ["k", "l"], ["l", "m"], ["m", "i"], ["i", "c"], ["i", "j"], ["j", "k"], ["h", "i"]].map(([a, b]) => ({ a, b })),
};

/* ---- 2-12 strategic themes ---- */
const THEMES = [{ id: "hc", t: "Expand autonomous delivery into healthcare", ic: "🏥", c: "#cde0f2" }, { id: "rt", t: "Expand autonomous delivery into retail", ic: "🛒", c: "#cfe8d4" }];
const KR = (v: string, m: string, f: string, to: string, u: string, by: string) => ({ v, m, f, to, u, by });
const KR_EX: Record<string, ReturnType<typeof KR>[]> = {
  hc: [KR("Increase", "hospitals and clinics served by autonomous delivery", "0", "12", "", "end of Q4"), KR("Reduce", "average lab-sample turnaround time", "90", "30", " min", "end of next PI"), KR("Increase", "on-time medication deliveries", "80", "98", "%", "end of Q4")],
  rt: [KR("Increase", "retail partners using autonomous delivery", "2", "25", "", "end of the year"), KR("Increase", "share of orders delivered in under 60 minutes", "15", "60", "%", "end of Q3"), KR("Reduce", "cost per delivery", "9", "4", " USD", "end of Q4")],
  own: [],
};
const VERBS = ["Increase", "Reduce", "Grow", "Achieve", "Improve"];

/* ---- 2-17 portfolio canvas ---- */
const PC_ITEMS: [number, string, string][] = [[1, "Autonomous Delivery; Autonomous Transportation", "vs"], [2, "Prototyping expenses and geo navigation licensing fees", "cost"], [3, "TTC Web Services Partner Network; Enhanced vision system and laser-based lidars", "kr"], [4, "Membership subscription", "rev"], [5, "$4MM Autonomous Delivery; $5MM Autonomous Transportation", "bud"], [6, "Annual user conference. Portfolio sync, and participatory budgeting", "ka"], [7, "Autonomous vehicles for delivery of commercial goods; Autonomous vehicles for public transportation of people", "sol"], [8, "Online Platform with eCommerce capabilities; Interactive app with customizable preferences", "ch"], [9, "Government, education, hospitals", "seg"], [10, "Voice of the customer; Service subscribers", "rel"], [11, "TTC Web Services Partner Network; Regional transportation transit system", "kp"], [12, "Average profit margin, customer acquisition cost; Customer retention", "kpi"]];
const PC_COL = ["#2f6fd0", "#f2a43a", "#e8582a", "#8db33a"];
const PC_CELLS: [string, string, string, string][] = [["vs", "Value Streams", "vp", "🌊"], ["sol", "Solutions", "vp", "🚚"], ["seg", "Customer Segments", "vp", "👥"], ["ch", "Channels", "vp", "📣"], ["rel", "Customer Relationships", "vp", "❤"], ["bud", "Budget", "vp", "💰"], ["kpi", "KPIs / Revenue", "vp", "📈"], ["kp", "Key Partners", "k", "🔗"], ["ka", "Key Activities", "k", "☑"], ["kr", "Key Resources", "k", "🧰"], ["cost", "Cost Structure", "c", "🏷"], ["rev", "Revenue Streams", "c", "💲"]];

/* ---- 2-21 SWOT / TOWS ---- */
const SWOT0 = { S: ["Highly skilled engineers and software developers"], W: ["Limited venture capital", "Limited technical staff"], O: ["Expand into food delivery market segment"], T: ["Revenue from courier vans is diminishing"] };
const SWC: Record<string, [string, string]> = { S: ["#2f6fd0", "INTERNAL STRENGTHS"], W: ["#e8a21f", "INTERNAL WEAKNESSES"], O: ["#1f3a8a", "EXTERNAL OPPORTUNITIES"], T: ["#7fa82a", "EXTERNAL THREATS"] };
const TOWS_Q: Record<string, string> = { SO: "How can your strengths be used to exploit and maximize opportunities?", ST: "How can you apply your strengths to overcome present and potential threats?", WO: "How can your opportunities be leveraged to overcome weaknesses?", WT: "How can you minimize weaknesses and avoid threats?" };
const TOWS_T: Record<string, (i: string, e: string) => string> = { SO: (i, e) => "Use " + i.toLowerCase() + " to " + e.toLowerCase(), ST: (i, e) => "Use " + i.toLowerCase() + " to offset: " + e.toLowerCase(), WO: (i, e) => e + " to overcome: " + i.toLowerCase(), WT: (i, e) => "Reduce exposure to “" + i.toLowerCase() + "” before: " + e.toLowerCase() };

/* ---- 2-33 market rhythms ---- */
const IND = [
  { id: "b2b", n: "B2B retail software", c: "#1f3a8a", v: [2, 2, 4, 5, 6, 6, 6, 7, 9, 9, 1, 1], tip: "Retailers lock down production in Nov–Dec. Best window: late Q3." },
  { id: "soc", n: "B2C social media", c: "#8db33a", v: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], tip: "Value is roughly constant: release any time." },
  { id: "toy", n: "Toy maker", c: "#f2b01e", v: [3, 3, 3, 3, 3, 3, 3, 4, 5, 7, 10, 7], tip: "Value peaks in the high-volume holiday season." },
  { id: "tax", n: "Tax software", c: "#7b44f5", v: [9, 10, 10, 9, 2, 1, 1, 1, 1, 2, 3, 6], tip: "Filing season Jan–Apr. Ship by December or wait a year." },
  { id: "edu", n: "Education / EdTech", c: "#ff3d8f", v: [5, 3, 3, 2, 2, 4, 8, 10, 9, 4, 3, 3], tip: "Back-to-school Aug–Sep. Schools buy and onboard in early summer." },
  { id: "trv", n: "Travel & hospitality", c: "#1fb89a", v: [5, 6, 7, 7, 8, 10, 10, 9, 5, 4, 4, 6], tip: "Summer peak. Booking flows must be ready by spring." },
  { id: "hc", n: "Healthcare", c: "#2aa4d8", v: [8, 7, 5, 4, 4, 4, 4, 5, 6, 8, 9, 9], tip: "Respiratory season Oct–Feb raises demand; budgets often reset with the fiscal year." },
  { id: "lm", n: "Last-mile delivery", c: "#ff6a1f", v: [6, 4, 4, 5, 5, 6, 6, 6, 7, 8, 10, 10], tip: "Parcel peak from late November through December." },
];
const EVT: [string, string, string][] = [["show", "Trade show", "#4a5fe8"], ["reg", "Regulation", "#ff6a1f"], ["comp", "Competitor release", "#c8102e"], ["tech", "Technology change", "#1fb89a"]];
const EV0 = [{ id: "e1", n: "Tech trade show demo", ty: "show", m: 0 }, { id: "e2", n: "Sidewalk-robot rules updated", ty: "reg", m: 3 }, { id: "e3", n: "Competitor drone pilot", ty: "comp", m: 6 }, { id: "e4", n: "Cheaper lidar generation", ty: "tech", m: 8 }];
const TTC0 = [7, 4, 4, 5, 5, 6, 6, 6, 7, 8, 10, 10];

/* ---- 3-16 epic ---- */
const EPF: [string, string, string][] = [["for", "For", "Customers"], ["who", "who", "do something"], ["the", "the", "Solution"], ["isa", "is a", "something – the ‘how’"], ["that", "that", "provides this value"], ["unlike", "unlike", "competitor, current Solution or non-existing Solution"], ["our", "our Solution", "does something better – the ‘why’"]];
const EP_EX = { name: "Autonomous Healthcare Delivery", owner: "Dana Ruiz, Epic Owner", for: "hospitals, clinics and labs", who: "need medication, supplies and lab samples moved quickly and safely between sites", the: "TTC MedLink", isa: "fleet of autonomous ground vehicles and drones with a dispatch app", that: "delivers on demand, 24/7, with temperature monitoring and chain-of-custody tracking", unlike: "courier vans and manual runners", our: "cuts turnaround from hours to under 30 minutes and frees clinical staff for patients", bo: "10 hospital contracts within 12 months. Lab-sample turnaround down 50%. 15% of TTC revenue from healthcare by year two.", li: "Pilot sites onboarded per month. Deliveries per day per site. On-time delivery rate. Nurse and lab staff satisfaction.", nfr: "Health-privacy compliance for patient data. Cold chain 2–8 °C for medication. 99.5% dispatch availability. Full chain-of-custody audit trail." };

/* ---- 3-17 Lean business case ---- */
const LBC: [string, string[]][] = [["", ["Funnel Entry Date", "Epic Owner", "Key Stakeholders", "Epic Description", "Business Outcome Hypothesis", "Leading Indicators", "In Scope", "Out of Scope", "Nonfunctional Requirements", "Minimum Viable Product (MVP) Features", "Additional Potential Features", "Analysis Summary", "Go / No-Go"]], ["Solution Analysis", ["Which internal and/or external customers are affected, and how?", "What is the potential impact on solutions, programs and services?", "What is the potential impact on sales, distribution, deployment and support?"]], ["Forecasted Costs", ["MVP Cost", "Estimated Implementation Cost"]], ["Forecasted Returns", ["Type of Return"]], ["Development Strategy", ["In-house or Outsourced Development", "Incremental Implementation Strategy", "Sequencing and Dependencies"]], ["Additional Supporting Data", ["Attachments", "Other Notes and Comments"]]];
const LBT: [string, string, string][] = [["keep", "✓ Keep", "#cfe8d4"], ["adapt", "✎ Adapt", "#ffd37a"], ["drop", "✕ Drop", "#f6b9ae"], ["q", "? Unclear", "#d9cdf0"]];

/* ---- 3-29 pivots ---- */
const PIV: [string, string, string, string, string][] = [["seg", "Customer segment pivot", "#2f6fd0", "The product solves a real problem, but for a different customer segment than the one you planned for.", "TTC built for grocers, but hospitals adopt it first."], ["cap", "Value capture pivot", "#e8582a", "Change how you monetize or capture value: pricing, revenue model, who pays.", "From per-delivery fees to a monthly fleet subscription."], ["need", "Customer need pivot", "#7fa82a", "Customers have a more important problem than the one you set out to solve.", "Clinics care more about chain of custody than speed."], ["zoom", "Zoom-in (feature) pivot", "#f2b01e", "A single feature becomes the whole product.", "The live tracking map becomes a stand-alone product."]];

/* ---- 4-12 guardrails ---- */
const HOR: [string, string, string, string][] = [["h3", "Horizon 3", "Evaluating", "Small bets to explore new ideas. Stop early if the hypothesis fails."], ["h2", "Horizon 2", "Emerging", "Promising solutions proving market fit."], ["h1", "Horizon 1", "Investing · Extracting", "Core solutions earning today’s revenue."], ["h0", "Horizon 0", "Retiring", "Solutions being decommissioned."]];
const HOR0 = { h3: 10, h2: 20, h1: 60, h0: 10 };
const CAP: [string, string, string][] = [["lf", "Local Features", "#33688a"], ["le", "Local Enablers", "#a84a44"], ["fe", "Features from Epics", "#5f6fa6"], ["td", "Tech debt & maintenance", "#d4a843"]];
const CAP0 = { lf: 50, le: 15, fe: 20, td: 15 };
const BO_ROLES = ["Product and Solution Management", "Lean Portfolio Management", "Customer", "Finance", "Enterprise Architect", "Sales and Marketing", "Operations"];

/* ---- 4-26 / 4-28 participatory budgeting (from the handout) ---- */
const PB_BUDGET = 6000000;
const PB_THEMES = ["Increase revenue for the new Value Stream for Autonomous Commercial Vehicles by 300% within 18 months by improving the delivery platform capabilities, including image recognition systems for rapid data analysis", "Build and deploy the iNaviGATOR app to improve the quality of sensors, navigation and edge detection capabilities of all Autonomous Public Transportation Vehicles by 85%", "Achieve higher autonomous driving levels for 80% of all Public Transportation Vehicles", "Build and integrate the world’s largest interactive platform for intelligent delivery to speed up the development of Commercial and Public Transportation Autonomous Vehicles"];
const PBI = (id: string, vs: string, n: string, d: string, c: number, sol?: number, hz?: string) => ({ id, vs, n, d, c, sol: !!sol, hz: hz || "" });
const PB_ITEMS = [PBI("CS", "Commercial", "C Solution 1: Autonomous Commercial Delivery via vans", "Run the business: operating cost of the solution plus local development below the epic threshold.", 2000000, 1, "H2"), PBI("C1", "Commercial", "C1: Extend to more languages", "Extend the delivery services to other languages", 100000), PBI("C2", "Commercial", "C2: Gamification for deliveries", "Provide gamification for ordering process to encourage orders", 500000), PBI("C3", "Commercial", "C3: Drone delivery platform", "Provide a capability for delivery of groceries with drones", 900000), PBI("C4", "Commercial", "C4: Support Apple Pay", "Support Apple Pay as a payment method for delivery", 100000), PBI("C5", "Commercial", "C5: Build an Alexa service", "Allow voice ordering through Alexa-capable devices", 200000), PBI("C6", "Commercial", "C6: Local Farm delivery of perishable goods", "Test the ability to deliver perishable goods within a certain time and distance range", 100000), PBI("C7", "Commercial", "C7: Image recognition system", "Improve the advanced image control and recognition systems to interpret sensory information for identifying appropriate navigation paths with 90%", 700000),
  PBI("TS", "Transport", "T Solution 1: Autonomous Public Transport via Buses", "Run the business: operating cost of the solution plus local development below the epic threshold.", 1000000, 1, "H2"), PBI("T1", "Transport", "T1: Move to autonomous Level 5", "Enable Level 5 autonomy which will allow deliveries for government customers in off road conditions, opening a huge market for the company", 600000), PBI("T2", "Transport", "T2: Upgrade sensors", "Upgrade the sensors of the vehicle to ensure faster recognition of dynamic road situations", 500000), PBI("T3", "Transport", "T3: Enhance navigation", "Enhance navigation capabilities to shorten drive time", 300000), PBI("T4", "Transport", "T4: Edge Detection capability", "Improve the image recognition system to enable edge detection in low light and low contrast settings", 800000),
  PBI("P1", "Crossing VSs", "P1: Delivery platform partnership", "Partner with a company that has a delivery platform. If funded, P2 and P3 cannot be funded.", 700000), PBI("P2", "Crossing VSs", "P2: Delivery platform development", "Build an in-house delivery platform to support all delivery needs. If funded, P1 cannot be funded.", 800000), PBI("P3", "Crossing VSs", "P3: Fleet management delivery platform integration", "Integrate the new delivery platform with the fleet management suite. Only if P2 is funded.", 200000), PBI("P4", "Crossing VSs", "P4: Continuous Delivery Pipeline", "Allow Release on Demand on new features", 300000)];
const PB_VSC: Record<string, string> = { Commercial: "#2f6fd0", Transport: "#1fb89a", "Crossing VSs": "#7b44f5" };
const PB_ROLES: [string, string][] = [["LPM members", "Balance the whole portfolio against the strategic themes."], ["Product and Solution Management", "Protect the roadmap and the features customers are waiting for."], ["Epic Owners", "Champion their Epic’s business case and MVP."], ["Enterprise and Solution Architects", "Fund enablers, platforms and the delivery pipeline."], ["Business Owners", "Maximize business value and ROI across value streams."], ["Sales and Marketing", "Fund what customers will buy and the market will notice."], ["Finance", "Stay inside the budget and fund run-the-business first."]];
const money = (n: number) => (!n ? "$0" : (n < 0 ? "−" : "") + "$" + (Math.abs(n) >= 1e6 ? (Math.abs(n) / 1e6).toFixed(Math.abs(n) % 1e6 ? 2 : 0).replace(/\.?0+$/, "") + "M" : Math.round(Math.abs(n) / 1000) + "K"));
const PB_DEFCFG = () => ({ budget: PB_BUDGET, members: 4, mem: {} as Record<string, number>, names: {} as Record<string, string[]>, vs: [...new Set(PB_ITEMS.map((i) => i.vs))].map((v) => ({ id: v, n: v, c: PB_VSC[v] || "#4a5fe8", items: PB_ITEMS.filter((i) => i.vs === v).map((i) => ({ id: i.id, n: i.n, d: i.d, c: i.c, sol: i.sol, hz: i.hz, req: i.id === "P3" ? "P2" : "", ex: i.id === "P1" ? "P2" : i.id === "P2" ? "P1" : "" })) })) });
const VS_COLS = ["#2f6fd0", "#1fb89a", "#7b44f5", "#ff6a1f", "#c99a10", "#ff3d8f", "#2aa4d8", "#a84a44"];

/* ---- 5-21 portfolio kanban ---- */
const PKI: Record<string, string> = { fun: "M10 10h28l-11 13v13l-6 4V23z", rev: "M20 8a12 12 0 1 0 .01 0M29 29l9 9M10 20h5l3-5 4 10 3-5h4", ana: "M8 38h32M10 32l9-10 7 6 12-14M10 8v26", rdy: "M14 6h20v36H14zM14 15h20M14 24h20M14 33h20", imp: "M8 10h14v9H8zM28 14l4-4 4 4-4 4zM15 19v10h22v5M8 34h20M24 30l4 4-4 4", done: "M24 6l15 6v10c0 10-7 17-15 20-8-3-15-10-15-20V12zM17 24l5 5 9-10" };
const PKC: [string, string, string[], string, string][] = [["fun", "Funnel", ["All big ideas are captured: new business opportunities, cost savings, marketplace changes, mergers and acquisitions, problems with existing Solutions"], "If the idea is below the Epic threshold, move to the appropriate ART Kanban.", ""], ["rev", "Reviewing", ["Refine understanding of the Epic", "Create the Epic hypothesis statement", "Preliminary cost estimates and WSJF", "WIP limited"], "Pull when an Epic Owner is available.", "3"], ["ana", "Analyzing", ["Solution alternatives", "Refined cost estimates and WSJF", "Define MVP", "Create Lean business case", "Go/no-go decision", "WIP limited"], "Pull when an Epic Owner has capacity.", "2"], ["rdy", "Ready", ["Epics approved by LPM", "Sequenced using WSJF"], "Pull when approved by LPM.", ""], ["mvp", "Implementing · MVP", ["Build and evaluate MVP", "Pivot or persevere decision made", "Pulled by teams"], "Pull when train capacity and budget available.", "2"], ["per", "Implementing · Persevere", ["Affected ARTs or Solution Trains reserve capacity for the Epic", "Continue Feature implementation until WSJF determines otherwise"], "Pull when MVP hypothesis proven true.", ""], ["done", "Done", ["Done when LPM governance is no longer required"], "Pull when Epic is no longer a portfolio concern.", ""]];
const PK_EP: [string, string][] = [["Autonomous healthcare delivery", "rev"], ["Drone delivery platform", "ana"], ["Local farm delivery of produce", "fun"], ["Delivery of contractor supplies", "fun"], ["Move to autonomous Level 5", "rdy"], ["Image recognition system", "mvp"], ["Continuous Delivery Pipeline", "per"], ["Support Apple Pay", "fun"]];

/* ---- 5-29 WSJF (Leading SAFe template, portfolio parameters) ---- */
const WS_SCALE = ["1", "2", "3", "5", "8"];
const WS_EP: [string, string, number][] = [["Epic 1: Local farm delivery of produce to supermarkets", "Will result in 25% increase in market share", 5000000], ["Epic 2: Drone delivery platform", "Will enable faster autonomous delivery to all TTC markets", 500000], ["Epic 3: Delivery of contractor supplies", "Will result in 10% increase in market share", 2000000]];

/* ---- L7 measuring LPM performance ---- */
const MET: [string, string, string][] = [["Portfolio Performance", "Objectives and Key Results (OKRs)", "Better alignment and improved progress toward the portfolio’s Strategic Themes, and portfolio performance"], ["Employee Engagement", "Employee surveys: Agile People Operations data", "Improved employee satisfaction, higher employee engagement, and better business outcomes"], ["Customer Satisfaction", "Net Promoter Score (NPS)", "Improved Customer experiences and loyalty"], ["Partner Health", "Partner and vendor surveys", "Improved ecosystem relationships"], ["Business Agility", "Business Agility assessment", "Improved ability to respond to market changes, emerging opportunities, and threats"], ["Value Stream Performance", "Value Stream KPIs", "Improved performance against the forecasted business outcomes"], ["ART Predictability", "ART Predictability Measure", "Improved actual business value achieved"], ["Time-to-Market", "Number of releases; flow time", "More frequent releases; faster feature delivery"], ["Relentless Improvement", "Assessments for each level of the Framework, LPM Assessment", "Relentless improvement in team, ART and portfolio performance"], ["Quality", "Defect count and cycle time; support call volume; escaped defects", "Improved Customer satisfaction; reduced support call volume, and lower product development costs"], ["Portfolio Flow", "Flow time, flow load, and flow distribution", "Assess and improve the ability to deliver innovative business Solutions quickly"]];
const MET_T: [string, string, string][] = [["use", "We use it", "#cfe8d4"], ["rm", "Remove", "#f6b9ae"], ["add", "Add", "#cde0f2"], ["no", "Not today", "#eee8da"]];

/* ---- workshop ---- */
const PITCH: [string, string, string][] = [["solve", "What are we solving?", "#cde0f2"], ["lose", "What will we lose if we don’t proceed?", "#f6b9ae"], ["gain", "What will we gain if we proceed?", "#cfe8d4"], ["cta", "What is the call to action?", "#ffd37a"]];
const SCOPE_T: [string, string, string][] = [["pf", "Portfolio", "#3d6fb6"], ["vs", "Value stream", "#f2b84b"], ["mi", "Major initiative", "#f2b84b"], ["art", "ART", "#f2b84b"], ["st", "Strategic theme", "#f2b84b"]];
const EMI_Q = ["What are your roles and responsibilities?", "What are the biggest challenges facing you in your role supporting the organization?", "How are you feeling about [insert topic you are conducting empathy interviews on]?", "What is the best possible outcome imaginable for our event?", "What is the biggest risk in introducing change to your teams?", "What issues or topics will people avoid discussing that I should be aware of?", "Who else should I speak with in preparation for our event?", "What else should I know about in order to successfully prepare for our event?"];
const CHAL: [string, string][] = [["Hesitation to implement LPM due to complexity", "Stakeholders indicated feeling overwhelmed due to the complexity and level of change of the LPM implementation. What can you do to help them work through this and identify a path forward?"], ["Leaders fear loss of control", "A fiduciary expresses concerns that the move away from project funding is going to lead to a loss of control over how investments are allocated. What can you do to help the fiduciary work through this concern?"], ["Value Stream members disagree with LPM decisions", "Several key members of the Value Stream do not support Epics approved by the LPM process. What could be causing this situation, and what can you do to address it?"], ["Development Value Stream capacity is limited", "Members of the Development Value Streams indicated lack of capacity to work on LPM-approved Epics. What could be causing this situation, and what can you do to address it?"]];
const CHAL_D: [string, string][] = [["Operate from a foundation of trust", "Engage the executive sponsor to open doors and advocate for you."], ["Seek to understand", "Understand the source of concern."], ["Experimentation mindset", "Start with small quick wins to build trust and pave the way to try more things."], ["Build mutual trust", "After you have listened, engage them in things that provide visibility and compare to what they have today."]];
const NXT_C = ["Backlog", "Week 1", "Week 2", "Week 3"];
const NXT0 = ["Prepare leaders and key influencers", "Prepare facilitators, speakers and participants", "Choose partners for event inputs", "Define participant pre-work", "Download the LPM Adoption Roadmap", "Complete the LPM Readiness Checklist", "Complete the Align practice guide module", "Launch the LPM CoP", "Set the LPM kickoff date and invite participants"];

/** The defaults of each template's state. */
const DEF: Record<string, any> = {
  org: { a: null, b: null, q0: [], q1: [] },
  flow: { nodes: [], edges: [], sel: null, conn: null },
  theme: { pick: "hc", own: "", krs: null },
  pc: { pl: { 2: "cost" }, sel: null, chk: false },
  swot: { S: SWOT0.S, W: SWOT0.W, O: SWOT0.O, T: SWOT0.T, pi: null, pe: null, out: { SO: [], ST: [], WO: [], WT: [] } },
  fut: { f: {}, ep: [], nt: "Epic", nn: "", nc: "" },
  mr: { inds: ["b2b", "soc", "toy"], mine: TTC0, ev: EV0, win: { 9: 1, 10: 1 }, en: "", et: "show", em: 0 },
  epic: { date: "", name: "", owner: "", bo: "", li: "", nfr: "" },
  lbc: { tag: {}, note: {}, q0: [], q1: [], q2: [] },
  piv: { sel: "seg", notes: {}, pick: "", sit: "", fix: "" },
  grd: { hor: HOR0, cap: CAP0, thr: 500000, bo: [] },
  disc: {},
  ctx: { role: "", q0: [], q1: [] },
  pb: {},
  pkb: { at: null, wip: {}, pol: {}, exit: {}, evo: {} },
  wsjf: { rows: null },
  met: { tag: {}, q0: [], q1: [], q2: [] },
  tbl: { c: {} },
  pitch: { ctx: "", aud: "" },
  scope: { ideas: [], pick: "", cust: "", sol: "" },
  emi: { c: {}, qs: {}, own: [] },
  chal: { sel: 0, deb: false },
  nxt: { at: null, extra: [] },
};

/** What is being dragged (one browser at a time): a canvas item, an epic, an idea, an action. */
let dragPc: number | null = null, dragPk = "", dragSc = "", dragNx = "";
const K0 = ["vid", "org", "flow", "theme", "pc", "swot", "fut", "mr", "epic", "lbc", "piv", "grd", "disc", "ctx", "pb", "pkb", "wsjf", "met", "tbl", "emi", "pitch", "scope", "chal", "nxt"];
const BLANK = { pkm: {}, desc: [], vs: [], tables: [], cvs: [], warn: [], vsBars: [], qs: [], list: [], rows: [], cards: [], items: [], head: [], frames: [], cols: [], tray: [], strat: [], aud3: [], roles: [], sum: [], tags: [], tableChips: [] };

export function lpmModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi } = c;
  const op: Op = (x) => (c.readOnly ? undefined : c.op(x));
  const K: string = cfg.step ?? "disc", exId: string = cfg.id ?? c.frame.id, type: string = c.frame.activity?.kind ?? "Activity";
  const rec = (k: string): Record<string, any> => (S[k] && typeof S[k] === "object" && !Array.isArray(S[k]) ? (S[k] as Record<string, any>) : {});
  const D = (k: string): any => ({ ...(DEF[k.split(":")[0]!] ?? {}), ...rec(k) });
  const setD = (k: string, p: any) => { const cur = D(k); op({ key: k, op: "set", value: { ...cur, ...(typeof p === "function" ? p(cur) : p) } }); };
  const clear = (k: string) => op({ key: k, op: "set", value: null });
  const stickyList = (k: string, f: string) => { const d = D(k); return { list: ((d[f] as string[]) || []).map((t, i) => ({ t, c: SC[i % 4], rot: [-1.5, 1, -0.5, 1.8][i % 4] + "deg", del: () => setD(k, (x: any) => ({ [f]: (x[f] || []).filter((_: string, j: number) => j !== i) })) })), key: (e: KeyEv) => { const el = e.target as HTMLInputElement; if (e.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD(k, (x: any) => ({ [f]: [...(x[f] || []), v] })); } } }; };
  const qcards = (k: string, qs: string[] | undefined, qc?: string[]) => (qs ?? []).map((q, i) => ({ n: i + 1, q, hc: qc ? qc[i % qc.length] : QH[i % 4], hf: qc ? "#fff" : "#14123a", ...stickyList(k, "q" + i) }));
  const val = (f: (v: string) => void) => (ev: Ev) => f(ev.target.value);
  const T: Record<string, any> = {};

  /* 1-34 organizing around value */
  if (K === "org") {
    const d = D("org"), scale = (f: string, L: string, R: string) => ({ L, R, dots: [0, 1, 2, 3, 4].map((v) => ({ v: v + 1, bg: d[f] === v ? "#ff3d8f" : "#fff", fg: d[f] === v ? "#fff" : "#14123a", go: () => setD("org", { [f]: d[f] === v ? null : v }) })) });
    T.org = { qs: qcards("org", cfg.qs), s0: scale("a", "Functional silos", "Organized around value"), s1: scale("b", "Projects", "ARTs, continuous flow"), has: d.a != null && d.b != null, x: (d.a == null ? 2 : d.a) * 25 + "%", y: (4 - (d.b == null ? 2 : d.b)) * 25 + "%",
      verdict: d.a == null || d.b == null ? "Answer both scales to place your portfolio." : d.a >= 3 && d.b >= 3 ? "Organized around value with ARTs: ready for Lean budgets." : d.a >= 3 ? "Value streams exist, but work is still funded as projects." : d.b >= 3 ? "ARTs exist, but the portfolio is still shaped by functions." : "Project-funded silos: the classic starting point." };
  }

  /* 1-39 current portfolio process */
  if (K === "flow") {
    const F = D("flow"), drag = ui.fdrag as { id: string; x: number; y: number } | undefined;
    const nodes0: any[] = (F.nodes as any[]).map((n) => (drag && drag.id === n.id ? { ...n, x: drag.x, y: drag.y } : n));
    const by: Record<string, any> = {}; nodes0.forEach((n) => (by[n.id] = n));
    const ctr = (n: any) => { const t = FT[n.type]!; return { cx: n.x + t.w / 2, cy: n.y + t.h / 2, hw: t.w / 2 + 3, hh: t.h / 2 + 3 }; };
    const clip = (c2: any, ux: number, uy: number) => { const k = Math.min(ux ? c2.hw / Math.abs(ux) : 1e9, uy ? c2.hh / Math.abs(uy) : 1e9); return [c2.cx + ux * k, c2.cy + uy * k]; };
    const edges = (F.edges as any[]).filter((x) => by[x.a] && by[x.b]).map((x) => { const A = ctr(by[x.a]), B = ctr(by[x.b]), dx = B.cx - A.cx, dy = B.cy - A.cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, [x1, y1] = clip(A, ux, uy), [x2, y2] = clip(B, -ux, -uy), ax = x2! - ux * 12, ay = y2! - uy * 12, px = -uy * 6, py = ux * 6, r = (v: number) => v.toFixed(1); return { d: "M " + r(x1!) + " " + r(y1!) + " L " + r(ax) + " " + r(ay), ar: r(x2!) + "," + r(y2!) + " " + r(ax + px) + "," + r(ay + py) + " " + r(ax - px) + "," + r(ay - py) }; });
    const fclick = (id: string) => { const f = D("flow"); if (f.conn && f.conn !== id) { setD("flow", (x: any) => ({ edges: x.edges.some((e: any) => e.a === x.conn && e.b === id) ? x.edges : [...x.edges, { a: x.conn, b: id }], conn: null, sel: id })); return; } setD("flow", { sel: id, conn: null }); };
    const fdown = (e: React.PointerEvent, id: string) => {
      if (e.button) return; e.preventDefault(); const n = (F.nodes as any[]).find((x) => x.id === id); if (!n) return;
      const x0 = e.clientX, y0 = e.clientY, nx = n.x, ny = n.y, t = FT[n.type]!; let moved = false, lx = nx, ly = ny;
      const mv = (ev: PointerEvent) => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return; moved = true; lx = Math.max(0, Math.min(CW - t.w, nx + dx)); ly = Math.max(0, Math.min(CH - t.h, ny + dy)); setUi({ fdrag: { id, x: lx, y: ly } }); };
      const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); if (moved) { setD("flow", (f: any) => ({ nodes: f.nodes.map((m: any) => (m.id === id ? { ...m, x: lx, y: ly } : m)) })); setUi({ fdrag: null }); } else fclick(id); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    };
    const nodes = nodes0.map((n) => { const t = FT[n.type]!; return { id: n.id, l: n.x + "px", tp: n.y + "px", w: t.w + "px", h: t.h + "px", t: n.t || t.l, isDec: n.type === "dec", notDec: n.type !== "dec", rad: n.type === "end" ? "50%" : n.type === "cloud" ? "46% 54% 42% 58% / 58% 44% 56% 42%" : n.type === "doc" ? "4px 4px 18px 4px" : "14px", sh: n.type === "doc" ? "5px 5px 0 -2px #dbe7f6, 5px 5px 0 0 #3b6fb6, 10px 10px 0 -2px #dbe7f6, 10px 10px 0 0 #3b6fb6" : "none", bs: n.type === "cloud" ? "dashed" : "solid", out: F.conn === n.id ? "3px dashed #ff3d8f" : F.sel === n.id ? "3px solid #ff3d8f" : "none", pain: !!n.pain, down: (ev: React.PointerEvent) => fdown(ev, n.id) }; });
    const sel = by[F.sel];
    const add = (ty2: string) => { const k = (F.nodes as any[]).length, id = uid("n"); setD("flow", (f: any) => ({ nodes: [...f.nodes, FN(id, ty2, 40 + (k % 6) * 150, 40 + Math.floor(k / 6) * 130 + (k % 2) * 20, FT[ty2]!.l)], sel: id })); };
    const mapSel = (f: (m: any) => any) => setD("flow", (x: any) => ({ nodes: x.nodes.map((m: any) => (m.id === sel.id ? { ...m, ...f(m) } : m)) }));
    T.flow = { nodes, edges, empty: !nodes0.length, cw: CW + "px", ch: CH + "px", hasSel: !!sel, noSel: !sel, connOn: !!F.conn, connHint: F.conn ? "Click the step this one leads to…" : "",
      pal: Object.keys(FT).map((k) => ({ l: FT[k]!.l, go: () => add(k), sh: k })), bg: (ev: React.MouseEvent) => { if (ev.target === ev.currentTarget) setD("flow", { sel: null, conn: null }); },
      loadEx: () => setD("flow", { nodes: FLOW_EX.nodes, edges: FLOW_EX.edges, sel: null, conn: null }), clear: () => setD("flow", { nodes: [], edges: [], sel: null, conn: null }),
      pains: nodes0.filter((n) => n.pain).map((n) => ({ t: n.t, note: n.painT || "No note yet", go: () => setD("flow", { sel: n.id }) })), nPain: nodes0.filter((n) => n.pain).length, nSteps: nodes0.length,
      sel: sel ? { t: sel.t, set: val((v) => mapSel(() => ({ t: v }))), types: Object.keys(FT).map((k) => ({ l: FT[k]!.l, bg: sel.type === k ? "#14123a" : "#fff", fg: sel.type === k ? "#fff" : "#14123a", go: () => mapSel(() => ({ type: k })) })),
        pain: !!sel.pain, painBg: sel.pain ? "#ef5b5b" : "#fff", painFg: sel.pain ? "#fff" : "#14123a", togglePain: () => mapSel((m) => ({ pain: !m.pain })), painT: sel.painT || "", setPain: val((v) => mapSel(() => ({ painT: v }))),
        conn: () => setD("flow", { conn: sel.id }), del: () => setD("flow", (f: any) => ({ nodes: f.nodes.filter((m: any) => m.id !== sel.id), edges: f.edges.filter((x: any) => x.a !== sel.id && x.b !== sel.id), sel: null })),
        outs: (F.edges as any[]).filter((x) => x.a === sel.id && by[x.b]).map((x) => ({ t: by[x.b].t, del: () => setD("flow", (f: any) => ({ edges: f.edges.filter((y: any) => !(y.a === x.a && y.b === x.b)) })) })) } : { t: "", types: [], outs: [] } };
  }

  /* 2-12 strategic themes */
  if (K === "theme") {
    const d = D("theme"), krs: ReturnType<typeof KR>[] = d.krs || [KR("Increase", "", "", "", "", ""), KR("Increase", "", "", "", "", ""), KR("Reduce", "", "", "", "", "")];
    const setK = (i: number, p: any) => setD("theme", (x: any) => ({ krs: (x.krs || krs).map((r: any, j: number) => (j === i ? { ...r, ...p } : r)) }));
    const num = (v: string) => v !== "" && !isNaN(parseFloat(v));
    const rows = krs.map((r, i) => { const meas = num(r.f) && num(r.to), grad = meas && parseFloat(r.f) !== parseFloat(r.to), v2 = r.m.trim().length > 3 && !/\b(build|deliver|launch|release|implement|develop|create|ship|deploy)\b/i.test(r.m);
      const ck = (ok: boolean, l: string, tip: string) => ({ l, tip, bg: ok ? "#cfe8d4" : "#fff4c2", mark: ok ? "✓" : "!" });
      return { n: i + 1, v: r.v, verbs: VERBS.map((o) => ({ o, sel: o === r.v })), setV: val((v) => setK(i, { v })), m: r.m, setM: val((v) => setK(i, { m: v })), f: r.f, setF: val((v) => setK(i, { f: v })), to: r.to, setTo: val((v) => setK(i, { to: v })), u: r.u, setU: val((v) => setK(i, { u: v })), by: r.by, setBy: val((v) => setK(i, { by: v })),
        sentence: r.m ? r.v + " " + r.m + (meas ? " from " + r.f + r.u + " to " + r.to + r.u : "") + (r.by ? " by " + r.by : "") : "Your key result reads here as you type…", ok: meas && grad && v2, checks: [ck(v2, "Value-based", "An outcome, not an output like “build” or “launch”"), ck(meas, "Measurable", "Has a start and a target number"), ck(grad, "Gradable", "Progress can be scored between start and target")], del: () => setD("theme", (x: any) => ({ krs: (x.krs || krs).filter((_: any, j: number) => j !== i) })) }; });
    const pass = rows.filter((r) => r.ok).length, th = THEMES.find((t) => t.id === d.pick);
    T.theme = { cards: THEMES.map((t) => ({ ...t, bd: d.pick === t.id ? "#ff3d8f" : "#14123a", sh: d.pick === t.id ? "6px 6px 0 #ff3d8f" : "3px 3px 0 #14123a", go: () => setD("theme", { pick: t.id }) })), ownBd: d.pick === "own" ? "#ff3d8f" : "#14123a", own: d.own, setOwn: val((v) => setD("theme", { own: v, pick: "own" })), pickOwn: () => setD("theme", { pick: "own" }),
      title: th ? th.t : d.own || "Write your own Strategic Theme", ic: th ? th.ic : "✍", rows, pass, need: Math.max(0, 3 - pass), score: pass + " of " + rows.length + " key results pass all three checks", ring: Math.min(100, (pass / 3) * 100), ringC: pass >= 3 ? "#1fb89a" : "#ff6a1f",
      add: () => setD("theme", (x: any) => ({ krs: [...(x.krs || krs), KR("Increase", "", "", "", "", "")] })), loadEx: () => setD("theme", (x: any) => ({ krs: (KR_EX[x.pick] || KR_EX.hc)!.map((r) => ({ ...r })) })) };
  }

  /* 2-17 portfolio canvas */
  if (K === "pc") {
    const d = D("pc"), pl: Record<string, string> = d.pl || {}, placed = (n: number) => pl[n];
    const place = (n: number | null, cell: string) => { if (n == null) return; setD("pc", (x: any) => ({ pl: { ...x.pl, [n]: cell }, sel: null })); };
    const chip = (it: [number, string, string]) => ({ n: it[0], t: it[1], c: PC_COL[(it[0] - 1) % 4], ol: d.sel === it[0] ? "3px solid #ff3d8f" : "none", ds: (ev: React.DragEvent) => { dragPc = it[0]; try { ev.dataTransfer.setData("text/plain", String(it[0])); } catch { /* no transfer */ } }, go: () => setD("pc", { sel: d.sel === it[0] ? null : it[0] }) });
    const cell = (c2: [string, string, string, string]) => ({ k: c2[0], label: c2[1], ic: c2[3], items: PC_ITEMS.filter((it) => placed(it[0]) === c2[0]).map((it) => { const ok = it[2] === c2[0]; return { ...chip(it), mark: d.chk ? (ok ? "✓" : "✕") : "", mk: d.chk ? "inline-grid" : "none", mbg: ok ? "#1fb89a" : "#c8372d", back: () => setD("pc", (x: any) => { const p = { ...x.pl }; delete p[it[0]]; return { pl: p }; }) }; }), over: (ev: React.DragEvent) => ev.preventDefault(), drop: (ev: React.DragEvent) => { ev.preventDefault(); place(dragPc, c2[0]); dragPc = null; }, go: () => place(d.sel, c2[0]), hl: d.sel != null ? "#fff9dc" : "#fff" });
    const ok = PC_ITEMS.filter((it) => placed(it[0]) === it[2]).length, nPl = Object.keys(pl).length;
    T.pc = { tray: PC_ITEMS.filter((it) => !placed(it[0])).map(chip), trayEmpty: PC_ITEMS.every((it) => placed(it[0])), vp: PC_CELLS.filter((c2) => c2[2] === "vp").map(cell), k: PC_CELLS.filter((c2) => c2[2] === "k").map(cell), c: PC_CELLS.filter((c2) => c2[2] === "c").map(cell),
      stat: nPl + " of 12 placed" + (d.chk ? " · " + ok + " match the answer key" : ""), chkLabel: d.chk ? "Hide check" : "Check placement", check: () => setD("pc", (x: any) => ({ chk: !x.chk })), reset: () => setD("pc", { pl: { 2: "cost" }, chk: false, sel: null }), reveal: () => setD("pc", { pl: Object.fromEntries(PC_ITEMS.map((it) => [it[0], it[2]])), chk: true }),
      hint: d.sel != null ? "Item " + d.sel + " picked up: click a block to drop it." : "Drag a numbered item onto the canvas, or click it and then click a block." };
  }

  /* 2-21 SWOT / TOWS */
  if (K === "swot") {
    const d = D("swot");
    const box = (q: "S" | "W" | "O" | "T") => ({ q, c: SWC[q]![0], label: SWC[q]![1], items: (d[q] as string[]).map((t, i) => { const key = q + ":" + i, on = d.pi === key || d.pe === key; return { t, bg: on ? SWC[q]![0] : "#fff", fg: on ? "#fff" : "#14123a", go: () => setD("swot", /[SW]/.test(q) ? { pi: d.pi === key ? null : key } : { pe: d.pe === key ? null : key }), del: () => setD("swot", (x: any) => ({ [q]: x[q].filter((_: string, j: number) => j !== i), pi: null, pe: null })) }; }), add: (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD("swot", (x: any) => ({ [q]: [...x[q], v] })); } } });
    const gi = (k: string | null) => (k ? d[k[0]!][+k.split(":")[1]!] : null), I = gi(d.pi), E = gi(d.pe), cellKey = d.pi && d.pe ? d.pi[0] + d.pe[0] : "";
    const cell = (k: string) => ({ k, q: TOWS_Q[k], big: k, cards: ((d.out[k] as any[]) || []).map((c2, i) => ({ t: c2.t, star: c2.star ? "★" : "☆", starC: c2.star ? "#f2b01e" : "#8a8a99", set: val((v) => setD("swot", (x: any) => ({ out: { ...x.out, [k]: x.out[k].map((y: any, j: number) => (j === i ? { ...y, t: v } : y)) } }))), tog: () => setD("swot", (x: any) => ({ out: { ...x.out, [k]: x.out[k].map((y: any, j: number) => (j === i ? { ...y, star: !y.star } : y)) } })), del: () => setD("swot", (x: any) => ({ out: { ...x.out, [k]: x.out[k].filter((_: any, j: number) => j !== i) } })) })), add: (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD("swot", (x: any) => ({ out: { ...x.out, [k]: [...(x.out[k] || []), { t: v, star: false }] } })); } }, hl: cellKey === k ? "#fff4c2" : "#fff" });
    const nOpt = (Object.values(d.out) as any[][]).reduce((a, l) => a + l.length, 0);
    T.swot = { S: box("S"), W: box("W"), O: box("O"), T: box("T"), SO: cell("SO"), ST: cell("ST"), WO: cell("WO"), WT: cell("WT"), qs: Object.keys(TOWS_Q).map((k) => ({ k, q: TOWS_Q[k] })),
      mixI: I || "Pick a strength or weakness", mixE: E || "Pick an opportunity or threat", canMix: !!(I && E), mixTo: cellKey ? "→ " + cellKey : "", mixBg: I && E ? "#14123a" : "#8a8a99",
      mix: () => { if (!I || !E) return; setD("swot", (x: any) => ({ out: { ...x.out, [cellKey]: [...(x.out[cellKey] || []), { t: TOWS_T[cellKey]!(I, E), star: false }] }, pi: null, pe: null })); }, stat: nOpt + " strategic option" + (nOpt === 1 ? "" : "s") + " · " + (Object.values(d.out) as any[][]).flat().filter((c2) => c2.star).length + " starred" };
  }

  /* 2-24 future states */
  if (K === "fut") {
    const d = D("fut"), P: Record<string, string> = D("pc").pl || {}, any = Object.keys(P).length > 1, src = any ? "From your canvas exercise" : "TTC current state (answer key)";
    const curOf = (k: string) => PC_ITEMS.filter((it) => (any ? P[it[0]] : it[2]) === k).map((it) => it[1]).join(" · ");
    const swot = D("swot"), opts = (Object.entries(swot.out) as [string, any[]][]).flatMap(([k, l]) => l.map((c2) => ({ k, ...c2 }))), starred = opts.filter((c2) => c2.star), insp = (starred.length ? starred : opts).slice(0, 8).map((c2) => ({ k: c2.k, t: c2.t }));
    const rows = PC_CELLS.map((c2) => { const f = (d.f || {})[c2[0]] || "", cu = curOf(c2[0]), st = !f ? "KEEP" : cu ? "CHANGE" : "NEW"; return { k: c2[0], label: c2[1], ic: c2[3], cur: cu || "—", f, set: val((v) => setD("fut", (x: any) => ({ f: { ...x.f, [c2[0]]: v } }))), st, stBg: st === "KEEP" ? "#eef2f7" : st === "NEW" ? "#cfe8d4" : "#ffd37a" }; });
    const changed = rows.filter((r) => r.st !== "KEEP");
    const addEp = () => { const x = D("fut"); if (!x.nn.trim()) return; setD("fut", (y: any) => ({ ep: [...y.ep, { id: uid("E"), t: y.nt, n: y.nn.trim(), c: y.nc }], nn: "" })); };
    T.fut = { rows, src, insp, hasInsp: insp.length > 0, nChanged: changed.length, epics: (d.ep as any[]).map((x) => ({ t: x.t, n: x.n, from: x.c ? (PC_CELLS.find((c2) => c2[0] === x.c) || [, ""])[1] : "", bg: x.t === "Epic" ? "#4a64b0" : "#a84a44", del: () => setD("fut", (y: any) => ({ ep: y.ep.filter((z: any) => z.id !== x.id) })) })), noEp: !d.ep.length,
      types: ["Epic", "Enabler"].map((t) => ({ t, bg: d.nt === t ? (t === "Epic" ? "#4a64b0" : "#a84a44") : "#fff", fg: d.nt === t ? "#fff" : "#14123a", go: () => setD("fut", { nt: t }) })), nn: d.nn, setNn: val((v) => setD("fut", { nn: v })), kd: (ev: KeyEv) => { if (ev.key === "Enter") { const v = (ev.target as HTMLInputElement).value.trim(); if (v) setD("fut", (y: any) => ({ ep: [...y.ep, { id: uid("E"), t: y.nt, n: v, c: y.nc }], nn: "" })); } }, add: addEp,
      copts: [{ id: "", t: "Linked canvas block…", sel: !d.nc }, ...changed.map((r) => ({ id: r.k, t: r.label, sel: d.nc === r.k }))], ncVal: d.nc, setNc: val((v) => setD("fut", { nc: v })) };
  }

  /* 2-33 market rhythms and milestones */
  if (K === "mr") {
    const d = D("mr"), X = (i: number) => 70 + i * 55 + 27, Y = (v: number) => 260 - v * 20;
    const path = (v: number[]) => { const p = v.map((y, i) => [X(i), Y(y)] as [number, number]); let dd = "M " + p[0]![0] + " " + p[0]![1]; for (let i = 0; i < p.length - 1; i++) { const p0 = p[i - 1] || p[i]!, p1 = p[i]!, p2 = p[i + 1]!, p3 = p[i + 2] || p2; dd += " C " + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ", " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ", " + p2[0] + " " + p2[1]; } return dd; };
    const sel = IND.filter((x) => d.inds.includes(x.id)), ev0: any[] = d.ev || [];
    T.mr = { inds: IND.map((x) => { const on = d.inds.includes(x.id); return { n: x.n, c: x.c, bg: on ? x.c : "#fff", fg: on ? "#fff" : "#14123a", go: () => setD("mr", (y: any) => ({ inds: on ? y.inds.filter((z: string) => z !== x.id) : [...y.inds, x.id].slice(-4) })) }; }),
      lines: sel.map((x) => ({ d: path(x.v), c: x.c })), mine: path(d.mine), months: MO.map((m, i) => ({ m, x: X(i), q: i % 3 === 1 ? "Q" + (Math.floor(i / 3) + 1) : "", win: !!d.win[i], wx: X(i) - 27, wop: d.win[i] ? 1 : 0, tog: () => setD("mr", (y: any) => ({ win: { ...y.win, [i]: !y.win[i] } })), wbg: d.win[i] ? "#cfe8d4" : "#fff", wfg: d.win[i] ? "#1f6b3a" : "#8a8a99" })),
      qlines: [0, 3, 6, 9, 12].map((i) => ({ x: 70 + i * 55 })),
      evs: ev0.map((v, j) => { const t = EVT.find((z) => z[0] === v.ty) || EVT[0]!; const y = 40 + (j % 3) * 22; return { x: X(v.m), y, ly: 34 + (j % 3) * 22, n: v.n, c: t[2], dia: X(v.m) + "," + (y - 8) + " " + (X(v.m) + 8) + "," + y + " " + X(v.m) + "," + (y + 8) + " " + (X(v.m) - 8) + "," + y, anchor: v.m > 8 ? "end" : "start", lx: v.m > 8 ? X(v.m) - 12 : X(v.m) + 12 }; }),
      bars: (d.mine as number[]).map((v, i) => ({ m: MO[i]![0], h: v * 10 + "%", v, go: () => setD("mr", (y: any) => ({ mine: y.mine.map((z: number, j: number) => (j === i ? (z >= 10 ? 0 : z + 2) : z)) })) })),
      copy: () => { const f = sel[0]; if (f) setD("mr", { mine: f.v.slice() }); }, copyL: sel[0] ? "Start from " + sel[0].n : "Pick an industry first", resetMine: () => setD("mr", { mine: TTC0.slice() }),
      tips: sel.map((x) => ({ n: x.n, c: x.c, t: x.tip })),
      evList: ev0.map((v) => { const t = EVT.find((z) => z[0] === v.ty) || EVT[0]!; return { n: v.n, ty: t[1], c: t[2], m: MO[v.m], del: () => setD("mr", (y: any) => ({ ev: y.ev.filter((z: any) => z.id !== v.id) })) }; }),
      en: d.en, setEn: val((v) => setD("mr", { en: v })), etypes: EVT.map((t) => ({ id: t[0], t: t[1], sel: d.et === t[0] })), etVal: d.et, setEt: val((v) => setD("mr", { et: v })), emonths: MO.map((m, i) => ({ id: String(i), t: m, sel: +d.em === i })), emVal: String(d.em), setEm: val((v) => setD("mr", { em: +v })),
      addEv: () => { const x = D("mr"); if (!x.en.trim()) return; setD("mr", (y: any) => ({ ev: [...(y.ev || []), { id: uid("e"), n: y.en.trim(), ty: y.et, m: +y.em }], en: "" })); },
      winTxt: (() => { const w = MO.filter((_, i) => d.win[i]); return w.length ? "Release windows: " + w.join(", ") : "Click months below the chart to mark release windows."; })() };
  }

  /* 3-16 epic hypothesis (same table as the PI planning board) */
  if (K === "epic") {
    const d = D("epic"), fu = D("fut"), today = new Date().toISOString().slice(0, 10);
    const set = (k: string) => val((v) => setD("epic", { [k]: v }));
    const pitch = EPF.every((f) => d[f[0]]) ? EPF.map((f) => f[1] + " " + d[f[0]]).join(", ") + "." : "";
    T.epic = { date: d.date || today, setDate: set("date"), name: d.name, setName: set("name"), owner: d.owner, setOwner: set("owner"), desc: EPF.map((f) => ({ label: f[1], ph: "<" + f[2] + ">", v: d[f[0]] || "", set: set(f[0]) })), bo: d.bo, setBo: set("bo"), li: d.li, setLi: set("li"), nfr: d.nfr, setNfr: set("nfr"),
      pitch: pitch || "Fill in For … our Solution and the elevator pitch writes itself here.", hasPitch: !!pitch, sugg: (fu.ep as any[]).filter((x) => x.t === "Epic").map((x) => ({ n: x.n, go: () => setD("epic", { name: x.n }) })), hasSugg: (fu.ep as any[]).some((x) => x.t === "Epic"),
      loadEx: () => setD("epic", { ...EP_EX, date: today }), clear: () => setD("epic", { ...DEF.epic, ...Object.fromEntries(EPF.map((f) => [f[0], ""])) }), filled: ["name", "owner", "bo", "li", "nfr", ...EPF.map((f) => f[0])].filter((k) => d[k]).length + " / 12 fields" };
  }

  /* 3-17 Lean business case */
  if (K === "lbc") {
    const d = D("lbc"), ep = D("epic");
    const sum: Record<string, number> = Object.fromEntries(LBT.map((t) => [t[0], 0])); (Object.values(d.tag) as string[]).forEach((v) => { if (sum[v] != null) sum[v]!++; });
    const pre: Record<string, string> = { "Epic Owner": ep.owner, "Epic Description": ep.name ? ep.name + (ep.for ? ": for " + ep.for + "…" : "") : "", "Business Outcome Hypothesis": ep.bo, "Leading Indicators": ep.li, "Nonfunctional Requirements": ep.nfr, "Funnel Entry Date": ep.date };
    T.lbc = { qs: qcards("lbc", cfg.qs), groups: LBC.map(([g, rows]) => ({ g, hasG: !!g, rows: rows.map((r) => { const t = d.tag[r] || ""; return { r, pre: pre[r] || "", hasPre: !!pre[r], adapt: t === "adapt", note: (d.note || {})[r] || "", setNote: val((v) => setD("lbc", (x: any) => ({ note: { ...x.note, [r]: v } }))), bg: t ? (LBT.find((z) => z[0] === t) || [, , "#fff"])[2] : "#fff", tags: LBT.map((z) => ({ l: z[1], bg: t === z[0] ? z[2] : "#fff", bw: t === z[0] ? "2px" : "1.5px", go: () => setD("lbc", (x: any) => ({ tag: { ...x.tag, [r]: x.tag[r] === z[0] ? "" : z[0] } })) })) }; }) })),
      sum: LBT.map((z) => ({ l: z[1], n: sum[z[0]], bg: z[2] })), fromEpic: ep.name ? "Prefilled from your Epic: " + ep.name : "Tip: describe the Epic in 3-16 first and its fields appear here." };
  }

  /* 3-29 pivots */
  if (K === "piv") {
    const d = D("piv");
    T.piv = { arms: PIV.map((p, i) => ({ k: p[0], t: p[1].replace(" pivot", ""), c: p[2], on: d.sel === p[0], bg: d.sel === p[0] ? p[2] : "#fff", fg: d.sel === p[0] ? "#fff" : p[2], go: () => setD("piv", { sel: p[0] }), pos: ["left:0;top:58%", "left:14%;top:4%", "right:14%;top:4%", "right:0;top:58%"][i], rot: ["180deg", "-120deg", "-60deg", "0deg"][i] })),
      boxes: PIV.map((p) => ({ k: p[0], t: p[1], c: p[2], d: p[3], ex: p[4], bw: d.sel === p[0] ? "4px" : "2.5px", sh: d.sel === p[0] ? "6px 6px 0 " + p[2] : "none", go: () => setD("piv", { sel: p[0] }), ...stickyList("piv", "n_" + p[0]) })),
      picks: [{ id: "", t: "Which pivot would have helped?", sel: !d.pick }, ...PIV.map((p) => ({ id: p[0], t: p[1], sel: d.pick === p[0] }))], pickVal: d.pick, setPick: val((v) => setD("piv", { pick: v, sel: v || d.sel })), sit: d.sit, setSit: val((v) => setD("piv", { sit: v })), fix: d.fix, setFix: val((v) => setD("piv", { fix: v })) };
  }

  /* 4-12 Lean budget guardrails */
  if (K === "grd") {
    const d = D("grd"), hs = HOR.reduce((a, h) => a + (+d.hor[h[0]] || 0), 0), cs = CAP.reduce((a, c2) => a + (+d.cap[c2[0]] || 0), 0);
    let acc = 0; const grad = CAP.map((c2) => { const a = acc; acc += +d.cap[c2[0]] || 0; return c2[2] + " " + (cs ? (a / cs) * 360 : 0) + "deg " + (cs ? (acc / cs) * 360 : 0) + "deg"; }).join(", ");
    const thr = +d.thr || 0;
    T.grd = { hor: HOR.map((h) => { const v = +d.hor[h[0]] || 0; return { k: h[0], h: h[1], st: h[2], d: h[3], v, pie: "conic-gradient(#7fb0b0 0deg " + v * 3.6 + "deg, #e7eeee " + v * 3.6 + "deg 360deg)", set: val((s) => { const x = Math.max(0, Math.min(100, +s || 0)); setD("grd", (y: any) => ({ hor: { ...y.hor, [h[0]]: x } })); }) }; }), hSum: hs, hOk: hs === 100, hMsg: hs === 100 ? "✓ Adds up to 100%" : "Adds up to " + hs + "%: aim for 100%", hBg: hs === 100 ? "#cfe8d4" : "#ffd6cf",
      cap: CAP.map((c2) => ({ k: c2[0], t: c2[1], c: c2[2], v: +d.cap[c2[0]] || 0, set: val((s) => { const x = Math.max(0, Math.min(100, +s || 0)); setD("grd", (y: any) => ({ cap: { ...y.cap, [c2[0]]: x } })); }) })), pie: "conic-gradient(" + (grad || "#eee 0deg 360deg") + ")", cSum: cs, cMsg: cs === 100 ? "✓ 100% of capacity allocated" : cs + "% allocated: aim for 100%", cBg: cs === 100 ? "#cfe8d4" : "#ffd6cf",
      thr, thrTxt: money(thr), setThr: val((s) => setD("grd", { thr: Math.max(0, +String(s).replace(/[^0-9]/g, "") || 0) })), presets: [250000, 500000, 1000000, 2000000].map((v) => ({ t: money(v), bg: thr === v ? "#14123a" : "#fff", fg: thr === v ? "#fff" : "#14123a", go: () => setD("grd", { thr: v }) })),
      above: PB_ITEMS.filter((i) => !i.sol && i.c >= thr).map((i) => ({ t: i.n, c: money(i.c) })), below: PB_ITEMS.filter((i) => !i.sol && i.c < thr).map((i) => ({ t: i.n, c: money(i.c) })),
      roles: BO_ROLES.map((r) => ({ r, on: d.bo.includes(r), bg: d.bo.includes(r) ? "#7b5ea7" : "#fff", fg: d.bo.includes(r) ? "#fff" : "#14123a", go: () => setD("grd", (y: any) => ({ bo: y.bo.includes(r) ? y.bo.filter((z: string) => z !== r) : [...y.bo, r] })) })), ...stickyList("grd", "bon") };
  }

  /* generic discussion (Class Studio layout) */
  if (K === "disc") T.disc = { qs: qcards("disc:" + exId, cfg.qs || [], cfg.qc), hasEx: !!cfg.exs, ex: cfg.exs || [], grid: cfg.cols === 2 ? "repeat(auto-fit,minmax(min(100%,380px),1fr))" : "repeat(auto-fit,minmax(min(100%,300px),1fr))", banner: cfg.banner || "", hasBanner: !!cfg.banner, num: cfg.qc ? "none" : "flex" };

  /* 4-26 business context */
  if (K === "ctx") {
    const d = D("ctx"), need = PB_ITEMS.reduce((a, i) => a + i.c, 0);
    T.ctx = { budget: money(PB_BUDGET), need: money(need), gap: money(PB_BUDGET - need), pct: Math.round((PB_BUDGET / need) * 100) + "%", themes: PB_THEMES.map((t, i) => ({ n: i + 1, t })),
      roles: PB_ROLES.map((r) => ({ r: r[0], p: r[1], bg: d.role === r[0] ? "#14123a" : "#fff", fg: d.role === r[0] ? "#fff" : "#14123a", go: () => setD("ctx", { role: d.role === r[0] ? "" : r[0] }) })), role: d.role || "Pick a role to play in the simulation", qs: qcards("ctx", cfg.qs) };
  }

  /* 4-28 participatory budgeting: one event for the class, each team a table */
  if (K === "pb") {
    const teams = classTeams(c.board), tables = teams.length ? teams.map((t) => ({ id: t.id, name: t.name })) : [{ id: "class", name: "The class" }];
    const tid: string = tables.some((t) => t.id === ui.table) ? ui.table : tables.some((t) => t.id === c.team) ? (c.team as string) : tables[0]!.id;
    const gName = (g: string) => tables.find((t) => t.id === g)?.name ?? g;
    const CF = { ...PB_DEFCFG(), ...rec("pbcfg") }, VIEW: string = ui.pbView === "cfg" && !c.trainer ? "bid" : ui.pbView || "bid";
    const setCF = (f: any) => { const c0 = { ...PB_DEFCFG(), ...rec("pbcfg") }; op({ key: "pbcfg", op: "set", value: { ...c0, ...(typeof f === "function" ? f(c0) : f) } }); };
    const ITEMS = CF.vs.flatMap((v: any) => v.items.map((it: any) => ({ ...it, vsId: v.id, vsN: v.n, vsC: v.c })));
    const memOf = (g: string) => Math.max(1, Math.min(12, +((CF.mem || {})[g] ?? CF.members) || 1)), perOf = (g: string) => (+CF.budget || 0) / memOf(g);
    const bidsOf = (g: string): Record<string, number> => rec("pbbids:" + g), tot = (g: string, id: string) => Array.from({ length: memOf(g) }, (_, p) => +(bidsOf(g)[p + ":" + id] || 0)).reduce((a, x) => a + x, 0), spent = (g: string, p: number) => ITEMS.reduce((a: number, it: any) => a + +(bidsOf(g)[p + ":" + it.id] || 0), 0);
    const full = (g: string, id: string) => { const it = ITEMS.find((i: any) => i.id === id); return !!it && tot(g, id) >= it.c; };
    const ppl = memOf(tid), per = perOf(tid), me = Math.min(+(ui.pbWho || 0), ppl - 1), mine = (id: string) => +(bidsOf(tid)[me + ":" + id] || 0);
    const bid = (id: string, v: number) => op({ key: "pbbids:" + tid, op: "set", value: { ...bidsOf(tid), [me + ":" + id]: Math.max(0, v) } });
    const warnOf = (g: string) => { const w: string[] = [], seen: Record<string, number> = {};
      CF.vs.forEach((v: any) => { const sols = v.items.filter((i: any) => i.sol); if (!sols.length) return; const ok = sols.every((i: any) => full(g, i.id)); if (!ok) v.items.filter((i: any) => !i.sol && tot(g, i.id) > 0).forEach((i: any) => w.push(i.n + ": funded while the " + v.n + " Solution is not fully funded. Fund Solutions before Epics.")); });
      ITEMS.forEach((i: any) => { if (i.req && tot(g, i.id) > 0 && !full(g, i.req)) { const r = ITEMS.find((z: any) => z.id === i.req); w.push(i.n + " can only be funded if " + (r ? r.n : i.req) + " is fully funded."); }
        if (i.ex && tot(g, i.id) > 0 && tot(g, i.ex) > 0) { const k2 = [i.id, i.ex].sort().join("|"); if (!seen[k2]) { seen[k2] = 1; const r = ITEMS.find((z: any) => z.id === i.ex); w.push(i.n + " and " + (r ? r.n : i.ex) + " are both funded: choose one."); } } });
      return w; };
    const warn = warnOf(tid), myLeft = per - spent(tid, me), grpSpent = ITEMS.reduce((a: number, it: any) => a + tot(tid, it.id), 0), need = ITEMS.reduce((a: number, it: any) => a + (+it.c || 0), 0);
    const pname = (g: string, p: number) => ((CF.names || {})[g] || [])[p] || "P" + (p + 1);
    const view = (k: string) => setUi({ pbView: k });
    const money2 = (n: number) => money(n);
    T.pb = { gName: gName(tid), tableChips: tables.map((t) => ({ n: t.name, bg: t.id === tid ? "#14123a" : "#fff", fg: t.id === tid ? "#fff" : "#14123a", go: () => setUi({ table: t.id, pbWho: 0 }) })), canPickTable: c.trainer || !c.team || tables.length === 1,
      tabs: [["bid", "Bid as a table"], ["res", "Consolidated results"], ...(c.trainer ? [["cfg", "⚙ Set up template"]] : [])].map(([k, l]) => ({ l, bg: VIEW === k ? "#14123a" : "#fff", fg: VIEW === k ? "#fff" : "#14123a", go: () => view(k!) })), isBid: VIEW === "bid", isRes: VIEW === "res", isCfg: VIEW === "cfg",
      budget: money2(+CF.budget || 0), need: money2(need), gap: money2((+CF.budget || 0) - need), ppl, setPpl: val((s) => { const v = Math.max(1, Math.min(12, +s || 1)); setCF((c0: any) => ({ mem: { ...(c0.mem || {}), [tid]: v } })); }),
      people: Array.from({ length: ppl }, (_, p) => ({ n: pname(tid, p), bg: me === p ? "#ffe14d" : "#fff", left: money2(per - spent(tid, p)), lc: per - spent(tid, p) < 0 ? "#c8372d" : "#5b5b6e", go: () => setUi({ pbWho: p }) })),
      per: money2(per), me: pname(tid, me), myLeft: money2(myLeft), myBar: Math.max(0, Math.min(100, (1 - myLeft / (per || 1)) * 100)) + "%", myC: myLeft < 0 ? "#c8372d" : "#1fb89a", grpSpent: money2(grpSpent), grpLeft: money2((+CF.budget || 0) - grpSpent), grpBar: Math.min(100, (grpSpent / (+CF.budget || 1)) * 100) + "%",
      vs: CF.vs.map((v: any) => ({ v: v.n, c: v.c, items: v.items.map((i: any) => { const t = tot(tid, i.id), m = mine(i.id), f = t >= i.c && i.c > 0; return { id: i.id, n: i.n, d: i.d, tag: i.sol ? "SOLUTION · RUN THE BUSINESS" + (i.hz ? " · " + i.hz : "") : "EPIC · GROW THE BUSINESS", tagBg: i.sol ? "#14123a" : v.c, cost: money2(+i.c || 0), tot: money2(t), mine: money2(m), bar: Math.min(100, (t / (i.c || 1)) * 100) + "%", barC: f ? "#1fb89a" : t ? "#f2b01e" : "#e3ddcf", st: f ? "FULLY FUNDED" : t ? "PARTIAL · " + Math.round((t / (i.c || 1)) * 100) + "%" : "NOT FUNDED", stC: f ? "#1f6b3a" : t ? "#a66b00" : "#8a8a99", bd: i.sol ? "3px" : "2px",
        p50: () => bid(i.id, m + 50000), p100: () => bid(i.id, m + 100000), m50: () => bid(i.id, m - 50000), fill: () => bid(i.id, m + Math.max(0, Math.min(i.c - t, myLeft))), zero: () => bid(i.id, 0) }; }) })),
      warn, hasWarn: warn.length > 0, nWarn: warn.length, clearG: () => op({ key: "pbbids:" + tid, op: "set", value: null }),
      cols: tables.map((t) => { const n = ITEMS.reduce((a: number, it: any) => a + tot(t.id, it.id), 0); return { g: t.name, n: n ? money2(n) : "—" }; }),
      rows: ITEMS.map((i: any) => { const cells = tables.map((t) => { const tt = tot(t.id, i.id), f = tt >= i.c && i.c > 0; return { v: f ? "●" : tt ? "◐" : "", bg: f ? "#cfe8d4" : tt ? "#fff4c2" : "#fff" }; }); return { n: i.n, vc: i.vsC, cost: money2(+i.c || 0), cells, nf: cells.filter((c0) => c0.v === "●").length, np: cells.filter((c0) => c0.v === "◐").length, fw: i.sol ? 800 : 600 }; }),
      vsBars: tables.map((t) => { const tt = ITEMS.reduce((a: number, it: any) => a + tot(t.id, it.id), 0) || 1; return { g: t.name, segs: CF.vs.map((v: any) => { const a = v.items.reduce((z: number, it: any) => z + tot(t.id, it.id), 0); return { c: v.c, w: (a / tt) * 100 + "%", t: v.n + " " + money2(a) }; }), warn: warnOf(t.id).length }; }),
      grid: "220px 80px repeat(" + tables.length + ", minmax(70px,1fr)) 90px", minW: 420 + tables.length * 80, cofund: "https://cofund.scaledagile.com",
      /* template editor */
      cBudget: String(CF.budget), setBudget: val((s) => setCF({ budget: +String(s).replace(/[^0-9]/g, "") || 0 })), cMembers: CF.members, setMembers: val((s) => setCF({ members: Math.max(1, Math.min(12, +s || 1)) })),
      tables: tables.map((t) => ({ g: t.name, m: memOf(t.id), setM: val((s) => { const v = Math.max(1, Math.min(12, +s || 1)); setCF((c0: any) => ({ mem: { ...(c0.mem || {}), [t.id]: v } })); }), per: money2(perOf(t.id)),
        names: Array.from({ length: memOf(t.id) }, (_, p) => ({ v: ((CF.names || {})[t.id] || [])[p] || "", ph: "P" + (p + 1), set: val((v) => setCF((c0: any) => { const nm = { ...(c0.names || {}) }; const arr = [...(nm[t.id] || [])]; arr[p] = v; nm[t.id] = arr; return { names: nm }; })) })) })),
      cvs: CF.vs.map((v: any, vi: number) => { const setV = (f: any) => setCF((c0: any) => ({ vs: c0.vs.map((y: any, j: number) => (j === vi ? { ...y, ...(typeof f === "function" ? f(y) : f) } : y)) })), opts = (cur: string) => [{ id: "", t: "—", sel: !cur }, ...ITEMS.map((z: any) => ({ id: z.id, t: z.id + " · " + z.n.slice(0, 34), sel: cur === z.id }))];
        return { n: v.n, c: v.c, setN: val((s) => setV({ n: s })), cols: VS_COLS.map((col) => ({ col, bw: v.c === col ? "3px" : "1px", go: () => setV({ c: col }) })), del: () => setCF((c0: any) => ({ vs: c0.vs.filter((_: any, j: number) => j !== vi) })), sum: money2(v.items.reduce((a: number, it: any) => a + (+it.c || 0), 0)),
          items: v.items.map((it: any, ii: number) => { const setI = (p: any) => setV((y: any) => ({ items: y.items.map((z: any, k2: number) => (k2 === ii ? { ...z, ...p } : z)) })); return { id: it.id, setId: val((s) => setI({ id: s.trim() })), n: it.n, setN: val((s) => setI({ n: s })), d: it.d, setD: val((s) => setI({ d: s })), c: String(it.c), setC: val((s) => setI({ c: +String(s).replace(/[^0-9]/g, "") || 0 })), solL: it.sol ? "Solution" : "Epic", solBg: it.sol ? "#14123a" : "#fff", solFg: it.sol ? "#fff" : "#14123a", togSol: () => setI({ sol: !it.sol }), req: opts(it.req), reqVal: it.req || "", setReq: val((s) => setI({ req: s })), ex: opts(it.ex), exVal: it.ex || "", setEx: val((s) => setI({ ex: s })), del: () => setV((y: any) => ({ items: y.items.filter((_: any, k2: number) => k2 !== ii) })) }; }),
          addSol: () => setV((y: any) => ({ items: [...y.items, { id: uid("S").slice(0, 5), n: "New Solution", d: "Run the business", c: 1000000, sol: true, req: "", ex: "" }] })), addEp: () => setV((y: any) => ({ items: [...y.items, { id: uid("E").slice(0, 5), n: "New Epic", d: "", c: 250000, sol: false, req: "", ex: "" }] })) }; }),
      addVs: () => setCF((c0: any) => ({ vs: [...c0.vs, { id: uid("v"), n: "New value stream", c: VS_COLS[c0.vs.length % 8], items: [] }] })), resetTpl: () => op({ key: "pbcfg", op: "set", value: PB_DEFCFG() }), clearAll: () => tables.forEach((t) => op({ key: "pbbids:" + t.id, op: "set", value: null })),
      json: JSON.stringify({ budget: CF.budget, members: CF.members, vs: CF.vs }, null, 1), showJson: !!ui.pbJson, togJson: () => setUi({ pbJson: !ui.pbJson }), importJson: val((s) => { try { const o = JSON.parse(s); if (o && Array.isArray(o.vs)) setCF({ budget: +o.budget || CF.budget, members: +o.members || CF.members, vs: o.vs }); } catch { /* not JSON yet */ } }) };
  }

  /* 5-21 portfolio kanban */
  if (K === "pkb") {
    const d = D("pkb"), at: Record<string, string> = d.at || Object.fromEntries(PK_EP.map(([n, c2]) => [n, c2]));
    const move = (n: string, c2: string) => setD("pkb", (x: any) => ({ at: { ...(x.at || at), [n]: c2 } }));
    const EPV: Record<string, any> = d.ep || {}, openN: string = d.open || "", ov = EPV[openN] || {}, setE = (k2: string) => val((v) => setD("pkb", (x: any) => ({ ep: { ...(x.ep || {}), [openN]: { ...((x.ep || {})[openN] || {}), [k2]: v } } })));
    const FILL = ["owner", "bo", "li", "nfr", ...EPF.map((f) => f[0])];
    const pkm = { on: !!openN, name: openN, state: (PKC.find((z) => z[0] === at[openN]) || [, ""])[1], close: () => setD("pkb", { open: "" }), stop: (ev: React.SyntheticEvent) => ev.stopPropagation(), date: ov.date || "", setDate: setE("date"), owner: ov.owner || "", setOwner: setE("owner"), desc: EPF.map((f) => ({ label: f[1], ph: "<" + f[2] + ">", v: ov[f[0]] || "", set: setE(f[0]) })), bo: ov.bo || "", setBo: setE("bo"), li: ov.li || "", setLi: setE("li"), nfr: ov.nfr || "", setNfr: setE("nfr"),
      filled: FILL.filter((k2) => ov[k2]).length + " / 11", prevSt: () => { const i0 = PKC.findIndex((z) => z[0] === at[openN]); move(openN, PKC[Math.max(0, i0 - 1)]![0]); }, nextSt: () => { const i0 = PKC.findIndex((z) => z[0] === at[openN]); move(openN, PKC[Math.min(PKC.length - 1, i0 + 1)]![0]); }, del: () => setD("pkb", (x: any) => { const a2 = { ...(x.at || at) }; delete a2[openN]; return { at: a2, open: "" }; }) };
    T.pkb = { pkm, cols: PKC.map(([k, t, pol, exit, wip0], ci) => { const items = Object.keys(at).filter((n) => at[n] === k), wip = (d.wip || {})[k] ?? wip0, over = wip !== "" && items.length > +wip;
      return { k, t, icon: PKI[k === "mvp" || k === "per" ? "imp" : k], sub: k === "mvp" ? "MVP" : k === "per" ? "Persevere" : "", isImp: k === "mvp" || k === "per", dash: k === "mvp" ? "2px dashed #14123a" : "2px solid #14123a",
        pol: (d.pol || {})[k] || pol, polTxt: ((d.pol || {})[k] || pol).join("\n"), setPol: val((s) => { const v = s.split("\n").map((z) => z.replace(/^[•-]\s*/, "")).filter(Boolean); setD("pkb", (x: any) => ({ pol: { ...x.pol, [k]: v } })); }),
        exit: (d.exit || {})[k] ?? exit, setExit: val((v) => setD("pkb", (x: any) => ({ exit: { ...x.exit, [k]: v } }))), wip, setWip: val((s) => { const v = s.replace(/[^0-9]/g, ""); setD("pkb", (x: any) => ({ wip: { ...x.wip, [k]: v } })); }), hasWip: k !== "fun" && k !== "done", overBg: over ? "#ffd6cf" : "#f4f6f6", overTxt: over ? "WIP " + items.length + "/" + wip + " — over limit" : items.length + (wip !== "" ? "/" + wip : "") + " epics",
        cards: items.map((n) => ({ n, open: () => setD("pkb", { open: n }), pct: FILL.filter((k2) => (EPV[n] || {})[k2]).length, stop: (ev: React.SyntheticEvent) => ev.stopPropagation(), ds: (ev: React.DragEvent) => { dragPk = n; try { ev.dataTransfer.setData("text/plain", n); } catch { /* no transfer */ } }, next: (ev?: React.SyntheticEvent) => { ev?.stopPropagation?.(); move(n, PKC[Math.min(PKC.length - 1, ci + 1)]![0]); }, prev: (ev?: React.SyntheticEvent) => { ev?.stopPropagation?.(); move(n, PKC[Math.max(0, ci - 1)]![0]); } })),
        over: (ev: React.DragEvent) => ev.preventDefault(), drop: (ev: React.DragEvent) => { ev.preventDefault(); if (dragPk) move(dragPk, k); dragPk = ""; }, ...stickyList("pkb", "evo_" + k) }; }),
      addEpic: (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; move(v, "fun"); } }, reset: () => setD("pkb", { at: null, wip: {}, pol: {}, exit: {} }) };
  }

  /* 5-29 WSJF (Leading SAFe template) */
  if (K === "wsjf") {
    const d = D("wsjf"), R: any[] = d.rows || WS_EP.map((x) => ({ n: x[0], d: x[1], c: x[2] })), setR = (i: number, p: any) => setD("wsjf", (x: any) => ({ rows: (x.rows || R).map((y: any, j: number) => (j === i ? { ...y, ...p } : y)) }));
    const minC = Math.min(...R.map((r) => +r.c || Infinity)), opts = (v: any) => WS_SCALE.map((o) => ({ o, sel: String(v) === o }));
    const calc = R.map((r) => { const ok3 = ["u", "t", "rr"].every((k) => r[k]), cod = ok3 ? ["u", "t", "rr"].reduce((a, k) => a + +r[k], 0) : null, nc = isFinite(minC) && +r.c ? Math.round((+r.c / minC) * 10) / 10 : null; return { cod, nc, w: cod != null && nc ? Math.round((cod / nc) * 10) / 10 : null }; }), sorted = calc.map((c2) => c2.w).filter((w): w is number => w != null).sort((a, b) => b - a);
    const colOk = (k: string) => R.some((r) => r[k] === "1");
    const col = (r: any, i: number, k: string) => ({ opts: opts(r[k]), val: r[k] ?? "", blank: !r[k], set: val((v) => setR(i, { [k]: v })) });
    T.wsjf = { rows: R.map((r, i) => ({ name: r.n, d: r.d, cost: money(+r.c || 0), setCost: val((s) => setR(i, { c: +String(s).replace(/[^0-9]/g, "") || 0 })), costRaw: String(r.c || ""), u: col(r, i, "u"), t: col(r, i, "t"), rr: col(r, i, "rr"),
      cod: calc[i]!.cod != null ? String(calc[i]!.cod) : "—", nc: calc[i]!.nc != null ? calc[i]!.nc!.toFixed(1) : "—", wsjf: calc[i]!.w != null ? calc[i]!.w!.toFixed(1) : "—", rank: calc[i]!.w != null ? "#" + (sorted.indexOf(calc[i]!.w!) + 1) : "", bg: calc[i]!.w != null && sorted.indexOf(calc[i]!.w!) === 0 ? "#cfe8d4" : "#f2f2f2" })),
      tips: ([["u", "User-business value"], ["t", "Time criticality"], ["rr", "RR | OE value"]] as [string, string][]).map(([k, l]) => ({ l, ok: colOk(k), mark: colOk(k) ? "✓" : "!", bg: colOk(k) ? "#cfe8d4" : "#fff4c2" })), order: sorted.length === R.length ? "Sequence: " + R.map((r, i) => ({ n: r.n.split(":")[0], w: calc[i]!.w! })).sort((a, b) => b.w - a.w).map((x) => x.n).join(" → ") : "Score every column to see the sequence.",
      reset: () => setD("wsjf", { rows: null }) };
  }

  /* L7 measuring LPM performance */
  if (K === "met") {
    const d = D("met"), cnt: Record<string, number> = Object.fromEntries(MET_T.map((t) => [t[0], 0])); (Object.values(d.tag) as string[]).forEach((v) => { if (cnt[v] != null) cnt[v]!++; });
    T.met = { qs: qcards("met", cfg.qs, cfg.qc), rows: MET.map((m) => { const t = d.tag[m[0]] || ""; return { g: m[0], m: m[1], b: m[2], bg: t ? MET_T.find((z) => z[0] === t)![2] : "#fff", tags: MET_T.map((z) => ({ l: z[1], bg: t === z[0] ? z[2] : "#fff", bw: t === z[0] ? "2px" : "1px", go: () => setD("met", (x: any) => ({ tag: { ...x.tag, [m[0]]: x.tag[m[0]] === z[0] ? "" : z[0] } })) })) }; }), sum: MET_T.map((z) => ({ l: z[1], n: cnt[z[0]], bg: z[2] })) };
  }

  /* generic table template (workshop and L7) */
  if (K === "tbl" || K === "emi") {
    const k = "tbl:" + exId, d = D(k), tc = cfg.tbl ?? { cols: ["Column"], rows: 3, w: "1fr" }, labels: string[] | null = Array.isArray(tc.rows) ? tc.rows : null, n: number = labels ? labels.length : d.n || tc.rows;
    const cell = (r: number, c2: number) => (d.c || {})[r + ":" + c2] || "", setC = (r: number, c2: number) => val((v) => setD(k, (x: any) => ({ c: { ...x.c, [r + ":" + c2]: v } })));
    T.tbl = { w: tc.w, head: (tc.cols as string[]).map((t) => ({ t })), rows: Array.from({ length: n }, (_, r) => ({ cells: (tc.cols as string[]).map((_c, ci) => { const lab = !!labels && ci === 0; const hints: string[] = (tc.hints || {})[labels ? labels[r]! : ""] || []; return { lab, notLab: !lab, t: lab ? labels![r] : "", v: cell(r, ci), set: setC(r, ci), hasHints: ci === 1 && hints.length > 0, hints: ci === 1 ? hints.map((h) => ({ h, go: () => setD(k, (x: any) => ({ c: { ...x.c, [r + ":1"]: h } })) })) : [], ph: ci === 0 && !labels ? "…" : "" }; }), bg: r % 2 ? "#e7ebf3" : "#dfe6f1" })), canAdd: !labels, add: () => setD(k, (x: any) => ({ n: (x.n || tc.rows) + 1 })) };
  }
  if (K === "emi") {
    const d = D("emi");
    T.emi = { qs: [...EMI_Q, ...(d.own as string[])].map((q, i) => ({ q, on: !!d.qs[i], bg: d.qs[i] ? "#cfe8d4" : "#fff", mark: d.qs[i] ? "✓" : "+", go: () => setD("emi", (x: any) => ({ qs: { ...x.qs, [i]: !x.qs[i] } })) })), nPick: Object.values(d.qs).filter(Boolean).length, addQ: (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD("emi", (x: any) => ({ own: [...x.own, v] })); } },
      roles: ([["🎙", "Interviewer", "Asks the questions and keeps the conversation open"], ["📝", "Note taker", "Captures quotes and observations verbatim"], ["👀", "Observer", "Watches body language and what is not said"]] as [string, string, string][]).map((r) => ({ i: r[0], t: r[1], d: r[2] })) };
  }

  /* workshop: pitch */
  if (K === "pitch") {
    const d = D("pitch"), txt = PITCH.map((p) => d[p[0]] || "").join(" "), words = txt.trim() ? txt.trim().split(/\s+/).length : 0, sec = Math.round((words / 130) * 60);
    T.pitch = { ctx: d.ctx, setCtx: val((v) => setD("pitch", { ctx: v })), aud: d.aud, setAud: val((v) => setD("pitch", { aud: v })),
      frames: PITCH.map((p, i) => ({ n: i + 1, k: p[0], q: p[1], c: p[2], v: d[p[0]] || "", set: val((v) => setD("pitch", { [p[0]]: v })), wc: ((d[p[0]] || "").trim() ? (d[p[0]] || "").trim().split(/\s+/).length : 0) + " words" })),
      words, time: Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"), bar: Math.min(100, (sec / 180) * 100) + "%", barC: sec > 200 ? "#c8372d" : sec >= 150 ? "#1fb89a" : "#f2b01e", verdict: !words ? "Start writing: the meter estimates speaking time." : sec > 200 ? "Over three minutes: cut to the essentials." : sec >= 150 ? "Right on three minutes." : "Room for one more example or proof point.",
      aud3: ["Executive sponsor", "Finance", "Business Owners", "Value Stream leaders"].map((a) => ({ a, go: () => setD("pitch", { aud: a }) })) };
  }

  /* workshop: portfolio scope */
  if (K === "scope") {
    const d = D("scope"), add = (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD("scope", (x: any) => ({ ideas: [...x.ideas, { id: uid("i"), t: v, k: "" }] })); } };
    const setK = (id: string, k: string) => setD("scope", (x: any) => ({ ideas: x.ideas.map((i: any) => (i.id === id ? { ...i, k } : i)), pick: k === "pf" ? id : x.pick }));
    const scSel: string = ui.scSel || "";
    const tile = (t: [string, string, string]) => ({ k: t[0], t: t[1], c: t[2], isPf: t[0] === "pf", items: (d.ideas as any[]).filter((i) => i.k === t[0]).map((i) => ({ t: i.t, star: d.pick === i.id ? "★ " : "", back: () => setK(i.id, "") })), over: (ev: React.DragEvent) => ev.preventDefault(), drop: (ev: React.DragEvent) => { ev.preventDefault(); if (dragSc) setK(dragSc, t[0]); dragSc = ""; }, go: () => { if (scSel) { setK(scSel, t[0]); setUi({ scSel: "" }); } } });
    const pk = (d.ideas as any[]).find((i) => i.id === d.pick);
    T.scope = { add, tray: (d.ideas as any[]).filter((i) => !i.k).map((i) => ({ t: i.t, ds: (ev: React.DragEvent) => { dragSc = i.id; try { ev.dataTransfer.setData("text/plain", i.id); } catch { /* no transfer */ } }, go: () => setUi({ scSel: scSel === i.id ? "" : i.id }), ol: scSel === i.id ? "3px solid #ff3d8f" : "none", del: () => setD("scope", (x: any) => ({ ideas: x.ideas.filter((z: any) => z.id !== i.id) })) })), trayEmpty: !(d.ideas as any[]).some((i) => !i.k),
      pf: tile(SCOPE_T[0]!), vs: tile(SCOPE_T[1]!), mi: tile(SCOPE_T[2]!), art: tile(SCOPE_T[3]!), st: tile(SCOPE_T[4]!), picked: pk ? pk.t : "Drop an idea on “Portfolio” to select it", hasPick: !!pk,
      cust: d.cust, setCust: val((v) => setD("scope", { cust: v })), sol: d.sol, setSol: val((v) => setD("scope", { sol: v })),
      loadEx: () => setD("scope", { ideas: ["TTC Autonomous Mobility portfolio", "Autonomous healthcare delivery", "Commercial delivery value stream", "Expand into retail", "Navigation ART"].map((t) => ({ id: uid("i"), t, k: "" })) }) };
  }

  /* workshop: common challenges */
  if (K === "chal") {
    const d = D("chal"), ch = CHAL[d.sel] || CHAL[0]!, k = "chal";
    T.chal = { cards: CHAL.map((x, i) => ({ n: i + 1, t: x[0], bg: d.sel === i ? "#14123a" : "#fff", fg: d.sel === i ? "#fff" : "#14123a", cnt: (d["s" + i] || []).length + " strategies", go: () => setD(k, { sel: i }) })), n: d.sel + 1, t: ch[0], d: ch[1],
      ...stickyList(k, "s" + d.sel), info: stickyList(k, "i" + d.sel), deb: d.deb, debL: d.deb ? "Hide debrief" : "Show debrief: change leadership strategies", togDeb: () => setD(k, { deb: !d.deb }), strat: CHAL_D.map((x) => ({ t: x[0], d: x[1] })), need: Math.max(0, 3 - (d["s" + d.sel] || []).length) };
  }

  /* workshop: next steps board */
  if (K === "nxt") {
    const d = D("nxt"), items = [...NXT0, ...(d.extra as string[])], at: Record<string, number> = d.at || {};
    const move = (t: string, c2: number) => setD("nxt", (x: any) => ({ at: { ...(x.at || {}), [t]: c2 } }));
    T.nxt = { cols: NXT_C.map((c2, ci) => ({ c: c2, items: items.filter((t) => (at[t] || 0) === ci).map((t) => ({ t, ds: (ev: React.DragEvent) => { dragNx = t; try { ev.dataTransfer.setData("text/plain", t); } catch { /* no transfer */ } }, nx: () => move(t, Math.min(3, ci + 1)), pv: () => move(t, Math.max(0, ci - 1)) })), over: (ev: React.DragEvent) => ev.preventDefault(), drop: (ev: React.DragEvent) => { ev.preventDefault(); if (dragNx) move(dragNx, ci); dragNx = ""; }, bg: ci ? "#e7ebf3" : "#f4f1ea" })),
      add: (ev: KeyEv) => { const el = ev.target as HTMLInputElement; if (ev.key === "Enter" && el.value.trim()) { const v = el.value.trim(); el.value = ""; setD("nxt", (x: any) => ({ extra: [...x.extra, v] })); } }, planned: items.filter((t) => at[t]).length + " of " + items.length + " actions scheduled" };
  }

  /* lesson 8: the video */
  if (K === "vid") { const w = !!S["vid:" + exId]; T.vid = { url: /^https?:\/\//i.test(String(cfg.url ?? "")) ? cfg.url : "#", watched: w, wl: w ? "✓ Watched" : "Mark as watched", wbg: w ? "#5ff0e0" : "#fff", go: () => op({ key: "vid:" + exId, op: "set", value: w ? null : true }) }; }

  const kf = Object.fromEntries(K0.map((k) => ["k_" + k, K === k])); kf.k_tbl = K === "tbl" || K === "emi";
  K0.forEach((k) => { if (!T[k]) T[k] = BLANK; });

  // The group wall: this team's stickies for this exercise.
  const WK = "wall:" + exId, wall: string[] = Array.isArray(S[WK]) ? (S[WK] as string[]) : [];
  const newText: string = ui.newText || "";
  const addSticky = () => { const t = newText.trim(); if (!t) return; op({ key: WK, op: "set", value: [...wall, t] }); setUi({ newText: "" }); };
  // Reset: the keys this exercise's template keeps (participatory budgeting is the class's, cleared from its own setup tab).
  const RESET: Record<string, string[]> = { org: ["org"], flow: ["flow"], theme: ["theme"], pc: ["pc"], swot: ["swot"], fut: ["fut"], mr: ["mr"], epic: ["epic"], lbc: ["lbc"], piv: ["piv"], grd: ["grd"], disc: ["disc:" + exId], ctx: ["ctx"], pb: [], pkb: ["pkb"], wsjf: ["wsjf"], met: ["met"], tbl: ["tbl:" + exId], emi: ["tbl:" + exId, "emi"], pitch: ["pitch"], scope: ["scope"], chal: ["chal"], nxt: ["nxt"], vid: ["vid:" + exId] };
  const teamName = (() => { const t = classTeams(c.board).find((x) => x.id === c.team); return t ? t.name : "the class"; })();
  return {
    ...kf, ...T,
    crumb: `${type.toUpperCase()}${cfg.page ? " · " + (/^\d/.test(String(cfg.page)) && String(cfg.page).includes("-") ? "SLIDE " : "PAGE ") + cfg.page : ""}`,
    canReset: (RESET[K] || []).length > 0 && !c.readOnly, resetEx: () => (RESET[K] || []).forEach(clear),
    curGroup: teamName.toUpperCase(), stickyCount: wall.length, wallHint: type === "Discussion" ? "Capture what your group said…" : "Add an answer or a result…",
    newText, setNew: (ev: Ev) => setUi({ newText: ev.target.value }), newKey: (ev: KeyEv) => { if (ev.key === "Enter") addSticky(); }, addSticky,
    stickies: wall.map((t, i) => ({ t, c: SC[i % 4], rot: ((i * 7) % 5) - 2, del: () => op({ key: WK, op: "set", value: wall.filter((_, j) => j !== i) }) })),
  };
}
