// Leading SAFe class, chapter by chapter: each exercise with its timing, its steps (the course's
// wording), the trainer note shown beside it, and the Class Studio board it is worked on (`board`,
// drawn from the design; its setup in `config`). Exercises that share one piece of work (the value
// stream and its delays, the features and their WSJF, the PI Planning simulation) share one board.
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise is a Class Studio board; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 600 };

const welcome: ActivitySpec[] = [
  {
    title: "Welcome to Leading SAFe",
    kind: "Overview",
    prepare: 5,
    steps:
      "Step 1: Read the five disciplines of SAFe.\nStep 2: Note the chapters you will work through.",
    side: [
      {
        title: "Trainer note",
        text: "Walk through each discipline before the discussions.",
        instructorOnly: true,
      },
    ],
    board: "ov",
    config: { view: "dis" },
    ...BOARD,
  },
  {
    title: "The story of the course on the Big Picture",
    kind: "Overview",
    prepare: 7,
    steps:
      "Step 1: Follow the six chapters across the Big Picture.\nStep 2: Notice that we start with leadership and close with leadership.\nStep 3: Click a chapter to see where it lives on the Big Picture.",
    side: [
      {
        title: "Trainer note",
        text: "Tell it as one story: why change (1), leaders adopt the mindset (2), teams and technical agility (3), product development flow (4), lean portfolio management (5), then back to leadership to lead the change (6).",
        instructorOnly: true,
      },
    ],
    board: "ov",
    config: { view: "bp" },
    ...BOARD,
  },
  {
    title: "What are you hoping to get from SAFe?",
    kind: "Discussion",
    prepare: 5,
    share: 3,
    steps:
      "Step 1: Imagine it’s one year from today, and that your organization has been working with SAFe for a year.\nStep 2: In your group, discuss the questions.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Prepare 5 min, share 3 min.",
        instructorOnly: true,
      },
    ],
    board: "disc",
    config: {
      intro:
        "Imagine it’s one year from today, and your organization has been working with SAFe for a year.",
      qs: [
        "What challenges do you hope SAFe will help unlock by then?",
        "What feels difficult, slow, or frustrating today that you want to see change?",
        "If these challenges were unlocked, what would be noticeably different in how work gets done?",
        "What other indicators would tell you that SAFe is improving outcomes?",
      ],
    },
    ...BOARD,
  },
  {
    title: "AI disruption",
    kind: "Discussion",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: In your group, explore how the widespread adoption of AI may disrupt how organizations operate and deliver value.\nStep 2: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Prepare 7 min, share 3 min.",
        instructorOnly: true,
      },
    ],
    board: "disc",
    config: {
      intro:
        "Explore how the widespread adoption of AI may disrupt how organizations operate and deliver value.",
      qs: [
        "Individuals and roles: How might AI change skills, decision-making, or day-to-day work?",
        "Teams: What opportunities or risks could AI introduce for flow, quality, and collaboration?",
        "The enterprise: How might AI influence strategy, governance, or investment decisions?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Course overview: vote on a discipline",
    kind: "Activity",
    prepare: 3,
    steps:
      "Step 1: Review the five disciplines in the course.\nStep 2: Vote for the one that is most interesting for you.\nStep 3: The class results shape where we spend extra time.",
    side: [
      {
        title: "Trainer note",
        text: "Learners can change their vote until the trainer closes it.",
        instructorOnly: true,
      },
    ],
    board: "vote",
    config: { prompt: "Which SAFe discipline are you most curious about?" },
    ...BOARD,
  },
];

const lesson1: ActivitySpec[] = [
  {
    title: "Business Agility Self Assessment",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, fill in the Business Agility assessment in your workbook.\nStep 2: Share some opportunities for improvement you identified.",
    side: [
      {
        title: "Trainer note",
        text: "Look for the lowest score, then ask what one change would move it.",
        instructorOnly: true,
      },
    ],
    board: "ba",
    ...BOARD,
  },
  {
    title: "Pressure from the digital age",
    kind: "Discussion",
    prepare: 8,
    steps:
      "Step 1: Name one market or technology shift.\nStep 2: Add a sticky for how your organization responds today.",
    side: [
      {
        title: "Trainer note",
        text: "Draft prompt. Replace with the slide wording.",
        instructorOnly: true,
      },
    ],
    board: "talk",
    config: {
      prompt:
        "Where does your organization feel the most pressure to respond faster?",
    },
    ...BOARD,
  },
];

