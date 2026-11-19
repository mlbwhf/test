// Launching AI-Native ARTs (ART Leader, AI-Native SAFe), step by step: each exercise with its timing,
// its instructions (the course's wording) and the Class Studio board it is worked on. Every step
// shares one board, so the ratings given in the assessment steps carry through the discussion,
// the adjustment and the gap analysis.
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise is a Class Studio board; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 600 };

/** The twelve assessment statements, by success factor, with the short name used on the roadmap card. */
export const AI_NATIVE_SUCCESS_FACTORS: Record<
  string,
  { title: string; statements: [string, string][] }
> = {
  sf1: {
    title: "SF1: Outcome-Driven Product Development",
    statements: [
      [
        "We use well-formed OKRs to capture and communicate outcomes.",
        "Well-formed OKRs",
      ],
      ["We prioritize our work based on our OKRs.", "Prioritize by OKRs"],
      [
        "We have automated reports for tracking Key Results.",
        "Automated KR reports",
      ],
      [
        "We regularly act on the feedback generated from measuring progress against outcomes.",
        "Act on outcome feedback",
      ],
    ],
  },
  sf2: {
    title: "SF2: Portfolio and Investment Strategy",
    statements: [
      [
        "We have clarity on the product(s) this ART is responsible for.",
        "Clarity on products",
      ],
      [
        "A set of portfolio outcomes provides the longer-term product strategy for this ART.",
        "Portfolio outcomes",
      ],
      [
        "A set of transformation outcomes helps us balance our capacity between product development and changing the ways of working.",
        "Transformation outcomes",
      ],
      [
        "The portfolio has set clear guardrails for tracking and managing variable AI costs.",
        "AI cost guardrails",
      ],
    ],
  },
  sf3: {
    title: "SF3: Curated Data",
    statements: [
      [
        "Curated data powers every step of our product development process.",
        "Data powers every step",
      ],
      [
        "Our Teams identify data requirements before beginning development work.",
        "Data requirements first",
      ],
      [
        "We verify that datasets meet all four core curation standards: complete, accurate, maintained, and securely accessed.",
        "Four curation standards",
      ],
      [
        "Data stewards continuously monitor and maintain data standards.",
        "Data stewards",
      ],
    ],
  },
  // Lesson 3 (slides 3-18, 3-29 and 3-48).
  sf4: {
    title: "SF4: AI-Native ART",
    statements: [
      ["Our AI-Native ART is staffed appropriately to develop its products.", "ART staffing"],
      ["Business Owners, Product Management, the RTE, and System Architect are fully aligned on the vision and prepared to lead an AI-Native ART.", "ART leadership aligned"],
      ["The ART has established clear AI safety and governance guardrails that teams must follow when building products.", "AI safety and governance guardrails"],
      ["Everyone on the ART has the AI fluency needed to build and collaborate with AI agents responsibly.", "AI fluency"],
    ],
  },
  sf5: {
    title: "SF5: AI-Native Teams",
    statements: [
      ["Each AI-Native team has a clear mission and the Product, Builder, and Domain Expert capabilities to fulfill it.", "Team mission and capabilities"],
      ["Teams effectively incorporate AI into their daily workflows.", "AI in daily workflows"],
      ["Teams operate on an Align, Sense, and Respond cadence.", "Align, Sense, and Respond cadence"],
      ["Teams quickly test low-cost prototypes and kill experiments that fail to deliver value.", "Low-cost prototypes"],
    ],
  },
  sf6: {
    title: "SF6: AI Value Architect",
    statements: [
      ["AI Value Architects bridge business goals and technical execution.", "Bridge goals and execution"],
      ["AI Value Architects help teams unlock value from AI workflows and tools.", "Value from AI workflows"],
      ["AI Value Architects provide coaching to support individuals in integrating AI into their roles responsibly.", "AI coaching"],
      ["AI Value Architects ensure AI usage is focused on optimizing outcomes.", "AI usage on outcomes"],
    ],
  },
  // Lesson 4 (slides 4-14, 4-38, 4-49 and 4-54).
  sf7: {
    title: "SF7: Product Vision and Roadmap",
    statements: [
      ["We communicate a product vision that is desirable to customers, viable for the business and technically feasible.", "Product vision"],
      ["We maintain a set of ART outcomes that describes its longer-term strategy.", "ART outcomes"],
      ["We utilize outcome-driven roadmaps that express future work as intended business and customer outcomes rather than fixed feature deliverables", "Outcome-driven roadmaps"],
      ["We identify learning milestones to validate technical and business opportunities and hypotheses", "Learning milestones"],
    ],
  },
  sf8: {
    title: "SF8: PI Outcome Planning",
    statements: [
      ["The ART plans on a cadence around a set of desired outcomes rather than a set of features.", "Plan around outcomes"],
      ["Each PI the ART commits to a set of OKRs that will progress the ART’s long-term strategy.", "PI OKRs"],
      ["Teams define and commit to OKRs that express their planned contributions through the PI.", "Team OKRs"],
      ["The ART is effective in managing risks and making timely decisions throughout the PI.", "Risks and timely decisions"],
    ],
  },
  sf9: {
    title: "SF9: Sense and Respond Event",
    statements: [
      ["Teams routinely run customer demos to get real-world feedback.", "Customer demos"],
      ["We actively measure customer usage, performance metrics, and operational signals instead of relying on assumptions.", "Measure real signals"],
      ["The ART regularly adapts its plans based on progress against outcomes and new insights.", "Adapt plans"],
      ["ART leaders and teams are empowered to make fast \"pivot, persevere, or stop\" decisions based on objective evidence.", "Pivot, persevere, or stop"],
    ],
  },
  // Lesson 5 (slides 5-10, 5-21, 5-35 and 5-40).
  sf10: {
    title: "SF10: Intent, Specifications and Context",
    statements: [
      ["We define and regularly update our product’s intent, so teams and AI agents know which problems to solve and why.", "Product intent"],
      ["We set clear product specifications to give teams and AI agents exact guardrails and solution details before building.", "Product specifications"],
      ["We have established a product context, so teams and AI agents understand the customer, market, and operational landscape they operate in.", "Product context"],
      ["All teams and AI agents build from shared intent, specifications, and context data to ensure consistency and traceability", "Shared intent, specifications and context"],
    ],
  },
  sf11: {
    title: "SF11: AI Innovation Pipeline",
    statements: [
      ["We continually invest in and optimize the tools, technologies, and architecture that enable flow.", "Invest in flow"],
      ["We have embedded policies in the tools we use to ensure guardrails and human checks are in place.", "Embedded policies"],
      ["We have configured systems to capture insights and evidence for auditing decisions and tracking early learning.", "Insights and evidence"],
      ["The AI-Native Teams on the ART have access to a shared platform that connects and composes their workflows, policies, and data into unified capabilities.", "Shared platform"],
    ],
  },
  sf12: {
    title: "SF12: AI Governance and Ethics",
    statements: [
      ["We have effective mechanisms in place for controlling and monitoring token spend.", "Token spend controls"],
      ["Everyone on the ART is trained in and practices Responsible AI.", "Responsible AI"],
      ["AI agentic behaviors are monitored at every step in every workflow.", "Monitor agentic behaviors"],
      ["We have defined and communicated a set of AI Ethics that everyone adheres to.", "AI Ethics"],
    ],
  },
};

