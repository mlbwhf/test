// The four challenges of the Advanced SPC Learning Lab (lesson 7), from the Learning Lab Challenge
// Packet: the problem, the input data, the task and the question prompts of each.
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

export type LabInput =
  | { kind: "text"; text: string }
  | { kind: "list"; title: string; items: string[] }
  | { kind: "table"; title: string; cols: string[]; rows: string[][] }
  /** The CARS transformation canvas, shown from the class's own example. */
  | { kind: "canvas"; title: string };

export interface LabChallenge {
  id: string;
  title: string;
  problem: string[];
  inputs: LabInput[];
  task: string;
  /** The question prompts, by phase: assess, remedy, solve. */
  prompts: [phase: "Assess the challenge" | "Remedy the problem" | "Solve the challenge", question: string][];
}

export const ASPC_LAB: LabChallenge[] = [
  {
    id: "road",
    title: "Charting the Road Ahead",
    problem: [
      "CARS leadership understands that the company must transform to become the market leader in the autonomous green vehicle sector. The company’s Transformation Canvas sets clear goals: improve time to market, increase quality, enhance engagement, and develop reliable systems for growth. SAFe is a significant part of this transformation; adoption and results differ across portfolios.",
      "The U.S. Automotive division, led by a new executive, is just beginning to adopt SAFe. Focused on structure and consistency, he’s determined to follow the SAFe Framework 'by the book.’ Data Operations runs lean flow teams using ticket-based systems—efficient locally but poorly aligned with other portfolios. The Research and Innovation organization operates like an academic institute, with specialists deeply focused on their fields and attached to their recognized titles. They support the sustainability mission but resist adopting SAFe roles that don’t reflect their expertise.",
      "As the SAFe rollout progresses, organizational resistance to SAFe roles, terms, and practices has increased. For instance, Data Operations wants to preserve its model, while the Research organization hopes SAFe will bend to fit its culture and structures. In response to these concerns, the LACE recently facilitated a Customizing SAFe to Your Context Workshop. Some customizations have passed the customization guardrails, but more discussion is needed.",
      "The customization discussion also brought to the fore growing enthusiasm among executives to use AI to streamline workflows across the company. Some executives are resisting SAFe events because they believe PI planning and I&A can be replaced by AI work management. They are pushing to launch an enterprise-wide AI 'adaptive planning' tool. While intended to boost efficiency, the idea has sparked a debate about how effective a big bang AI rollout would be and how it might impact collaboration and decision-making across portfolios.",
      "The CARS executives recognize that progress has slowed because they lack a clear, shared plan of action. They have asked the LACE to update the Transformation Backlog and prepare to facilitate an executive road mapping session in two weeks. The goal of the session is to build a roadmap that will speed transformation and support the company’s business vision.",
    ],
    inputs: [
      { kind: "canvas", title: "CARS SAFe Transformation Canvas" },
      { kind: "text", text: "Here is the draft Customization Blueprint, which summarizes a spirited discussion among the CARS executives on potential customizations of SAFe: some are agreed upon; others require further discussion." },
      {
        kind: "table",
        title: "CARS SAFe Customization Blueprint (Draft)",
        cols: ["Need", "Customized Aspect", "Proposed Change", "Validation (guardrails)", "Benefit"],
        rows: [
          ["Researchers are resisting a change of role name", "People: Role", "For the Research and Innovation organization only, retain the role “Primary Investigator” instead of “Product Manager”", "No", ""],
          ["We need to get better at tracking progress against PI Objectives throughout the PI", "Work Artifact: PI Objectives", "Replace PI Objectives with OKRs (Objectives and Key Results)", "If all ARTs adopt OKRs, this passes guardrails.", "Improve tracking through the use of OKRs. Clearer alignment with strategic priorities. Build on existing OKR competency in the organization."],
          ["Build on the strong foundation of LEAN and Kanban in the Data Operations organization.", "Events: PI Planning", "Instead of PI Planning, maintain the long-standing Data Operations Room that is regularly attended by organizations that depend on Data Operations work.", "", ""],
          ["Employ AI to accelerate transformation", "Events: PI Planning and I&A", "Eliminate these events and replace them with an enterprise AI “adaptive planning” tool.", "", ""],
        ],
      },
      { kind: "text", text: "You also have the LACE Transformation Backlog below. It includes items from the Transformation Canvas but has not yet been updated after the recent Customizing SAFe workshop." },
      {
        kind: "table",
        title: "LACE Transformation Backlog",
        cols: ["Priority", "Backlog Item", "Benefit Hypothesis"],
        rows: [
          ["1", "POPM Training – All divisions contributing to green autonomous vehicles", "All PMs and POs are aligned on practices and ready to support the green autonomous vehicle."],
          ["2", "CDP Enhancements", "Sponsored by engineering."],
          ["3", "Lean-Agile Leadership Onboarding", "Shared understanding of SAFe among leaders will improve sponsorship and adoption"],
          ["4", "AI-Driven ALM", "Cross-organization rollout of adaptive work management will increase predictability and throughput."],
          ["5", "Enterprise Flow Metrics", "Consistent metrics will make resolving bottlenecks easier"],
          ["6", "Research Integration Pilot", "Synchronize one Research & Innovation team with the enterprise PI cadence to test benefit"],
          ["7", "Remove Developer Friction", "Identify and resolve key systemic bottlenecks (environments, permissions, handoffs)"],
        ],
      },
    ],
    task: "Your task is to create an updated Transformation Backlog based on the inputs provided. This backlog will be used to build the roadmap in the upcoming executive session. Using the provided context and data, apply what you’ve learned in the ASPC class to solve this challenge. Use the full time to discuss, brainstorm, and practice in the role of ASPCs at CARS.",
    prompts: [
      ["Assess the challenge", "There are friction points and misalignments in Customization Blueprint and backlog that pose risk to both business and transformation outcomes. List the top three risks you see."],
      ["Assess the challenge", "Do you think the current plan will succeed? Why or why not?"],
      ["Remedy the problem", "Based on the risks you identified, what needs to be removed from the backlog at this time, and why?"],
      ["Remedy the problem", "What might you add to the backlog at this time, and why?"],
      ["Solve the challenge", "Agree as a LACE team what outcomes you want from the next executive meeting."],
      ["Solve the challenge", "What backlog items do you recommend committing for the next PI?"],
    ],
  },
  {
    id: "comms",
    title: "Communicating the Transformation Strategy",
    problem: [
      "After CARS announced its acquisition of EcoDrive and an ambitious goal to launch a green autonomous vehicle within nine months, excitement surged across the company. Every division wants to be part of this defining moment for CARS, but misalignment at the top has begun to surface.",
      "Members of the executive team hold very different views on both the company’s goal and the path to achieve it. Each leader seems to be following their own playbook, and the lack of unity has become evident. Tensions peaked when a vice president from Regulatory and Compliance raised legitimate concerns about potential regulatory hurdles and was dismissed by a peer as “unimaginative” and “uncommitted to the vision.” Since then, leaders are keeping their heads down.",
      "Employees describe feeling confused and uncertain about priorities. “It’s like everyone is pulling in a different direction,” remarked one frustrated engineer. Collaboration has broken down, with teams duplicating efforts and blaming each other for delays. The most recent employee survey paints a troubling picture: communication is chaotic, priorities are unclear, and people feel disengaged and burned out.",
      "Clearly, the CARS executive team is not communicating the CEO's vision. As LACE leaders, you know the importance of communicating the transformation strategy. You are preparing for one-on-one coaching sessions with various executives this week.",
    ],
    inputs: [
      { kind: "text", text: "Recently, executives have been speaking about the company’s goal to launch a green autonomous vehicle within nine months. The questions raised during these town halls reveal what people across the organization are really thinking. You can read them below." },
      { kind: "list", title: "Questions from an Ask Me Anything session with the New Green self-driving vehicle executive", items: ["\"So, are we restructuring the entire company now?\"", "\"How will this impact my current role/team?\"", "\"What about the existing product lines? Are we abandoning those?\"", "\"Isn't this a bit too risky? What if it doesn't work?\"", "\"I heard there are new regulatory requirements. How will we meet them?\"", "\"Is this really the best way to achieve the CEO's vision?\"", "\"What training and development will support this rapid change?\"", "\"How will this affect our relationship with our existing suppliers and partners?\"", "\"What happens if we don't meet the nine-month deadline?\""] },
      { kind: "list", title: "Questions from the recent VP of Data Operations Quarterly Town Hall", items: ["\"What about our current data? Have we fixed the quality issues?\"", "\"I know security is important, but if we focus on it too much, will we miss the auto show deadline?\"", "\"We need data to succeed, but I don’t hear other executives talking about it. Do they know how important data is?\"", "\"What training will employees get on all this change? I’ve never been on an Agile team.\"", "\"Is a big reorganization coming?\"", "\"How can we ensure that security doesn't become a bottleneck for product development? We need a balance between security and agility.\""] },
      { kind: "list", title: "Questions from the recent Research Division – Automotive Awards Research Excellence Celebration", items: ["\"I love being part of this independent research division! We are the secret to CARS success.\"", "\"How can we foster even greater collaboration with universities and other research institutions?\"", "\"With the company’s big product goals, will we still have the freedom to pursue truly groundbreaking research, or will our focus shift to product development?\"", "\"I've heard rumors that some of our best researchers are being moved to the new green vehicle division. Will this impact the staffing levels in our research labs?\"", "“Will we have the budget and resources necessary to attract and retain top talent for this new research division?”"] },
      { kind: "text", text: "The concerns raised in the town halls are not unfounded. As shown in last week’s report, progress is off track. CARS must regroup and get back on course." },
      {
        kind: "table",
        title: "Green Autonomous Vehicle Milestone Status Report",
        cols: ["Milestone", "Timeline", "Status", "Notes"],
        rows: [["Technology Validation", "Month 2", "Delayed", "Problems with chassis and motor integration"], ["Regulatory Compliance Assessment", "Month 3", "Underway", "More data and analysis requested"], ["Prototype Development", "Month 4", "Complete", "Scale model"], ["User Experience Design", "Month 4", "", ""], ["On-Road Test", "Month 6", "Not Started", ""], ["Performance Validation", "Month 7", "Not Started", ""], ["Auto Show", "Month 9", "Not Started", ""]],
      },
    ],
    task: "Your task is to align the CARS executive team to communicate a unified vision of the CEO's vision, goals, and how the workforce can contribute to achieving it. With the context and data above, use what you’ve learned in the ASPC class to solve this challenge. Use the full timebox to discuss, ideate and practice in the role of ASPCs at CARS.",
    prompts: [
      ["Assess the challenge", "What positive and negative cultural behaviors can you identify in the leaders? Describe your assessment using Westrum’s model."],
      ["Assess the challenge", "How effectively do the town hall meetings—and the leaders who lead them—communicate the workforce’s role in the transformation?"],
      ["Remedy the problem", "What recommendations do you have for these leaders regarding the following? Their audience; the emotions associated with the change; the messages they convey; the actions they expect."],
      ["Solve the challenge", "Create shared talking points for the executives you will coach that paint a picture of the future, address resistance to change, and offer thoughtful responses—even when all the answers aren’t yet known. Include the following: clear vision; 2-3 points on the action plan; what’s next."],
      ["Solve the challenge", "Using what you know about engaging executives, prepare your own talking points for your 1:1 coaching session. Include the “what,” “why,” and “how” for communicating the transformation strategy clearly and consistently."],
    ],
  },
  {
    id: "portfolio",
    title: "Navigating the Portfolio Realignment Debate",
    problem: [
      "The President of the New Green Self-Driving Vehicles business unit is pushing for a major portfolio realignment at CARS, arguing that the current structure, based on functional organizations, slows down innovation and obscures accountability. He proposes the creation of a new portfolio for green self-driving vehicles, saying full dedication from all team members is essential. His proposal has stirred debate across the executive team, reigniting questions about whether the company’s existing portfolios still serve its growing ambitions for speed, sustainability, and agility.",
      "The controversy comes amid a high-profile product setback. Green Compass, CARS’ personalized navigation app and a key feature of its upcoming autonomous, eco-friendly vehicle, recently suffered a string of public outages. What began as a small customer request for an enhancement led to code failures that disrupted service for two weeks. While the functional impact was minor, media coverage was not, raising doubts about CARS’s readiness for launch and shaking customer and partner confidence.",
      "Investigation into the incident revealed that Green Compass’s failures stemmed from tangled cross-portfolio dependencies and misaligned strategic themes. Each portfolio has been pursuing its own strategic direction—data integrity, regional growth, marketing innovation—rather than aligning to shared company-wide goals focused on sustainability and speed-to-market. As a result, the app’s dependencies on both the Data Foundations Portfolio and the U.S. Automotive Portfolio suffered from competing priorities and poor coordination.",
      "Historically, each senior vice president has owned one or two portfolios aligned to their organizational silos. This structure has long made coordination difficult, but the Green Compass crisis exposed its cost in full view. Now, the executive leadership team has asked you, the LACE leaders, to assess how the current portfolio configuration and system behaviors are affecting CARS’s ability to launch the new green autonomous vehicle within nine months. They want you to offer recommendations for the organization to improve alignment, trust, and delivery speed across portfolios.",
    ],
    inputs: [
      { kind: "text", text: "CARS has many distinct portfolios, each with its own focus and leadership. The table below provides an overview of a subset of these portfolios, their interdependencies, and some of the challenges." },
      {
        kind: "table",
        title: "A subset of the CARS portfolios",
        cols: ["Portfolio", "Portfolio Type", "Key Dependencies", "Observed Challenges"],
        rows: [
          ["TTC Data Foundations Portfolio", "Platform", "U.S. Automotive, Global Marketing (data pipeline and analytics)", "Data inconsistencies between systems. Poor validation of shared datasets before release."],
          ["US Automotive Portfolio", "Business unit", "Data Foundations, Emerging Sustainable Vehicle Technology, Global Privacy (hardware integration, compliance)", "Poorly coordinated testing across hardware-software boundaries. Unclear ownership of validation requirements."],
          ["Emerging Sustainable Vehicle Technology Portfolio", "Innovation", "U.S. Automotive, Consumer Finance (prototypes, financial APIs)", "Prototype changes not synchronized with software validation. Data handoffs prone to defects."],
          ["Global Marketing Platform Portfolio", "Platform", "Data Foundations (campaign analytics, customer data)", "Inaccurate data feeds create reporting errors."],
          ["Consumer Financing Solutions Portfolio", "Business unit", "Global Marketing, Data Foundations (consumer data, analytics)", "Inconsistent definitions. Regulatory audit findings."],
          ["LATAM Portfolio", "Regional operating", "Global Marketing, Data Privacy (localization, compliance)", "Regional release timing conflicts."],
          ["Global Data Privacy Standard RD2-74 Portfolio", "Regulatory and risk", "All portfolios (compliance, governance)", "Slow approval cycles. Unclear compliance criteria."],
        ],
      },
      { kind: "text", text: "Executives are divided on whether portfolio realignment is the right move for CARS. The perspectives below reflect the range of opinions and tensions shaping this debate, and they will influence how any discussion or recommendation is received." },
      {
        kind: "table",
        title: "Executive perspectives",
        cols: ["Role", "Perspective"],
        rows: [
          ["Chief Executive Officer", "“The green vehicle initiative is ambitious but must balance innovation with stability. We can’t jeopardize our core business while pursuing transformation.”"],
          ["Chief Technology Officer", "“We have the talent and technology to lead in autonomous mobility. Let’s innovate boldly and move faster.”"],
          ["Chief Financial Officer", "“Investment must be justified by clear ROI. We can’t overextend financially on uncertain ventures.”"],
          ["President, New Green Self-Driving Vehicles", "“We must break down silos and accelerate. The current structure slows everything down. Let’s reorganize and move.”"],
          ["Vice President of Data Operations", "“Data security and compliance are non-negotiable. Innovation cannot come at the cost of privacy or trust.”"],
        ],
      },
    ],
    task: "Your task is to assess the current portfolio structure, identify obstacles to portfolio flow, and prepare to lead an effective executive discussion on portfolio design. Using the provided context and data, apply what you’ve learned in the ASPC class to solve this challenge. Use the full time to discuss, brainstorm, and practice in the role of ASPCs at CARS.",
    prompts: [
      ["Assess the challenge", "How is the current portfolio structure – and the behaviors it drives – helping or hindering CARS’ ability to deliver the new vehicle within nine months?"],
      ["Assess the challenge", "What patterns or gaps in leadership alignment and dependencies are compromising portfolio flow?"],
      ["Remedy the problem", "What actions, experiments, or educational efforts could help executives better understand the pros and cons of a portfolio realignment at this time?"],
      ["Remedy the problem", "What trade-offs, risks, and timing considerations should be evaluated to ensure the solution strengthens rather than disrupts the launch effort?"],
      ["Solve the challenge", "Create a concise summary of the top three portfolio flow issues you see. In your response highlight the following: what the challenges are; how they’re impacting the new green autonomous vehicle effort; what improvement opportunities exist. Frame it in a way that makes these issues clear and compelling to executives."],
      ["Solve the challenge", "Create a list of questions you could use in discussion with executives to build trust, clarify priorities, and prompt reflection over debate on current portfolio design."],
    ],
  },
  {
    id: "facts",
    title: "Using Facts as Our Guide",
    problem: [
      "The Green Compass initiative, a navigation and driver-assist system seen as the future of digital interaction in CARS vehicles, is at a crossroads. The pilot, now in limited testing, is struggling. Customer feedback is lukewarm, citing confusing features and inconsistent performance. In recent months, Green Compass has been plagued with recurring defects and a two-week outage, drawing negative media coverage and raising questions about whether CARS should continue building this product or pivot to something new.",
      "Executives across three key portfolios, U.S. Automotive, Global Marketing Platform, and Data Foundations, hold conflicting views. The President of U.S. Automotive insists the product just needs to be built out, while the Chief Marketing Officer argues for listening to the market before investing further. The Vice President of Data Operations is overwhelmed by the constant demand for real-time, accurate data and the mounting data-quality issues required to keep the system running.",
      "The company collects many metrics on these portfolios. The executives involved use data to defend their positions. They are seeking to assign blame, and hitting metric targets has become the goal rather than using evidence to guide better decisions.",
      "After attending your recent presentation on how balanced metrics can create alignment and flow, the Chief of Staff to the President of U.S. Automotive asks for a time to meet with you, asking for help: “Something isn’t right. We have so much data, but it doesn’t help us make better decisions. Everyone’s arguing from different positions. I know we need a clearer way to see what’s really happening, but I’m not sure where to start. Can you help me figure this out?”",
      "You and your LACE teammates are meeting now to prepare for that session, analyzing the available data, identifying the most important questions to answer, and proposing a more balanced set of metrics to guide an upcoming executive discussion about whether to pivot, persevere, or pause the Green Compass investment.",
    ],
    inputs: [
      { kind: "text", text: "You previously coached the Epic Owner who developed the Green Compass Lean Business Case. You know it was well researched and had broad executive support when first approved. To start, review the business case. It provides valuable context for how this initiative was originally justified and what outcomes were expected." },
      {
        kind: "table",
        title: "Lean Business Case for Green Compass",
        cols: ["Section", "Content"],
        rows: [
          ["Funnel Entry Date", "6 months ago"],
          ["Epic Owner", "President of New Self Driving Vehicles"],
          ["Key Stakeholders", "VP of Research, VP Data Operations, Chief Marketing Officer"],
          ["Epic Description", "For owners of TTC green, self-driving vehicles who use these vehicles for daily transportation the Green Compass is a comprehensive car and phone-based app that integrates real-time charging station information, optimizing green routes and curated recommendations for restaurants and amenities unlike other map applications our solution will offer eco-minded, personalized navigation features in one convenient app."],
          ["Business Outcome Hypothesis", "Subscription sign-ups – 20% of existing vehicle owners. Affiliate revenue - $2m in year 1. Customer satisfaction - In-App feedback of 4 stars or above."],
          ["Leading Indicators", "Weekly Green Compass downloads. Weekly active users. Charging station and green route engagement rate (count of requests). User retention rate (day, week, month)."],
          ["In Scope", "Green route optimization. Integrated route and charging plan. Curated recommendations."],
          ["Out of Scope", "Rewards program. Support for other vehicle brands. Offline maps."],
          ["Nonfunctional Requirements", "Performance – 95% response time of under 2.5 seconds. Security – zero vulnerabilities. Data source reliability – 95% accuracy rate."],
          ["Minimum Viable Product (MVP) Features", "Essential mapping & navigation. Real-time charging station information. Search functionality. In-app payment for charging."],
          ["Additional Potential Features", "Trip planning multiple waypoints. Integration with vehicle telematics. Reviews and ratings for charging, routes and amenities."],
          ["Analysis Summary", "In progress"],
          ["Go / No-Go", ""],
        ],
      },
      { kind: "text", text: "CARS routinely collects a wide range of performance data across related portfolios. The following metrics summarize current results." },
      {
        kind: "table",
        title: "Portfolio Metrics Snapshot (Last Three PIs)",
        cols: ["Metric", "Green Compass (Innovation)", "Data Foundations (Platform)", "Global Marketing Platform (Platform)"],
        rows: [
          ["Feature Throughput (per PI)", "46 → 38 → 22", "12 → 20 → 26", "41 → 48 → 51"],
          ["Defect Rate (per 1000 user sessions)", "4.8 → 7.1 → 9.5", "1.2 → 1.6 → 1.4", "2.3 → 2.5 → 3.7"],
          ["User Adoption (%)", "22% → 24% → 25%", "N/A", "78% → 79% → 80%"],
          ["Customer NPS", "+31 → +28 → +22", "+40 → +41 → +42", "+30 → +35 → +33"],
          ["Average Flow Time (days)", "34 → 42 → 55", "18 → 22 → 29", "24 → 20 → 21"],
          ["Team Happiness", "8.1 → 7.9 → 7.2", "8.3 → 8.4 → 8.5", "7.8 → 8.0 → 8.0"],
          ["Marketing Spend ($M)", "—", "—", "6.0 → 12.0 → 21.0"],
          ["Velocity", "520 → 610 → 700", "320 → 325 → 300", "650 → 700 → 710"],
          ["Security Audit Findings", "—", "7 → 10 → 13", "—"],
          ["Cycle Time (Dev → Release)", "14d → 21d → 33d", "7d → 9d → 11d", "10d → 11d → 10d"],
        ],
      },
    ],
    task: "Your task is to help this Chief of Staff prepare for the upcoming executive discussion about Green Compass. Using the context and data above, apply what you’ve learned in the ASPC class to solve this challenge. Use the full time to discuss, brainstorm, and practice in the role of ASPCs at CARS.",
    prompts: [
      ["Assess the challenge", "What questions must be answered to determine whether a pivot, pause, or continued investment in Green Compass is warranted?"],
      ["Assess the challenge", "Based on the available data, assess: Do we have a balanced set of metrics that help leaders understand flow, outcomes, and value, or are we focused on isolated activities and outputs?"],
      ["Remedy the problem", "Create a balanced portfolio-level metrics set that could help answer those questions. Be sure to include complementary metrics."],
      ["Remedy the problem", "Reflect on the executive behaviors you’ve observed. What shifts in mindset or interaction would enable these leaders to use facts collaboratively?"],
      ["Solve the challenge", "Design a draft agenda for the upcoming executive conversation that helps leaders use data collaboratively rather than competitively."],
      ["Solve the challenge", "How can you design the executive discussion to foster curiosity, shared accountability, and learning, instead of defensiveness or blame?"],
    ],
  },
];
