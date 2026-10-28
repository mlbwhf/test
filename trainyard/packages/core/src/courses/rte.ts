// Release Train Engineer (RTE) class, chapter by chapter: each exercise with its timing, its steps
// (the exact wording of the Scaled Agile course), the material shown beside it, and the Class Studio
// board it is worked on (`board`, drawn from the design; its setup in `config`).
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise is a Class Studio board; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 600 };

const lesson1: ActivitySpec[] = [
  {
    title: "Identify RTE connections",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: Working in your groups, use the Big Picture to identify connections between the RTE and other Framework elements across communication, collaboration, problem-solving, and inputs/outputs. Identify at least one connection for each type.\nStep 2: Be ready to present and discuss the connections you identify.",
    side: [
      {
        title: "Example connections",
        image: "/courses/rte/rte-connections-example.png",
        instructorOnly: true,
      },
    ],
    board: "connect",
    ...BOARD,
  },
  {
    title: "Exploring RTE responsibilities",
    kind: "Discussion",
    prepare: 15,
    steps:
      "Step 1: With your group, choose one key responsibility of the RTE.\nStep 2: Brainstorm concrete activities and behaviors a skilled RTE would use to fulfill that responsibility. Think about day-to-day actions, facilitation techniques, and coaching approaches.\nStep 3: Create a concise and engaging two-minute overview. Highlight how these behaviors contribute to the team, the ART, and the organization achieving better outcomes.\nStep 4: Be prepared to share with the class.",
    side: [
      {
        title: "Release Train Engineer article",
        url: "https://framework.scaledagile.com/release-train-engineer/",
      },
      { title: "The RTE role", image: "/courses/rte/rte-role.webp" },
    ],
    board: "wheel",
    config: { prompt: "With your group, choose one key responsibility of the RTE." },
    ...BOARD,
  },
  {
    title: "SAFe foundations filter",
    kind: "Discussion",
    prepare: 5,
    share: 3,
    steps:
      "Step 1: Individually, recall a recent tough situation or decision you experienced as an RTE\nStep 2: Consider which SAFe foundational concept (Lean-Agile mindset, Core Values, or SAFe Principles) guided that decision\nStep 3: Discuss with your group:\n- How did that foundation shape the outcome?\n- What might have happened if it had been ignored or misunderstood?\nStep 4: Be prepared to share one takeaway with the class",
    board: "talk",
    config: {
      prompt:
        "Consider which SAFe foundational concept (Lean-Agile mindset, Core Values, or SAFe Principles) guided that decision",
    },
    ...BOARD,
  },
  {
    title: "AI disruption and the RTE role",
    kind: "Discussion",
    prepare: 15,
    share: 5,
    steps:
      "Step 1: In your group, explore how the widespread adoption of AI could augment Release Train Engineers’ responsibilities and support teams in delivering value. For example, consider:\n- PI Planning facilitation: How might AI-assisted planning tools and dependency mapping change how you prepare for and facilitate PI Planning events, and how you budget your time?\n- Impediment identification: How might AI analyzing team metrics, flow data, and retrospective feedback change how you identify and remove impediments across the ART?\n- Coach and servant leader priorities: How might AI handling coordination and reporting tasks change how you support team-level and ART-level continuous improvement?\nStep 2: Be prepared to share with the class.",
    side: [{ title: "The RTE role", image: "/courses/rte/rte-role.webp" }],
    board: "talk",
    config: {
      prompt:
        "In your group, explore how the widespread adoption of AI could augment Release Train Engineers’ responsibilities and support teams in delivering value.",
    },
    ...BOARD,
  },
  {
    title: "Prepare for a conversation",
    kind: "Activity",
    prepare: 10,
    steps:
      "Step 1: In your group, consider the following scenario:\nYou are an RTE and have just been told by your Lean-Agile Center of Excellence that PI Planning is going to be virtual this quarter due to budget cuts. The VP of Engineering is not happy about this decision, as they are a strong supporter of in-person PI Planning. You plan to have a conversation with her to address her concerns and keep her engaged and committed to the event.\nStep 2: Use an LLM of your choice (ChatGPT, Claude, SAFe CoPilot, etc.) and ask it to help you prepare for a conversation with the VP of Engineering. Be sure to include the five key elements in your prompt.\nStep 3: With your group, evaluate the response and identify the following, with explanations for each:\n- One line you'd keep.\n- One line you'd change.\n- One line you would not say.\nStep 4: Be prepared to share with the class.",
    side: [
      {
        title: "A good prompt: five elements",
        image: "/courses/rte/prompt-elements.webp",
      },
    ],
    board: "talk",
    config: {
      prompt:
        "Use an LLM of your choice (ChatGPT, Claude, SAFe CoPilot, etc.) and ask it to help you prepare for a conversation with the VP of Engineering. Be sure to include the five key elements in your prompt.",
    },
    ...BOARD,
  },
];

