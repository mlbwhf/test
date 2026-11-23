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

const TTC_EPIC = "Develop a solution to allow TTC customers to purchase supplemental insurance for packages.";

const lesson2: ActivitySpec[] = [
  {
    title: "Consider market rhythms for optimum release timing",
    kind: "Discussion",
    prepare: 10,
    steps:
      "Step 1: Individually, consider the following scenario:\nThe Van Maintenance Advisor requires new hardware. The System Architect has informed the Product Management team that customers will have to take their vans out of service for approximately one day to install the new hardware. Approximately 30% of your van customers serve the local retail market, while another 30% serve the medical specimen market.\nStep 2: As a class, identify the potential market rhythms and events that impact each market. Use that information to determine the key times to release the new hardware in order to minimize disruptions to customers.",
    board: "po-rhythm",
    config: {
      classWide: true,
      scenario:
        "The Van Maintenance Advisor requires new hardware. The System Architect has informed the Product Management team that customers will have to take their vans out of service for approximately one day to install the new hardware. Approximately 30% of your van customers serve the local retail market, while another 30% serve the medical specimen market.",
      markets: [["Local retail market", "#1f3a8a"], ["Medical specimen market", "#1fb89a"]],
    },
    ...BOARD,
  },
  {
    title: "Exploring customer needs with AI-supported research",
    kind: "Discussion",
    prepare: 7,
    steps:
      "Step 1: Individually, review the provided AI-generated customer research report\nStep 2: With your group, discuss the following:\n- What assumptions does this research appear to make?\n- What insights would require direct customer validation?\n- How could this research inform (but not replace) customer discovery?\nStep 3: Be prepared to share with the class",
    board: "po-ai",
    config: {
      prompt: "Review the provided AI-generated customer research report, then discuss it with your group.",
      kinds: [],
      add: "+ add, Enter",
      shareLabel: "Step 3 · What we share with the class",
      lenses: [
        ["Assumptions", "What assumptions does this research appear to make?"],
        ["Needs validation", "What insights would require direct customer validation?"],
        ["Inform, not replace", "How could this research inform (but not replace) customer discovery?"],
      ],
    },
    ...BOARD,
  },
  {
    title: "Writing features",
    kind: "Activity",
    prepare: 10,
    share: 10,
    steps:
      "Step 1: With your group, break down, or decompose, the example epic by identifying at least three potential features for an MVP.\nStep 2: Further refine each feature with a description, feature intent, benefit hypothesis, and acceptance criteria. In the benefit hypothesis, be sure to identify the primary customer.\nStep 3: Be prepared to share with the class.",
    board: "po-feat",
    config: {
      shared: "popm-features",
      epic: TTC_EPIC,
      example: {
        name: "Mobile app insurance purchase",
        desc: "Allow purchase of supplemental insurance via TTC mobile app.",
        hyp: "Mobile access to insurance options improves convenience, increasing engagement and revenue.",
        intent: "Enable convenient, value-driven insurance decisions within the app, increasing engagement and revenue by guiding users to the most suitable coverage.",
        ac: "Customers can access insurance options through the mobile app’s package booking flow. The mobile app supports secure payment for insurance purchases. Customers receive a push notification confirming their insurance purchase.",
      },
    },
    ...BOARD,
  },
  {
    title: "Prompt, refine, and edit",
    kind: "Activity",
    prepare: 15,
    share: 10,
    steps:
      "Step 1: Individually, select one of the features you brainstormed in the previous activity\nStep 2: Using a GenAI tool, write a prompt to help clarify the feature intent, strengthen the benefit hypothesis, and improve the acceptance criteria\nStep 3: Review the AI-generated output and decide:\n- What to keep\n- What to change\n- What to remove\nStep 4: Refine the story and be prepared to share with the class",
    board: "po-refine",
    config: { shared: "popm-features" },
    ...BOARD,
  },
  {
    title: "Draft your capacity allocation policy",
    kind: "Activity",
    prepare: 5,
    share: 10,
    steps:
      "Step 1: Individually, consider how you would use capacity allocation in your organization\nStep 2: Draft a capacity allocation policy for your ART that you will discuss with your key stakeholders\nStep 3: Be prepared to share with the class",
    board: "po-cap",
    ...BOARD,
  },
  {
    title: "WSJF prioritization",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: With your groups, prioritize three of the features you identified earlier using WSJF\nStep 2: Be prepared to share with the class",
    side: [
      {
        title: "Scale and note",
        text: "Scale for each parameter: 1, 2, 3, 5, 8, 13, 20. Note: Do one column at a time. Start by picking the smallest item and giving it a 1. There must be at least one 1 in each column.",
      },
    ],
    board: "wsjf",
    config: { prompt: "Which feature goes first when you divide cost of delay by job size?", shared: "popm-features" },
    ...BOARD,
  },
  {
    title: "Just enough pre-planning",
    kind: "Discussion",
    prepare: 5,
    steps:
      "Step 1: As a class, discuss how the amount of pre-planning that you do can have positive outcomes and negative outcomes\nStep 2: Consider how the Lean-Agile mindset and SAFe practices influence and enable PI Planning preparedness",
    board: "quad",
    config: { classWide: true },
    ...BOARD,
  },
];

/** Lessons 1 and 2 run on their own boards; the later chapters keep the class's canvas exercises until theirs are built. */
export const POPM_COURSE: { title: string; activities: ActivitySpec[]; keep?: boolean }[] = [
  { title: "Welcome", activities: welcome },
  { title: "Becoming a Product Owner / Product Manager", activities: lesson1 },
  { title: "Preparing for PI Planning", activities: lesson2 },
  { title: "Leading PI Planning", activities: [], keep: true },
  { title: "Executing Iterations", activities: [], keep: true },
  { title: "Executing the PI", activities: [], keep: true },
];