const assess = (title: string, sf: string): ActivitySpec => ({
  title,
  kind: "Assess",
  prepare: 5,
  steps: "Individually, evaluate each statement for your ART and determine whether it is fully in place, partially in place or not in place.",
  board: "aart",
  config: { step: "sf", tm: [["Prepare", 5]], shared: "assessment", sf, mode: "assess" },
  ...BOARD,
});
/** The assessments of success factors 4 to 12 (lessons 3 to 5), used by the launch readiness package. */
export const AI_NATIVE_ASSESS_456: ActivitySpec[] = [assess("AI-Native ART", "sf4"), assess("AI-Native Teams", "sf5"), assess("AI Value Architect", "sf6")];
export const AI_NATIVE_ASSESS_789: ActivitySpec[] = [assess("Product vision and roadmap", "sf7"), assess("PI Outcome Planning", "sf8"), assess("Sense and Respond event", "sf9")];
export const AI_NATIVE_ASSESS_101112: ActivitySpec[] = [assess("Intent, specifications, and context", "sf10"), assess("AI Innovation Pipeline", "sf11"), assess("AI Governance and Ethics", "sf12")];

const lesson1: ActivitySpec[] = [
  {
    title: "Try the assessment scale",
    kind: "Activity",
    prepare: 1,
    share: 3,
    steps:
      "Before we assess anything real, let’s practice with something everyone has an opinion on.\nIndividually, score the statement below on the scale. Then review your answers together.\nNotice: where did the room agree and disagree? Did you reach consensus? How?",
    side: [{ title: "Slide", text: "Slide 1-18", instructorOnly: true }],
    board: "aart",
    config: {
      step: "scale",
      tm: [
        ["Prepare", 1],
        ["Share", 3],
      ],
      shared: "assessment",
    },
    ...BOARD,
  },
];