const lesson2: ActivitySpec[] = [
  {
    title: "Key ART collaborations",
    kind: "Discussion",
    prepare: 8,
    steps:
      "As a class, discuss how the RTE facilitates connections between the key ART stakeholders (Product Management, System Architect, Business Owner, systems team and Release Train Engineer). Consider the following:\n- What possible anti-patterns can arise in this group?\n- How can an RTE mitigate these anti-patterns?",
    board: "disc",
    config: {
      intro:
        "As a class, discuss how the RTE facilitates connections between the key ART stakeholders (Product Management, System Architect, Business Owner, systems team and Release Train Engineer).",
      qs: [
        "What possible anti-patterns can arise in this group?",
        "How can an RTE mitigate these anti-patterns?",
      ],
    },
    ...BOARD,
  },
];

const lesson3: ActivitySpec[] = [
  {
    title: "How much preparation is enough?",
    kind: "Activity",
    prepare: 5,
    share: 5,
    steps: "How much preparation is enough?",
    board: "quad",
    ...BOARD,
  },
  {
    title: "PI Planning readiness preparation",
    kind: "Activity",
    prepare: 5,
    share: 5,
    shareLabel: "Showcase",
    steps:
      "Step 1: Determine which items on the ART readiness checklist must be in place in order to run your next PI Planning event.\nStep 2: In your workbook, mark each item with a Y, N, or D to indicate if it is necessary for running the PI Planning event:\n- (Y) Yes, must be in place\n- (N) No, doesn’t need to be in place\n- (D) Depends on context\nStep 3: Be prepared to share with the class",
    board: "check",
    ...BOARD,
  },
  {
    title: "Reading the ART planning board in PI Planning",
    kind: "Activity",
    prepare: 7,
    steps:
      "Step 1: With your group, look at the three different ART planning board examples\nStep 2: Capture the answers to the following questions for each scenario:\n- What problems do you see?\n- How would you, the RTE, act if you could see these on the ART planning board at the end of Day 1 in PI Planning?\n- What could be a potential solution for the specific problems?\nStep 3: Be prepared to share with the class",
    board: "art",
    ...BOARD,
  },
  {
    title: "Conflicting views of value",
    kind: "Activity",
    prepare: 7,
    share: 3,
    steps:
      "Step 1: Consider the following scenario:\nBusiness Owners have assigned a value of 2 to the PI Objective “Reduce GPS signal loss by 25%,” and they have requested that the team move the objective to uncommitted. The team believes this function provides a critical architectural enablement for the entire ART. The team is clearly disappointed and concerned that an important technical item is ranked so low. “We just don’t see much business value in it now,” said the Vice President of Product.\nStep 2: Working in your group, discuss what your steps should be for solving this problem\nStep 3: Be prepared to share with the class",
    side: [
      { title: "Objectives for PI 1", image: "/courses/rte/pi-objectives.png" },
    ],
    board: "bv",
    ...BOARD,
  },
  {
    title: "ROAM ART PI risks",
    kind: "Activity",
    prepare: 10,
    steps:
      "Step 1: As a class, read through the six risks on the next slide.\nStep 2: Develop a clear plan for how you, the RTE, would facilitate ROAMing the risks.\nStep 3: Document the approach for each risk. Indicate what ROAM you would suggest and why. Focus on how you would facilitate finding the solution during PI Planning, not what the solution would be",
    side: [
      {
        title: "Addressing ART PI risks",
        text: "After all plans have been presented, the remaining ART PI risks and impediments are discussed and categorized.\n\nROAM stands for:\n- Resolved - Addressed; the risk is no longer a concern\n- Owned - Someone has taken responsibility\n- Accepted - Nothing more can be done, and if the risk occurs, the release may be compromised\n- Mitigated - The team has a plan to adjust as necessary",
      },
    ],
    board: "roam",
    ...BOARD,
  },
  {
    title: "Confidence not high? Plan rework.",
    kind: "Discussion",
    prepare: 7,
    steps:
      "As a class, discuss the role of the RTE in facilitating the confidence vote. Consider the following:\n- How can the RTE ensure that attendees feel safe to voice their concerns?\n- How would you facilitate reworking the plan if there is little to no confidence (teams vote a 1 or 2)?\n- What agreements would you put in place to rework the plan?",
    board: "disc",
    config: {
      intro:
        "As a class, discuss the role of the RTE in facilitating the confidence vote.",
      qs: [
        "How can the RTE ensure that attendees feel safe to voice their concerns?",
        "How would you facilitate reworking the plan if there is little to no confidence (teams vote a 1 or 2)?",
        "What agreements would you put in place to rework the plan?",
      ],
    },
    ...BOARD,
  },
  {
    title: "AI-empowered PI Planning",
    kind: "Discussion",
    prepare: 5,
    steps:
      "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning. Consider:\n- Where does planning feel the hardest or most time-consuming?\n- How could AI reduce effort, improve clarity, or surface risks earlier?\n- What should always remain a human responsibility?\n- What’s one AI-enabled improvement you’d consider trying next PI?\nExamples:\n- Summarizing planning inputs and outputs\n- Surfacing risks, dependencies, and timing conflicts\n- Capturing decisions and action items in real time",
    board: "disc",
    config: {
      intro:
        "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning.",
      qs: [
        "Where does planning feel the hardest or most time-consuming?",
        "How could AI reduce effort, improve clarity, or surface risks earlier?",
        "What should always remain a human responsibility?",
        "What’s one AI-enabled improvement you’d consider trying next PI?",
      ],
      exs: [
        "Summarizing planning inputs and outputs",
        "Surfacing risks, dependencies, and timing conflicts",
        "Capturing decisions and action items in real time",
      ],
    },
    ...BOARD,
  },
];