const lesson2: ActivitySpec[] = [
  {
    title: "Identify your value stream",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: Individually, select a solution your organization is developing.\nStep 2: Identify the customer you are building it for.\nStep 3: In your workbook, sketch out the basic workflow steps for the value stream.\nStep 4: Identify a few delays in the value stream and the potential causes.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 2 board. Check wording against the slide.",
        instructorOnly: true,
      },
    ],
    board: "vsid",
    config: { shared: "value-stream" },
    ...BOARD,
  },
  {
    title: "Identifying delays",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, identify delays between the steps of the value stream you identified.\nStep 2: Note how long the work waits and what it is waiting for at each delay.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Delays are usually far larger than process time. Ask what the work is waiting for.",
        instructorOnly: true,
      },
    ],
    board: "delay",
    config: { shared: "value-stream" },
    ...BOARD,
  },
  {
    title: "Agile principles at scale",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: For each Agile Manifesto principle, choose how it holds up at scale.\nStep 2: Be prepared to share where you chose “Requires rethinking for scale”.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 2 board.",
        instructorOnly: true,
      },
    ],
    board: "prin",
    ...BOARD,
  },
  {
    title: "Applying systems thinking attributes",
    kind: "Discussion",
    prepare: 8,
    steps:
      "Step 1: Discuss the questions in your group.\nStep 2: Capture the main points as stickies.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Draft questions. Replace with the slide wording.",
        instructorOnly: true,
      },
    ],
    board: "disc",
    config: {
      intro:
        "In your groups, discuss how the systems thinking attributes apply to your organization.",
      qs: [
        "Where do you see the whole system optimized, and where only a part?",
        "Which attribute would change your decisions the most?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Set-Based Design in context",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: Individually, identify an upcoming technical or business milestone in the value stream you previously identified.\nStep 2: In your workbook, identify some design options that might help to better ensure you can meet that milestone.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 2 board.",
        instructorOnly: true,
      },
    ],
    board: "sbd",
    config: {
      prompt:
        "Where could your teams keep several options open instead of committing early?",
    },
    ...BOARD,
  },
  {
    title: "Accelerating learning cycles in context",
    kind: "Activity",
    prepare: 5,
    steps:
      "Step 1: Individually, consider the value stream and solution that you previously identified.\nStep 2: In your workbook, identify which integration points might apply to reduce the risk.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 2 board.",
        instructorOnly: true,
      },
    ],
    board: "talk",
    config: {
      prompt: "How could you shorten the learning cycle in your context?",
    },
    ...BOARD,
  },
  {
    title: "Reducing batch size",
    kind: "Discussion",
    prepare: 7,
    steps:
      "Step 1: Discuss each question as a class.\nStep 2: Capture the main points as stickies.",
    side: [
      {
        title: "Trainer note",
        text: "Draft questions. Replace with the slide wording.",
        instructorOnly: true,
      },
    ],
    board: "disc",
    config: {
      intro:
        "As a class, discuss how smaller batches change the speed and delay of value delivery.",
      qs: [
        "Which batches in your value stream are largest today?",
        "What would it take to make them half the size?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Decentralize decision-making",
    kind: "Activity",
    prepare: 5,
    share: 2,
    steps:
      "Step 1: Individually, consider three significant decisions you are currently facing. Write them in the table.\nStep 2: Rate each decision based on the frequency, time criticality, and economies of scale, assigning a value of zero, one, or two.\nStep 3: Add the total values: zero to three = centralize; four to six = decentralize.",
    side: [
      {
        title: "Trainer note",
        text: "Frequent and time-critical: Yes = 2, No = 0. Economies of scale: Yes = 0, No = 2.",
        instructorOnly: true,
      },
    ],
    board: "dec",
    ...BOARD,
  },
  {
    title: "The SAFe principles",
    kind: "Overview",
    prepare: 5,
    steps:
      "Step 1: Review the ten SAFe principles.\nStep 2: Pick the one you most want to apply at work.",
    side: [
      {
        title: "Trainer note",
        text: "End of chapter 2.",
        instructorOnly: true,
      },
    ],
    board: "ov",
    config: { view: "pri" },
    ...BOARD,
  },
];

const lesson3: ActivitySpec[] = [
  {
    title: "Agile teams in your context",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: In your group, describe one team from your context.\nStep 2: Mark what it can decide and deliver without handoffs.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Placeholder lesson. Add the real exercises from the slides.",
        instructorOnly: true,
      },
    ],
    board: "talk",
    config: {
      prompt:
        "What makes a team in your organization able to deliver on its own?",
    },
    ...BOARD,
  },
];

