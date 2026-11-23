// AI-Empowered SAFe Product Owner/Product Manager class, chapter by chapter: each exercise with its
// timing, its steps (the exact wording of the Scaled Agile course) and the board it is worked on
// (`board`; its setup in `config`).
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise has a board of its own; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 600 };

/** Worked in the Welcome area, as the class opens. */
const welcome: ActivitySpec[] = [
  {
    title: "Product role experience",
    kind: "Discussion",
    prepare: 5,
    steps:
      "Step 1: Introduce yourself to your group and share the following details:\n- Your experience working in an Agile environment\n- Your experience working outside of an Agile environment\n- Any Product Owner role experience\n- Any Product Manager role experience\nStep 2: Identify the most important thing you want to learn from this course and share it with your group",
    board: "po-intro",
    ...BOARD,
  },
];

const lesson1: ActivitySpec[] = [
  {
    title: "Applying a Lean-Agile mindset",
    kind: "Discussion",
    prepare: 10,
    steps:
      "Step 1: As a class, review the following scenario and how the proposed actions align with the Lean-Agile mindset:\nScenario: Team Codebusters' work impacts multiple high-priority features being implemented this PI. The Product Owner struggles with managing the competing priorities from different stakeholders, and the team isn’t always sure what to focus on first.\nStep 2: Discuss how the following proposed actions by the Product Owner align with the Lean-Agile mindset:\n- Regularly engage with stakeholders.\n- Focus on customer value.\n- Collaborate with the team.",
    board: "po-mind",
    config: {
      classWide: true,
      scenario:
        "Team Codebusters' work impacts multiple high-priority features being implemented this PI. The Product Owner struggles with managing the competing priorities from different stakeholders, and the team isn’t always sure what to focus on first.",
      actions: ["Regularly engage with stakeholders.", "Focus on customer value.", "Collaborate with the team."],
    },
    ...BOARD,
  },
  {
    title: "AI disruption in Product Management",
    kind: "Discussion",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: In your group, explore how the widespread adoption of AI may disrupt how Product Owners and Product Managers operate and deliver value. For example, consider:\n- Story writing: How might AI-assisted story writing and acceptance criteria generation change your daily priorities and how you budget your time?\n- Customer insights: How might AI analyzing large amounts of customer feedback change how you identify needs and define value?\n- Feature writing: How might AI change how you write features and benefit hypotheses?\nStep 2: Be prepared to share with the class.",
    board: "po-ai",
    config: {
      prompt: "In your group, explore how the widespread adoption of AI may disrupt how Product Owners and Product Managers operate and deliver value.",
      lenses: [
        ["Story writing", "How might AI-assisted story writing and acceptance criteria generation change your daily priorities and how you budget your time?"],
        ["Customer insights", "How might AI analyzing large amounts of customer feedback change how you identify needs and define value?"],
        ["Feature writing", "How might AI change how you write features and benefit hypotheses?"],
      ],
    },
    ...BOARD,
  },
  {
    title: "Develop your SAFe message",
    kind: "Activity",
    prepare: 10,
    steps:
      "Step 1: In your group, consider the following scenario:\n- The Senior Developer on your new Agile Team is skeptical about SAFe. They have sent you a message asking how having a Product Owner will make their jobs easier. They are worried it’s going to be more meetings and processes, and nothing will get better.\nStep 2: Open an LLM of your choice (ChatGPT, Claude, SAFe CoPilot) and ask it to help you compose a response to this developer. Be sure to include the five key elements in your prompt.\nStep 3: With your group, evaluate the responses and refine your original prompt based on what’s missing. Resubmit and compare the results.",
    board: "po-msg",
    config: {
      scenario:
        "The Senior Developer on your new Agile Team is skeptical about SAFe. They have sent you a message asking how having a Product Owner will make their jobs easier. They are worried it’s going to be more meetings and processes, and nothing will get better.",
    },
    ...BOARD,
  },
];

/** Lesson 1 runs on its own boards; the later chapters keep the class's canvas exercises until theirs are built. */
export const POPM_COURSE: { title: string; activities: ActivitySpec[]; keep?: boolean }[] = [
  { title: "Welcome", activities: welcome },
  { title: "Becoming a Product Owner / Product Manager", activities: lesson1 },
  { title: "Preparing for PI Planning", activities: [], keep: true },
  { title: "Leading PI Planning", activities: [], keep: true },
  { title: "Executing Iterations", activities: [], keep: true },
  { title: "Executing the PI", activities: [], keep: true },
];