const lesson4: ActivitySpec[] = [
  {
    title: "The RTE and ART events",
    kind: "Activity",
    prepare: 10,
    share: 12,
    steps:
      "Step 1: In your group, prepare a three-minute presentation about an ART event facilitated by the RTE. Use the event descriptions as a guide and draw from your own experiences. Be sure to include:\n- A clear statement about the purpose of the event and why it’s important for the RTE role\n- A list of facilitators and attendees, plus a suggested agenda for the event with timing and cadence\n- The key inputs and outputs of the event\n- Possible event anti-patterns, like a discussion of what would happen if this event was canceled\n- Success criteria for the RTE\n- General tips\nStep 2: Be prepared to share with the class.",
    board: "evt",
    ...BOARD,
  },
  {
    title: "Build your own ART kanban board",
    kind: "Activity",
    prepare: 15,
    share: 10,
    steps:
      "Step 1: In your group, select one person’s context.\nStep 2: Together, build an ART kanban board using the tools described in this lesson topic. Be sure the group:\n- Understands the actual workflow of features.\n- Decides how to map it to the board (columns, policies, and so on).\n- Determines initial WIP limits.\nStep 3: Be prepared to share with the class.",
    side: [
      {
        title: "Example ART kanban board",
        image: "/courses/rte/kanban-example.webp",
      },
    ],
    board: "kanban",
    ...BOARD,
  },
  {
    title: "Accelerating quality",
    kind: "Discussion",
    prepare: 12,
    steps:
      "AI tools offer powerful ways to accelerate quality workflows, but they introduce new risks to the continuous delivery pipeline.\nAs a class, discuss the following:\n- How can an RTE coach teams to use AI safely to accelerate basic built-in quality practices (e.g., test auto-generation, code reviews)?\n- What risks emerge when teams over-rely on AI, and how do we apply the definition of done as a strict guardrail?\n- Which ART roles and events are most critical for aligning and maintaining these AI quality boundaries?",
    board: "disc",
    config: {
      intro:
        "AI tools offer powerful ways to accelerate quality workflows, but they introduce new risks to the continuous delivery pipeline.",
      tag: "Basic Agile Quality Practices",
      qs: [
        "How can an RTE coach teams to use AI safely to accelerate basic built-in quality practices (e.g., test auto-generation, code reviews)?",
        "What risks emerge when teams over-rely on AI, and how do we apply the definition of done as a strict guardrail?",
        "Which ART roles and events are most critical for aligning and maintaining these AI quality boundaries?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Create a two-minute pitch",
    kind: "Activity",
    prepare: 10,
    share: 10,
    steps:
      "Step 1: In your group, create a two-minute pitch to Business Owners and Product Management about the need to build DevOps capabilities. Be sure to include the following:\n- A clear statement about what is likely to happen if the practice is not implemented.\n- A statement about how the RTE can support this practice.\n- Metrics to support your pitch.\nStep 2: Be prepared to share with the class.",
    board: "pitch",
    ...BOARD,
  },
];

const lesson5: ActivitySpec[] = [
  {
    title: "Measuring the flow of value",
    kind: "Activity",
    prepare: 5,
    share: 3,
    steps:
      "Step 1: Individually, select which flow metrics would provide the most value for your ART. For each selected metric, capture:\n- Purpose: What question does this metric help you answer?\n- Data source: Where could you collect this data (for example, from a tool, report, or board)?\n- Action: How would you use the results to improve flow?\nStep 2: Reflect on how your ART kanban supports visualization of these metrics. What adjustments might help you see or track flow more effectively?\nStep 3: Be prepared to share with the class.",
    board: "metrics",
    ...BOARD,
  },
  {
    title: "Data versus context",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Consider the following scenario:\n- Your organization's AI widget analyzed your PI 3 flow metric data and generated a summary report and recommended insights. However, the widget is missing a critical piece of operational context: Midway through PI 3, three teams were redirected for two iterations to address an emergency security vulnerability. Planned feature work stopped, and unplanned remediation work took its place. The risk was successfully resolved, but the metrics reflect an ART operating under highly abnormal conditions.\nStep 2: Working in your groups, review the ART flow metrics and AI-generated insights in the activity handout. Select 1–2 of the insights to analyze and decide whether the recommendations are safe to implement directly or address the wrong problem.\nStep 3: Be prepared to share with the class.",
    board: "ctx",
    ...BOARD,
  },
  {
    title: "Which flow accelerators address what kind of problems?",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: In your group, review the example problems on the next slide. Select the problems that most closely match one you experience in your team or ART.\nStep 2: Select which flow accelerators would help address that problem.\nStep 3: Be prepared to share with the class.",
    board: "accel",
    ...BOARD,
  },
];

const lesson6: ActivitySpec[] = [
  {
    title: "Balancing the IP iteration",
    kind: "Discussion",
    prepare: 7,
    steps:
      "Step 1: Reflect on how your ART currently uses the IP iteration\nStep 2: Discuss as a class:\n- How do you balance innovation, planning, and readiness activities?\n- What trade-offs or tensions have you experienced?\n- What can the RTE do to protect time for innovation while ensuring readiness for PI Planning?",
    board: "disc",
    config: {
      intro: "Reflect on how your ART currently uses the IP iteration",
      qs: [
        "How do you balance innovation, planning, and readiness activities?",
        "What trade-offs or tensions have you experienced?",
        "What can the RTE do to protect time for innovation while ensuring readiness for PI Planning?",
      ],
    },
    ...BOARD,
  },
  {
    title: "Preparing for the PI System Demo",
    kind: "Discussion",
    prepare: 7,
    steps:
      "As a class, discuss the following questions:\n- What preparations does the RTE need to do before the I&A for the PI System Demo?\n- What preparations does the RTE need to do before the I&A for the quantitative and qualitative measurements?\n- Who can assist the RTE with these preparations?\n- What can the RTE do to ensure key ART stakeholders attend the I&A?",
    board: "disc",
    config: {
      intro: "As a class, discuss the following questions:",
      qs: [
        "What preparations does the RTE need to do before the I&A for the PI System Demo?",
        "What preparations does the RTE need to do before the I&A for the quantitative and qualitative measurements?",
        "Who can assist the RTE with these preparations?",
        "What can the RTE do to ensure key ART stakeholders attend the I&A?",
      ],
      quad: true,
    },
    ...BOARD,
  },
  {
    title: "Problem-solving workshop: full board",
    kind: "Activity",
    prepare: 50,
    share: 10,
    steps:
      "Step 1: Agree on the problem and write it in box 1.\nStep 2: Build the fishbone with five whys per bone and vote on the causes. Box 3 ranks them by Pareto.\nStep 3: Restate the problem from the biggest root cause, brainstorm solutions, and vote.\nStep 4: The top-voted ideas become the improvement backlog items in box 6.",
    board: "rca",
    config: { rstep: "all", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Agree on the problem",
    kind: "Activity",
    prepare: 5,
    steps:
      "Step 1: Working in your groups, write a problem statement\nStep 2: Capture the statement in the Original problem statement section",
    board: "rca",
    config: { rstep: "agree", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Root cause analysis",
    kind: "Activity",
    prepare: 25,
    steps:
      "Step 1: Brainstorm potential causes of the problem and write down the ‘root-cause analysis’ on the template problem-solving board\nStep 2: For each cause identified, use the ‘Five Whys’ technique to get to a potential root cause",
    side: [{ title: "Example", image: "/courses/rte/rca-example.webp" }],
    board: "rca",
    config: { rstep: "rca", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Restate the new problem",
    kind: "Activity",
    prepare: 10,
    steps:
      "Step 1: Dot vote to identify the biggest root cause on your chart.\nStep 2: Use Pareto analysis to identify the biggest root cause. Write down the ‘biggest root cause’ on the problem-solving board.\nStep 3: Restate the problem to address the identified root cause and the economic impact of the problem under the 'restate problem' heading on the problem-solving board.",
    side: [
      {
        title: "Example",
        text: "We did not have the ability to measure or test the full electrical load on vehicles in real operating conditions.\n\nImpact:\nWe had to upgrade the deployed power distribution system beyond what was specified. Major cost and schedule overrun.",
      },
    ],
    board: "rca",
    config: { rstep: "restate", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Brainstorm solutions",
    kind: "Activity",
    prepare: 8,
    steps:
      "Step 1: Individually brainstorm and write ideas on sticky notes and put them up on the board\nStep 2: After all ideas are captured, discuss them as a team\nStep 3: Organize ideas into affinity groups\nStep 4: Dot vote to reveal the top contenders to add to ‘identify improvement backlog items’ on the problem-solving board",
    board: "rca",
    config: { rstep: "brainstorm", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Problem-solving workshop readout",
    kind: "Discussion",
    prepare: 10,
    steps:
      "Step 1: Select a person from your team to do a readout\nStep 2: Start the readout by stating the original problem and conclude with the proposed improvement backlog items",
    board: "rca",
    config: { rstep: "readout", shared: "problem-solving-workshop" },
    ...BOARD,
  },
  {
    title: "Business Agility Self Assessment",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: Individually, fill in the Business Agility assessment in your workbook\nStep 2: Share some opportunities for the improvement you identified",
    board: "ba",
    ...BOARD,
  },
  {
    title: "Development Value Stream Mapping – current state",
    kind: "Activity",
    prepare: 15,
    share: 5,
    steps:
      "Step 1: Working in your groups, map a current development process from one person’s real context\nStep 2: Identify the delays between the steps\nStep 3: Be prepared to share your results with the class",
    side: [
      {
        title: "Value Stream Mapping: Measure the steps",
        image: "/courses/rte/vsm-measure.webp",
      },
    ],
    board: "vsm",
    config: { vsm: "current" },
    ...BOARD,
  },
  {
    title: "Development Value Stream Mapping – future state",
    kind: "Activity",
    prepare: 15,
    share: 5,
    steps:
      "Step 1: Working in your groups, use the same work context as in the previous activity.\nStep 2: Map the desired future state of the development process. Use the principles, practices, and tools found in SAFe.\nStep 3: Be prepared to share how you identified bottlenecks and what you would do to remove them with the class.",
    side: [
      {
        title: "Value Stream Mapping: Think about the future state",
        image: "/courses/rte/vsm-future.webp",
      },
    ],
    board: "vsm",
    config: { vsm: "future" },
    ...BOARD,
  },
  {
    title: "Draft your ART’s AI boundaries",
    kind: "Discussion",
    prepare: 7,
    share: 3,
    steps:
      "Emerging AI capabilities can augment how ARTs plan, build, test, and learn, but must be managed carefully. ARTs must develop and socialize boundaries for these tools to ensure responsible usage.\nStep 1: In your group, discuss scenarios where AI could be used with human review, and where it should not be used\nStep 2: Be prepared to share with the class",
    board: "bound",
    ...BOARD,
  },
  {
    title: "Your next steps",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Throughout this course, you’ve learned about various ways to integrate AI into your daily work as an RTE. What do you want to implement when you return to your role?\nStep 1: Identify one improvement you want to make in how your ART delivers value\nStep 2: Decide which SAFe value(s), principle(s), or practice(s) will guide your approach\nStep 3: Determine the first step you will take in the next 30 days to start making this improvement\nStep 4: Be prepared to share with the class",
    board: "next",
    ...BOARD,
  },
];

const lesson7: ActivitySpec[] = [
  {
    title: "The ART can’t run without trust",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps:
      "Step 1: In your group, discuss which SAFe events and activities can help establish trust among the members of the ART and ART stakeholders.\nStep 2: Identify these activities on the Big Picture and note why they would help establish trust.\nStep 3: Choose one of the SAFe activities you identified. Discuss and capture how the RTE can act to further increase the amount of trust built in that activity.\nStep 4: Be prepared to share your ideas with the class.",
    board: "trust",
    ...BOARD,
  },
  {
    title: "Sustaining the victory",
    kind: "Discussion",
    steps: "Sustaining the victory",
    board: "disc",
    config: {
      intro: "Discuss how the RTE keeps the momentum going once a win has landed.",
      qs: [
        "How are you connecting team victories to the vision?",
        "How are you creating connections between yourself and the teams?",
        "Discuss an upcoming PI event and how the RTE could sustain the victory.",
      ],
      quad: true,
    },
    ...BOARD,
  },
];

// Lessons 4–7 are named after what their exercises cover until the course's own lesson titles are in.
export const RTE_COURSE: { title: string; activities: ActivitySpec[] }[] = [
  { title: "Exploring the RTE Role and Responsibilities", activities: lesson1 },
  { title: "Organizing the ART", activities: lesson2 },
  { title: "Facilitating PI Planning", activities: lesson3 },
  { title: "Facilitating ART Events, Flow and DevOps", activities: lesson4 },
  { title: "Measuring and Improving Flow", activities: lesson5 },
  { title: "Improving the ART", activities: lesson6 },
  { title: "Sustaining the ART", activities: lesson7 },
];
