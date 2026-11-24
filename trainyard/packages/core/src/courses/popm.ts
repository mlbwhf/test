// AI-Empowered SAFe Product Owner/Product Manager class, chapter by chapter: each exercise with its
// timing, its steps (the exact wording of the Scaled Agile course) and the board it is worked on
// (`board`; its setup in `config`).
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise has a board of its own; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 600 };
/** The course's AI prompting template, for the activities that write a prompt. */
const TEMPLATE = { title: "AI prompting template (spreadsheet)", url: "/courses/popm/ai-prompting-template.xlsx" };

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
      look: "dial",
      dial: { label: "How much will AI change your day as a Product Owner or Product Manager?", low: "Barely", high: "Completely" },
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
    side: [TEMPLATE],
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
    side: [{ title: "Sample Deep Research Report: Digital Product Experience Friction (PDF)", url: "/courses/popm/sample-deep-research-report.pdf" }],
    board: "po-ai",
    config: {
      prompt: "Review the provided AI-generated customer research report, then discuss it with your group.",
      look: "dial",
      dial: { label: "How far would you act on this report before talking to customers?", low: "Not at all", high: "All the way" },
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
    side: [TEMPLATE],
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

const lesson3: ActivitySpec[] = [
  {
    title: "Communicate the vision",
    kind: "Activity",
    prepare: 10,
    share: 10,
    steps:
      "Step 1: In your group, act as Product Management. Review the TTC Van solution vision, PI roadmap, and top 10 features on the following slides.\nStep 2: Develop a short vision message (2–3 minutes, spoken) that you would deliver to your ART at the start of PI Planning. Your message should answer three questions your ART needs:\n- Where are we going, and why does it matter?\n- What does this mean for what we're building this PI?\n- Why should the team care?\nStep 3: Be prepared to share with the class.",
    side: [TEMPLATE, { title: "Tip", text: "Use an LLM of your choice to help you draft or refine your message. Include the five prompting elements for best results: Goal, Role, Task, Context, Details." }],
    board: "po-vision",
    config: {
      prompt: "Act as Product Management: develop a short vision message (2–3 minutes, spoken) that you would deliver to your ART at the start of PI Planning.",
      questions: ["Where are we going, and why does it matter?", "What does this mean for what we're building this PI?", "Why should the team care?"],
    },
    ...BOARD,
  },
  {
    title: "Addressing issues during management review and problem-solving",
    kind: "Discussion",
    prepare: 5,
    steps:
      "Step 1: As a class, review the following scenario:\nDuring PI Planning, the team that is spiking enabler stories for sensor impact on manufacturing realizes they are also the best equipped team to work on the feature to install sensors in lab vehicles. However, they do not believe they have capacity for both features.\nStep 2: Identify the core issue the team is raising and discuss solutions that Product Management can present to resolve those issues",
    board: "po-ai",
    config: {
      classWide: true,
      prompt:
        "During PI Planning, the team that is spiking enabler stories for sensor impact on manufacturing realizes they are also the best equipped team to work on the feature to install sensors in lab vehicles. However, they do not believe they have capacity for both features.",
      kinds: [],
      add: "+ add, Enter",
      shareLabel: "What Product Management presents",
      look: "scale",
      lenses: [
        ["The core issue", "What is the core issue the team is raising?"],
        ["Solutions", "What solutions can Product Management present to resolve those issues?"],
      ],
    },
    ...BOARD,
  },
  {
    title: "Identify dependency issues and resolve them",
    kind: "Activity",
    prepare: 10,
    steps:
      "As a class, review the ART Planning Board and consider the following:\n- What potential issues do you see?\n- Who should POs and Product Management collaborate with to help minimize dependencies and address the issues identified?",
    side: [{ title: "ART Planning Board legend", text: "Features: blue. Significant dependency: red or pink. Milestone or event: orange. Red strings (or lines for digital boards) are used to connect a feature or milestone to one or more dependencies. Sometimes a dependency has its own dependencies (see Lions in iteration 1.2)." }],
    board: "po-deps",
    config: {
      classWide: true,
      questions: ["What potential issues do you see?", "Who should POs and Product Management collaborate with to help minimize dependencies and address the issues identified?"],
    },
    ...BOARD,
  },
  {
    title: "AI-empowered PI Planning",
    kind: "Discussion",
    prepare: 5,
    steps:
      "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning. Consider:\n- Where does planning seem the hardest or most time-consuming?\n- How could AI reduce effort, improve clarity, or surface risks earlier?\n- What should always remain a human responsibility?\n- What’s one AI-enabled improvement you’d consider trying next PI?",
    board: "po-ai",
    config: {
      classWide: true,
      prompt: "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning.",
      kinds: [],
      add: "+ add, Enter",
      shareLabel: "What we would try next PI",
      look: "spectrum",
      examples: ["Summarizing planning inputs and outputs", "Surfacing risks, dependencies, and timing conflicts", "Capturing decisions and action items in real time"],
      lenses: [
        ["Hardest part", "Where does planning seem the hardest or most time-consuming?"],
        ["Where AI helps", "How could AI reduce effort, improve clarity, or surface risks earlier?"],
        ["Stays human", "What should always remain a human responsibility?"],
        ["Try next PI", "What’s one AI-enabled improvement you’d consider trying next PI?"],
      ],
    },
    ...BOARD,
  },
];

const lesson4: ActivitySpec[] = [
  {
    title: "Develop a story map",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "Step 1: With your group, create a story map for the feature. Think about:\n- What are the main tasks?\n- What is the minimum number of stories required to complete the feature?\nStep 2: Be prepared to share with the class",
    board: "po-map",
    config: {
      feature: {
        name: "Delivery order insurance",
        hyp: "Allows user to purchase extra insurance for an existing delivery order",
        intent: "Enable TTC customers to complete the purchase of supplemental insurance directly within the mobile app,",
        ac: "Access the insurance catalog from account profile. Display available insurance options. Integrate with shopping cart. Process payment.",
      },
      seed: { tasks: ["Browse catalog", "Go to website", "Select policy", "Purchase"], must: ["Login", "View my account", "Access the catalog"], later: ["Accessible from any device", "Chatbot directs user to catalog"] },
    },
    ...BOARD,
  },
  {
    title: "Relative size estimating",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps: "Use estimating poker to relatively estimate the mass of a set of animals.\nStep 1: In your group, identify the smallest animal and mark it as 1\nStep 2: Estimate the remaining animals using the values 2, 3, 5, 8, 13, 20, 40, and 100",
    board: "rse",
    config: { prompt: "Which item is the smallest, and how much bigger is each of the others?" },
    ...BOARD,
  },
  {
    title: "AI-assisted Iteration Planning",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: In your group, review these user stories the upcoming iteration and manually write two to three iteration goals.\nStep 2: From the class page, copy the LLM Iteration Goals Prompt and paste it into an LLM tool.\nStep 3: Compare side by side:\n- What did the AI miss that you included? What did AI add that you hadn’t considered?\n- If you’d only looked at the AI draft, what issues would you have overlooked?\nStep 4: Refine the AI draft by combining the best of both versions.\nStep 5: Be prepared to share with the class.",
    board: "po-iter",
    config: {
      stories: [
        "As a shipping coordinator, I want carrier pickup times synced to our packing queue so that shipments are staged before the truck arrives.",
        "As an inventory manager, I want automatic reorder triggers when stock drops below threshold so that I don't discover shortages during fulfillment.",
        "As a returns processor, I want damaged item photos captured at scan so that claims are documented without a separate step.",
      ],
      llmPrompt: "You are an experienced Product Owner on an Agile Team. Write two to three iteration goals for the upcoming iteration from the user stories below. Each goal should state the outcome for the user or the business, be something the team can commit to, and be clear enough to check at the iteration review. Then list anything you had to assume.",
    },
    ...BOARD,
  },
  {
    title: "Building the Continuous Delivery Pipeline",
    kind: "Discussion",
    prepare: 10,
    steps:
      "As a class, discuss how Product Owners and Product Managers support or drive the various aspects and activities of the Continuous Delivery Pipeline. Consider the following:\n- How can product roles support Continuous Exploration?\n- How can product roles support Continuous Integration?\n- How can product roles support Continuous Deployment?\n- How can product roles support Release on Demand?",
    board: "po-ai",
    config: {
      classWide: true,
      prompt: "As a class, discuss how Product Owners and Product Managers support or drive the various aspects and activities of the Continuous Delivery Pipeline.",
      kinds: [],
      add: "+ add, Enter",
      shareLabel: "What stands out",
      look: "pipeline",
      lenses: [
        ["Continuous Exploration", "How can product roles support Continuous Exploration?"],
        ["Continuous Integration", "How can product roles support Continuous Integration?"],
        ["Continuous Deployment", "How can product roles support Continuous Deployment?"],
        ["Release on Demand", "How can product roles support Release on Demand?"],
      ],
    },
    ...BOARD,
  },
];

const lesson5: ActivitySpec[] = [
  {
    title: "Enabling alignment across the ART with sync events",
    kind: "Discussion",
    prepare: 10,
    steps:
      "Step 1: Individually, think about the various sync events that are part of SAFe (Team Sync, Coach Sync, PO Sync, ART Sync, Architect Sync)\nStep 2: As a class, discuss the following:\n- How can you leverage these sync events as a PO or Product Manager to ensure alignment across the ART?\n- What issues and opportunities might you bring up?\n- What potential solutions might you offer to resolve the issues and follow through with opportunities?",
    board: "po-ai",
    config: {
      classWide: true,
      prompt: "Think about the various sync events that are part of SAFe, then discuss as a class.",
      kinds: ["Team Sync", "Coach Sync", "PO Sync", "ART Sync", "Architect Sync"],
      add: "+ add, Enter",
      shareLabel: "What stands out",
      look: "wheel",
      lenses: [
        ["Leverage the syncs", "How can you leverage these sync events as a PO or Product Manager to ensure alignment across the ART?"],
        ["Issues and opportunities", "What issues and opportunities might you bring up?"],
        ["Solutions", "What potential solutions might you offer to resolve the issues and follow through with opportunities?"],
      ],
    },
    ...BOARD,
  },
  {
    title: "Responsible AI and product decisions",
    kind: "Discussion",
    prepare: 7,
    share: 5,
    steps:
      "Step 1: Individually, read the following scenario:\n- An AI tool analyzes onboarding data and finds that many new users abandon the product before completing setup. It recommends simplifying onboarding by removing steps and introducing a guided “quick start” experience to help users reach value faster.\nStep 2: In your group, evaluate this recommendation using the three aspects of Responsible AI:\n- Trustworthy: Does this reflect the full customer experience?\n- Explainable: What evidence supports this recommendation?\n- Human-centric: What are the risks or unintended impacts for users?\nStep 3: Be prepared to share with the class.",
    board: "po-ai",
    config: {
      prompt:
        "An AI tool analyzes onboarding data and finds that many new users abandon the product before completing setup. It recommends simplifying onboarding by removing steps and introducing a guided “quick start” experience to help users reach value faster.",
      kinds: [],
      add: "+ add, Enter",
      shareLabel: "Step 3 · What we share with the class",
      look: "venn",
      verdictLabel: "Would we act on this recommendation?",
      verdicts: ["Yes", "With safeguards", "Not yet"],
      lenses: [
        ["Trustworthy", "Does this reflect the full customer experience?"],
        ["Explainable", "What evidence supports this recommendation?"],
        ["Human-centric", "What are the risks or unintended impacts for users?"],
      ],
    },
    ...BOARD,
  },
  {
    title: "Join AI and PO/PM professionals in SAFe Connect",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "The forums in SAFe Connect will help you continue learning about AI and Product Management after your class.\nStep 1: In SAFe Studio, navigate to SAFe Connect, via https://connect.scaledagile.com/.\n- You will start by filling out your profile. Tell us about yourself!\nStep 2: Click the Discuss tab and go to the AI in Practice forum. Explore some posts or create your own.\nStep 3: Click the Events tab. Register for an upcoming Community Welcome Webinar or roundtable event.\nStep 4: Click the Content tab and then click on the Toolsday tile to explore some interesting AI tools that our community is using.\nStep 5: Be prepared to share with the class.",
    side: [{ title: "SAFe Connect", url: "https://connect.scaledagile.com/" }],
    board: "po-check",
    config: {
      prompt: "The forums in SAFe Connect will help you continue learning about AI and Product Management after your class.",
      url: "https://connect.scaledagile.com/",
      steps: [
        ["Open SAFe Connect. ", "In SAFe Studio, navigate to SAFe Connect and fill out your profile. Tell us about yourself!"],
        ["Discuss tab. ", "Go to the AI in Practice forum. Explore some posts or create your own."],
        ["Events tab. ", "Register for an upcoming Community Welcome Webinar or roundtable event."],
        ["Content tab. ", "Click on the Toolsday tile to explore some interesting AI tools that our community is using."],
      ],
    },
    ...BOARD,
  },
];

/** Every lesson runs on its own boards. Lesson 3 is marked `keep`: it still shows the PI Planning simulation from the canvas class, with its new boards after it. */
export const POPM_COURSE: { title: string; activities: ActivitySpec[]; keep?: boolean }[] = [
  { title: "Welcome", activities: welcome },
  { title: "Becoming a Product Owner / Product Manager", activities: lesson1 },
  { title: "Preparing for PI Planning", activities: lesson2 },
  { title: "Leading PI Planning", activities: lesson3, keep: true },
  { title: "Executing Iterations", activities: lesson4 },
  { title: "Executing the PI", activities: lesson5 },
];
