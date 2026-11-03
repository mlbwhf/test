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
};

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
  { title: "Assess the ART", activities: lesson2 },
];
