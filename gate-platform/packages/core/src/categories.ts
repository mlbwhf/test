/** Fixed topics for EnrollClass's class finder. A fixed list keeps the filter short and comparable across organizers. */
export const COURSE_CATEGORIES = [
  { id: "agile", label: "Agile & Scrum" },
  { id: "project-management", label: "Project management" },
  { id: "product", label: "Product management" },
  { id: "leadership", label: "Leadership & management" },
  { id: "it-service", label: "IT service management" },
  { id: "devops-cloud", label: "DevOps & cloud" },
  { id: "security", label: "Security" },
  { id: "data-ai", label: "Data & AI" },
  { id: "quality", label: "Quality & Lean" },
  { id: "business", label: "Business & finance" },
  { id: "other", label: "Other" },
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number]["id"];

export function isCourseCategory(v: unknown): v is CourseCategory {
  return typeof v === "string" && COURSE_CATEGORIES.some((c) => c.id === v);
}

/** Ordered: the first match wins, so specific bodies come before generic words. */
const RULES: [CourseCategory, RegExp][] = [
  ["security", /\b(cissp|cism|cisa|comptia security|security|ceh|ethical hack\w*|hacking|cyber\w*|isc2|iso\s?27001|soc analyst|soc|pen(etration)? ?test\w*|threat\w*|incident response)\b/i],
  ["it-service", /\b(itil|service management|cobit|iso\s?20000)\b/i],
  ["product", /\b(product owner|product manag\w*|pspo|cspo|popm)\b/i],
  ["agile", /\b(safe|scaled agile|scrum\w*|agile|kanban|lean-agile|release train|rte|sasm|ssm|icagile)\b/i],
  ["project-management", /\b(pmp|capm|pmi|prince2|project manag\w*|pgmp|msp|program(me)? management|axelos)\b/i],
  ["devops-cloud", /\b(devops|aws|azure|google cloud|gcp|kubernetes|docker|terraform|sre|site reliability|cloud)\b/i],
  ["data-ai", /\b(data|ai|artificial intelligence|machine learning|ml|analytics|power bi|tableau|python|genai|prompt\w*)\b/i],
  ["quality", /\b(six sigma|lean|green belt|black belt|iso\s?9001|quality)\b/i],
  ["leadership", /\b(leader\w*|leading|management 3\.0|coach\w*|okrs?|change management|prosci|managers?)\b/i],
  ["business", /\b(business analysis|cbap|iiba|finance|financial|accounting|cfa|sales|marketing|negotiat\w*|aml|kyc|compliance|audit\w*|risk management)\b/i],
];

/** Best guess from the course name and certification body, used when the organizer hasn't picked one. */
export function inferCategory(name: string, certificationBody?: string | undefined): CourseCategory {
  const text = `${certificationBody ?? ""} ${name}`;
  for (const [id, re] of RULES) if (re.test(text)) return id;
  return "other";
}
