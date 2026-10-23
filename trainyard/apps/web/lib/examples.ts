// Worked examples shown on the public website. Northstar Bank is an illustrative SAFe example:
// one business objective traced through value streams, ARTs and teams, with the key results
// that prove the change and the KPIs that keep watching health afterwards.

export interface Kr {
  id: string;
  label: string;
  from: number;
  to: number;
  unit: string;
  /** The KPI that measures it. */
  kpi: string;
}

export interface Level {
  id: string;
  level: string;
  objective: string;
  kr: string;
  kpis: string[];
  /** Parent level id: the outcome this level contributes to. */
  parent?: string;
  note: string;
}

export interface Measure {
  scope: string;
  measure: string;
  current: number;
  target: number;
  unit: "%" | "$" | "days" | "min";
  higherIsBetter: boolean;
  min: number;
  max: number;
  step: number;
}

export const NORTHSTAR = {
  name: "Northstar Bank",
  objective: "Make business payments faster, easier and more reliable.",
  outcome: "More self-service payments, lower servicing cost and a better customer experience.",
  krs: [
    { id: "adoption", label: "Increase digital adoption", from: 40, to: 65, unit: "%", kpi: "Adoption rate" },
    { id: "abandonment", label: "Reduce abandonment", from: 30, to: 10, unit: "%", kpi: "Payment abandonment" },
  ] satisfies Kr[],
  kpis: ["Adoption rate", "Payment success rate", "Cost per transaction"],
  streams: {
    operational: {
      title: "Operational value stream",
      blurb: "How the customer gets value: the payment journey itself.",
      steps: ["Customer initiates payment", "Bank authenticates", "Payment clears", "Customer gets confirmation"],
      kpis: ["Completion time", "Success rate", "Cost per payment"],
    },
    development: {
      title: "Development value stream",
      blurb: "How the bank builds and changes the systems behind the journey.",
      steps: ["Identify customer need", "Design solution", "Build and integrate", "Release and learn"],
      kpis: ["Flow time", "Throughput", "Release quality"],
    },
  },
  levels: [
    { id: "portfolio", level: "Portfolio", objective: "Grow profitable digital payments", kr: "Adoption 40% → 65%", kpis: ["Adoption", "Revenue", "Cost per payment"], note: "Lean Portfolio Management funds the value stream against this outcome." },
    { id: "dvs", level: "Development value stream", objective: "Enable faster, reliable payments", kr: "Journey 5 min → 1 min", kpis: ["Flow time", "Completion time"], parent: "portfolio", note: "The value stream turns the portfolio outcome into a faster journey." },
    { id: "payments", level: "Payments ART", objective: "Improve payment reliability", kr: "Success 98.5% → 99.9%", kpis: ["Success rate", "Latency", "Defects"], parent: "dvs", note: "Owns the clearing and authentication systems: reliability is its lever." },
    { id: "channels", level: "Digital Channels ART", objective: "Make journeys frictionless", kr: "Abandonment 30% → 10%", kpis: ["Abandonment", "Conversion"], parent: "dvs", note: "Owns web and mobile: abandonment is its lever." },
    { id: "teams", level: "Agile teams", objective: "Build and test solution increments", kr: "Stories: APIs, UX, automated tests", kpis: ["Cycle time", "Escaped defects"], parent: "channels", note: "Teams deliver stories and track delivery measures, not OKRs of their own." },
  ] satisfies Level[],
  abandonment: { quarters: ["Q1", "Q2", "Q3", "Q4"], values: [30, 22, 14, 9], target: 10 },
  dashboard: [
    { scope: "Portfolio", measure: "Digital payment adoption", current: 58, target: 65, unit: "%", higherIsBetter: true, min: 30, max: 90, step: 1 },
    { scope: "Portfolio", measure: "Cost per payment", current: 0.78, target: 0.6, unit: "$", higherIsBetter: false, min: 0.3, max: 1.2, step: 0.01 },
    { scope: "Value stream", measure: "Development flow time", current: 24, target: 15, unit: "days", higherIsBetter: false, min: 5, max: 45, step: 1 },
    { scope: "Operational value stream", measure: "Payment completion time", current: 1.4, target: 1.0, unit: "min", higherIsBetter: false, min: 0.5, max: 5, step: 0.1 },
    { scope: "Payments ART", measure: "Payment success rate", current: 99.7, target: 99.9, unit: "%", higherIsBetter: true, min: 98, max: 100, step: 0.1 },
    { scope: "Digital Channels ART", measure: "Payment abandonment", current: 14, target: 10, unit: "%", higherIsBetter: false, min: 0, max: 35, step: 1 },
  ] satisfies Measure[],
  lenses: [
    { id: "outcomes", title: "Outcomes", question: "Are we realising customer and business benefits?", measures: ["Adoption", "Revenue", "Satisfaction"] },
    { id: "flow", title: "Flow", question: "How efficiently does value move through the system?", measures: ["Flow time", "Throughput", "Flow efficiency"] },
    { id: "competency", title: "Competency", question: "Can we sustain and improve the ability to deliver?", measures: ["Technical quality", "Business agility"] },
  ],
  review: [
    "Did we achieve the targeted customer or business change?",
    "Are operational and solution health KPIs stable?",
    "Did the ARTs improve the capabilities that drive the outcome?",
    "What should we fund, stop, improve, or experiment with next?",
  ],
};