const lesson2: ActivitySpec[] = [
  {
    title: "Why “outcome-driven” flow?",
    kind: "Discussion",
    share: 5,
    steps:
      "The first critical Lean-Agile shift tells us to optimize for “outcome-driven” flow. As a class, discuss:\nWhat is the significance of the term “outcome-driven” in this shift?\nHow would shifting to optimizing for outcome-driven flow change the way your ART works?",
    side: [{ title: "Slide", text: "Slide 2-3", instructorOnly: true }],
    board: "aart",
    config: {
      step: "text",
      tm: [["Share", 5]],
      shared: "assessment",
      notes: true,
    },
    ...BOARD,
  },
  {
    title: "Compare workflows",
    kind: "Activity",
    prepare: 10,
    share: 3,
    steps:
      "Individually, roughly describe your ART’s current product development process. Type what happens at each stage under the model.\nThen, in your groups, compare your descriptions to outcome-driven product development. Be prepared to share.",
    side: [{ title: "Slide", text: "Slide 2-6", instructorOnly: true }],
    board: "aart",
    config: {
      step: "flow",
      tm: [
        ["Describe", 4],
        ["Compare", 6],
        ["Share", 3],
      ],
      shared: "assessment",
    },
    ...BOARD,
  },
  {
    title: "Evaluate an OKR",
    kind: "Activity",
    share: 5,
    steps:
      "Objectives are inspirational, clear and memorable, and classified as a roofshot or a moonshot. Key Results are value-based, measurable and gradable.\nAs a class, review the example OKR and mark what it meets.",
    side: [{ title: "Slide", text: "Slide 2-10", instructorOnly: true }],
    board: "aart",
    config: { step: "okr", tm: [["Share", 5]], shared: "assessment" },
    ...BOARD,
  },
  {
    title: "Outcome-driven product development",
    kind: "Assess",
    prepare: 5,
    steps:
      "Navigate to Success Factor 1 in the assessment app. Individually, evaluate each statement for your ART and determine whether it is fully, partially or not in place.",
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 5]],
      shared: "assessment",
      sf: "sf1",
      mode: "assess",
    },
    ...BOARD,
  },
  {
    title: "Why did we evaluate differently?",
    kind: "Discussion",
    share: 6,
    steps:
      "In your groups, compare the results for each statement.\nFirst check: did we understand each statement the same way?\nThen discuss: where did we have differences and why?",
    side: [{ title: "Slide", text: "Slide 2-12", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Share", 6]],
      shared: "assessment",
      sf: "sf1",
      mode: "discuss",
    },
    ...BOARD,
  },
  {
    title: "Adjust your evaluation if needed",
    kind: "Assess",
    prepare: 3,
    steps:
      "Now that you have discussed with your group, take another look at individual results.\nIf anything has changed your mind, update your evaluation to reflect it.",
    side: [{ title: "Slide", text: "Slide 2-13", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 3]],
      shared: "assessment",
      sf: "sf1",
      mode: "adjust",
    },
    ...BOARD,
  },
  {
    title: "Why the portfolio matters to the ART",
    kind: "Discussion",
    share: 6,
    steps:
      "The portfolio that governs products, solutions and investments can feel far away from an ART. But decisions made by the portfolio impact daily work. As a class, discuss:\nHow do portfolio outcomes and investment strategy impact your ART?",
    side: [{ title: "Slide", text: "Slide 2-16", instructorOnly: true }],
    board: "aart",
    config: {
      step: "text",
      tm: [["Share", 6]],
      shared: "assessment",
      notes: true,
    },
    ...BOARD,
  },
  {
    title: "Does strategy reach your ART?",
    kind: "Activity",
    prepare: 5,
    share: 4,
    steps:
      "Individually write your answers to these questions. Then, with a partner, compare notes.",
    side: [{ title: "Slide", text: "Slide 2-20", instructorOnly: true }],
    board: "aart",
    config: {
      step: "strategy",
      tm: [
        ["Prepare", 5],
        ["Share", 4],
      ],
      shared: "assessment",
    },
    ...BOARD,
  },
  {
    title: "Portfolio and investment strategy",
    kind: "Assess",
    prepare: 5,
    steps:
      "Navigate to Success Factor 2. Individually, evaluate each statement for your ART.",
    side: [{ title: "Slide", text: "Slide 2-23", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 5]],
      shared: "assessment",
      sf: "sf2",
      mode: "assess",
    },
    ...BOARD,
  },
  {
    title: "Why did we rate differently?",
    kind: "Discussion",
    share: 6,
    steps:
      "In your groups, compare the results for each statement.\nFirst check: did we understand each statement the same way?\nThen discuss: where did we have differences and why?",
    side: [{ title: "Slide", text: "Slide 2-24", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Share", 6]],
      shared: "assessment",
      sf: "sf2",
      mode: "discuss",
    },
    ...BOARD,
  },
  {
    title: "Adjust your rating if needed",
    kind: "Assess",
    prepare: 3,
    steps:
      "Take another look at individual results. If anything has changed your mind, update your evaluation.",
    side: [{ title: "Slide", text: "Slide 2-25", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 3]],
      shared: "assessment",
      sf: "sf2",
      mode: "adjust",
    },
    ...BOARD,
  },
  {
    title: "What makes data important?",
    kind: "Discussion",
    share: 5,
    steps:
      "Consider past experiences with AI tools, such as LLMs or built-in assistants. As a class, choose one of these prompts and discuss:\nWhat stories do you have where an AI tool impressed you with its output? Why?\nWhat stories do you have where an AI tool disappointed you with its output? Why?",
    side: [{ title: "Slide", text: "Slide 2-27", instructorOnly: true }],
    board: "aart",
    config: {
      step: "text",
      tm: [["Share", 5]],
      shared: "assessment",
      notes: true,
    },
    ...BOARD,
  },
  {
    title: "Who is responsible for great data?",
    kind: "Activity",
    prepare: 8,
    share: 5,
    steps:
      "As a group, pick a different data type that your ART relies on, and work through the four steps. Be prepared to share.",
    side: [{ title: "Slide", text: "Slide 2-32", instructorOnly: true }],
    board: "aart",
    config: {
      step: "data",
      tm: [
        ["Prepare", 8],
        ["Share", 5],
      ],
      shared: "assessment",
    },
    ...BOARD,
  },
  {
    title: "Curated data",
    kind: "Assess",
    prepare: 5,
    steps:
      "Navigate to Success Factor 3. Individually, evaluate each statement for your ART.",
    side: [{ title: "Slide", text: "Slide 2-35", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 5]],
      shared: "assessment",
      sf: "sf3",
      mode: "assess",
    },
    ...BOARD,
  },
  {
    title: "Why did we rate differently?",
    kind: "Discussion",
    share: 6,
    steps:
      "In your groups, compare the results for each statement.\nFirst check: did we understand each statement the same way?\nThen discuss: where did we have differences and why?",
    side: [{ title: "Slide", text: "Slide 2-36", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Share", 6]],
      shared: "assessment",
      sf: "sf3",
      mode: "discuss",
    },
    ...BOARD,
  },
  {
    title: "Adjust your rating if needed",
    kind: "Assess",
    prepare: 3,
    steps:
      "Take another look at individual results. If anything has changed your mind, update your evaluation.",
    side: [{ title: "Slide", text: "Slide 2-37", instructorOnly: true }],
    board: "aart",
    config: {
      step: "sf",
      tm: [["Prepare", 3]],
      shared: "assessment",
      sf: "sf3",
      mode: "adjust",
    },
    ...BOARD,
  },
  {
    title: "Gap analysis review",
    kind: "Activity",
    prepare: 20,
    steps:
      "As a class, review the assessment results for each success factor. For each one, the facilitator identifies how it was evaluated, lets those who evaluated differently share their reasoning, and facilitates a discussion to reach consensus on the final evaluation ahead of building the launch plan.",
    side: [{ title: "Slide", text: "Slide 2-39", instructorOnly: true }],
    board: "aart",
    config: { step: "gap", tm: [["Duration", 20]], shared: "assessment" },
    ...BOARD,
  },
];

export const AI_NATIVE_ARTS_COURSE: {
  title: string;
  activities: ActivitySpec[];
}[] = [
  { title: "Start and calibrate", activities: lesson1 },
  // The design's chapters 02-05: one per success factor, then the gap analysis.
  { title: "SF1: Outcome-driven product development", activities: lesson2.slice(0, 6) },
  { title: "SF2: Portfolio and investment strategy", activities: lesson2.slice(6, 11) },
  { title: "SF3: Curated data", activities: lesson2.slice(11, 16) },
  { title: "Gap analysis", activities: lesson2.slice(16) },
];