const lesson4: ActivitySpec[] = [
  {
    title: "Empathy mapping",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, choose a customer or user.\nStep 2: Build an empathy map for them: what they see, hear, say, do, think and feel.\nStep 3: Capture their pains and gains.\nStep 4: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 4 board.",
        instructorOnly: true,
      },
    ],
    board: "emp",
    config: { prompt: "What does your customer think, feel, say and do?" },
    ...BOARD,
  },
  {
    title: "Describe three features",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: In your group, describe three features that deliver your solution’s benefit hypothesis.\nStep 2: Give each a title, a benefit hypothesis and acceptance criteria.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Feature titles carry into the WSJF table.",
        instructorOnly: true,
      },
    ],
    board: "feat",
    config: {
      prompt:
        "Which three features would deliver your solution’s benefit hypothesis?",
      shared: "features",
    },
    ...BOARD,
  },
  {
    title: "WSJF prioritization",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, prioritize three of the features you identified earlier using WSJF.\nStep 2: Do one column at a time. Start by picking the smallest item and giving it a 1. There must be at least one 1 in each column.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Scale for each parameter: 1, 2, 3, 5, 8, 13, 20. CoD is the sum of the first three columns.",
        instructorOnly: true,
      },
    ],
    board: "wsjf",
    config: {
      prompt:
        "Which feature goes first when you divide cost of delay by job size?",
      shared: "features",
    },
    ...BOARD,
  },
  {
    title: "Relative size estimating",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: Choose the smallest item and give it 1.\nStep 2: Estimate the remaining items relative to it using the Fibonacci scale.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 4 board.",
        instructorOnly: true,
      },
    ],
    board: "rse",
    config: {
      prompt:
        "Which item is the smallest, and how much bigger is each of the others?",
    },
    ...BOARD,
  },
  {
    title: "Calculate your initial capacity",
    kind: "Simulation",
    prepare: 10,
    steps:
      "Step 1: For every full-time Agile Team member contributing to solution development, give the team eight points. Adjust for part-time members.\nStep 2: Subtract one point for every team member vacation day and holiday.\nStep 3: Assign one point to a story that would take about a half day to develop and a half day to test and validate.\nStep 4: Estimate every other story relative to that one.",
    side: [
      {
        title: "Trainer note",
        text: "Example: a seven-person team (3 developers, 2 testers, PO, SM). Exclude the SM/Team Coach, PO and vacation time: 5 x 8 = 40 points per iteration.",
        instructorOnly: true,
      },
    ],
    board: "cap",
    ...BOARD,
  },
  {
    title: "PI planning board",
    kind: "Simulation",
    prepare: 50,
    steps:
      "Step 1: Calculate and enter the capacity for each iteration (two weeks per iteration). The first iteration starts Monday. Use your real availability.\nStep 2: Estimate the stories using story points.\nStep 3: Load the stories into the iterations.\nStep 4: Write the PI objectives using clear statements.\nStep 5: Identify the uncommitted objectives.\nStep 6: Identify any ART PI risks and dependencies.",
    side: [
      {
        title: "Trainer note",
        text: "Pick the simulation for the class. Each team is assigned one or two features from it. Teams plan a short PI with two iterations.",
        instructorOnly: true,
      },
    ],
    board: "pib",
    config: { shared: "pi-planning" },
    ...BOARD,
  },
  {
    title: "Coach Sync",
    kind: "Activity",
    prepare: 5,
    steps:
      "Step 1: The teams observe the Coach Sync, conducted by the RTE.\nStep 2: Choose a Scrum Master/Team Coach to provide the team’s current status and address the questions from the RTE.\nStep 3: The RTE holds a meet-after following the sync (limited to one or two topics for the simulation).",
    side: [
      {
        title: "Trainer note",
        text: "Tap a cell to cycle Yes, Partly, No for each team.",
        instructorOnly: true,
      },
    ],
    board: "pcs",
    config: { shared: "pi-planning" },
    ...BOARD,
  },
  {
    title: "Draft plan review",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: The teams present summaries of their first two iterations and one or more draft PI objectives.\nStep 2: Include capacity and load for each iteration, draft PI objectives, and ART PI risks and impediments.",
    side: [
      {
        title: "Trainer note",
        text: "Each team’s summary is filled from its own board. Use Next to hand over to the following team.",
        instructorOnly: true,
      },
    ],
    board: "ppr",
    config: { shared: "pi-planning" },
    ...BOARD,
  },
  {
    title: "Setting business value",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: Bring one team’s draft plans to the Business Owners.\nStep 2: The Business Owners set value on a scale of 1–10 for each identified objective.\nStep 3: Observe the discussion that would take place, illustrating the larger purposes and thought processes around assigning business value.",
    side: [
      {
        title: "Trainer note",
        text: "Drag objectives between committed and uncommitted. Uncommitted objectives still carry a business value.",
        instructorOnly: true,
      },
    ],
    board: "pbv",
    config: { shared: "pi-planning" },
    ...BOARD,
  },
  {
    title: "Manage ART PI risks",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: Pick one to two risk examples.\nStep 2: Read them in front of all teams and stakeholders.\nStep 3: Ask if anyone can own, help mitigate, or resolve the risks. Otherwise, accept the risk as-is.\nStep 4: Put each risk into a corresponding quadrant of the ROAM sheet for the ART.",
    side: [
      {
        title: "Trainer note",
        text: "Resolved: addressed, no longer a concern. Owned: someone has taken responsibility. Accepted: nothing more can be done; if the risk occurs, the release may be compromised. Mitigated: the team has plans to adjust as necessary.",
        instructorOnly: true,
      },
    ],
    board: "prm",
    config: { shared: "pi-planning" },
    ...BOARD,
  },
  {
    title: "AI-empowered PI Planning",
    kind: "Discussion",
    prepare: 5,
    steps:
      "Step 1: As a class, brainstorm ways AI can reduce overhead or friction in PI Planning.\nStep 2: Consider the questions. Examples: summarizing planning inputs and outputs; surfacing risks, dependencies and timing conflicts; capturing decisions and action items in real time.",
    side: [{ title: "Trainer note", text: "5 min.", instructorOnly: true }],
    board: "disc",
    config: {
      intro:
        "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning.",
      qs: [
        "Where did planning feel hardest or most time-consuming?",
        "How could AI reduce effort, improve clarity, or surface risks earlier?",
        "What should always remain a human responsibility?",
        "What’s one AI-enabled improvement you’d consider trying next PI?",
      ],
    },
    ...BOARD,
  },
];

