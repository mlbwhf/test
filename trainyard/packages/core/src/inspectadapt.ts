// Inspect & Adapt: the event at the end of every PI. One definition feeds the Inspect & Adapt
// board template, the class boards that teach it, and the guides.

export const INSPECT_AND_ADAPT = {
  parts: [
    { title: "PI system demo", detail: "The integrated solution as it stands at the end of the PI, shown to Business Owners and stakeholders." },
    { title: "Quantitative and qualitative measurement", detail: "Planned and actual business value per team and for the ART (predictability), flow metrics, and what the numbers do not show." },
    { title: "Retrospective and problem-solving workshop", detail: "A short retrospective, then a structured root-cause workshop on the problems that matter most, ending in improvement backlog items." },
  ],
  workshopSteps: [
    "Agree on the problem to solve",
    "Apply root-cause analysis (fishbone and five whys)",
    "Identify the biggest root cause (Pareto vote)",
    "Restate the new problem",
    "Brainstorm solutions",
    "Identify improvement backlog items",
  ],
  /** SAFe's fishbone categories for the problem-solving workshop. */
  fishbone: ["People", "Processes", "Tools", "Program", "Environment"],
  improvementBacklog: ["Improvement", "Root cause it addresses", "Owner", "Planned for (next PI)", "Measure of success"],
  objectives: ["Team", "PI objective", "Committed?", "Planned BV (1–10)", "Actual BV (1–10)"],
  /** ART predictability: actual business value over planned, committed objectives only; 80–100% is the target band. */
  predictability: "Predictability = Σ actual BV ÷ Σ planned BV of committed objectives. Aim for 80–100%.",
} as const;
