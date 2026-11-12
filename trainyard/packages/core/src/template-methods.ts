// The methods templates are grouped by: a leaf module with nothing behind it, so a page that only
// needs the list (the board page's "Add a template" menu) does not pull the catalogue, the class
// content and the demo data into its bundle.

export type TemplateMethod = "safe" | "scrum" | "kanban" | "lean" | "six-sigma" | "manufacturing" | "general";

export const TEMPLATE_METHODS: { id: TemplateMethod; label: string; blurb: string }[] = [
  { id: "safe", label: "SAFe", blurb: "Scaled Agile Framework events and artifacts, named as SAFe names them." },
  { id: "scrum", label: "Scrum", blurb: "The Scrum Guide's events and artifacts: Product Backlog, Sprint Planning, Sprint Backlog, Daily Scrum, Sprint Review, Sprint Retrospective." },
  { id: "kanban", label: "Kanban", blurb: "The Kanban Method: visualise, limit WIP, manage flow, explicit policies, feedback loops (cadences), improve." },
  { id: "lean", label: "Lean", blurb: "Lean thinking and the Toyota way: A3, PDCA, value stream mapping, kaizen, obeya, hoshin kanri." },
  { id: "six-sigma", label: "Six Sigma", blurb: "DMAIC and its tools: project charter, SIPOC, voice of the customer, fishbone, FMEA, control plan." },
  { id: "manufacturing", label: "Manufacturing", blurb: "Shop-floor management: SQDC tiered boards, andon, OEE, heijunka, 5S, gemba walks." },
  { id: "general", label: "General", blurb: "Practices every method shares." },
];