const lesson5: ActivitySpec[] = [
  {
    title: "Identify strategic themes",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: Individually, identify three Strategic Themes that help define the strategy of your portfolio in the upcoming year.\nStep 2: Ask whether they differentiate your business from business as usual.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 5 board.",
        instructorOnly: true,
      },
    ],
    board: "talk",
    config: {
      prompt: "Which three strategic themes would guide your portfolio?",
    },
    ...BOARD,
  },
  {
    title: "Epic writing",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, identify an Epic from your context.\nStep 2: Write the Epic hypothesis statement.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "From the Lesson 5 board.",
        instructorOnly: true,
      },
    ],
    board: "talk",
    config: {
      prompt: "What is an Epic in your context, and what is its hypothesis?",
    },
    ...BOARD,
  },
];

const lesson6: ActivitySpec[] = [
  {
    title: "Exploring leadership skills",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: Individually, reflect on the leading by example attributes.\nStep 2: Identify one or two of these to focus on in your current context and consider their potential impacts.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Draft definitions: check against the slide wording.",
        instructorOnly: true,
      },
    ],
    board: "attr",
    ...BOARD,
  },
  {
    title: "Responsible AI and Portfolio Leadership",
    kind: "Discussion",
    prepare: 7,
    share: 5,
    steps:
      "Step 1: Individually, read the scenario.\nStep 2: In your group, evaluate the recommendation using the three aspects of Responsible AI.\nStep 3: Be prepared to share your decision and reasoning with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Prepare 7 min, share 5 min.",
        instructorOnly: true,
      },
    ],
    board: "disc",
    config: {
      intro:
        "Portfolio Leadership’s AI has analyzed time-to-market for all value streams. It finds the Digital Payments ART is consistently slowed by a lack of specialized security engineers. To fix this, it recommends instantly reassigning four senior security experts from the Legacy Banking ART to the Digital Payments ART and canceling two upcoming security hires to reduce the labor budget.",
      qs: [
        "Trustworthy: What data is the AI likely looking at? Does it have the whole picture?",
        "Explainable: What logic or data do you need from the AI to justify this recommendation?",
        "Human-centric: What happens to the Legacy team’s morale? What is Portfolio Leadership’s role in this shift?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Your next steps",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Identify one improvement you want to make in how your organization delivers value.\nStep 2: Decide which SAFe value(s), principle(s), or practice(s) will guide your approach.\nStep 3: Determine the first step you will take in the next 30 days.\nStep 4: Be prepared to share with the class.",
    side: [
      {
        title: "Trainer note",
        text: "Placeholder closing. Learners keep their commitment card after the class.",
        instructorOnly: true,
      },
    ],
    board: "next",
    ...BOARD,
  },
];

export const LEADING_SAFE_COURSE: {
  title: string;
  activities: ActivitySpec[];
}[] = [
  { title: "Welcome", activities: welcome },
  {
    title: "Thriving in the digital age with business agility",
    activities: lesson1,
  },
  {
    title: "Building a foundation with mindset, values and principles",
    activities: lesson2,
  },
  { title: "Establishing team and technical agility", activities: lesson3 },
  {
    title: "Building solutions with Agile product delivery",
    activities: lesson4,
  },
  { title: "Exploring Lean Portfolio Management", activities: lesson5 },
  { title: "Leading the change", activities: lesson6 },
];
