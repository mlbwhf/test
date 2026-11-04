// The AI-Native Value Architect class. Lesson 3 holds the Mini Lab: Risk Reduction, run in
// Flowise with Groq: a multi-agent flow that evaluates the risk of the HR Navigator chatbot from
// the earlier activity. The prompts are the course's own, word for word; the lab board hands them
// to the class with a copy button and keeps each agent's assessment and the group's risk register.
// Lessons 1 and 2 are placeholders until their outline arrives.

import type { ActivitySpec } from "../activities.js";

const BOARD = { width: 1200, height: 600 };
const SLIDE = (ref: string) => [{ title: "Slide", text: ref, instructorOnly: true }];

/** The texts the lab copies to the clipboard, by key, as given in the course. */
export const VALUE_ARCHITECT_LAB: Record<string, { title: string; text: string }> = {
  proposal: { title: "Initial Prompt", text: "Project Proposal: \"HR Navigator\" AI Chatbot\n\nSubmitted To: AI Risk Council\n\nProject Vision: To create an internal HR chatbot, \"HR Navigator,\" that provides instant, 24/7 support to all employees, reducing the burden on HR staff and improving employee experience.\n\nSolution Design Decisions:\n\nBased on the initial architectural review, the following design path has been chosen:\n\nFoundation Model: We will use a Large Language Model (LLM). The primary goal is to handle a wide range of employee queries, from simple factual questions to more nuanced, sensitive topics like burnout and career pathing. The higher accuracy and reasoning capabilities are critical for building employee trust.\n\nKnowledge Base: We will implement Retrieval-Augmented Generation (RAG). The chatbot must provide answers based on our official, up-to-date internal documentation, including the employee handbook, benefits guides, and hundreds of scattered policy PDFs on the company intranet. This ensures answers are grounded in company truth.\n\nModel Specialization: We will not use Fine-Tuning at this stage. The combination of a powerful LLM and a comprehensive RAG knowledge base should be sufficient for the initial rollout. We believe fine-tuning adds significant cost and maintenance complexity that is not justified for Phase 1.\n\nAutomation Capabilities: We will add Agentic Capabilities for a key, high-volume workflow. The \"HR Navigator\" will be authorized to access the HRIS system to process multi-step vacation requests. An employee can simply say, \"Book me a vacation from Monday to Friday next week,\" and the agent will check their balance, submit the request, and route it to their manager for a one-click approval, all within the chat interface." },
  tech: { title: "Skeptical Technologist (Technical Risk)", text: "You are a skeptical Principal Systems Architect. Your sole function is to identify potential technical failures in any proposed AI system. You are obsessed with stability, scalability, and security. When you analyze a proposal, you MUST ignore all business metrics, ROI, and ethical arguments. Focus exclusively on what could go wrong with the technology itself.\n\nProbe for weaknesses in these areas:\n\n- Data Integrity: Is the input data clean? Could a data pipeline failure poison the model?\n\n- Performance: Will this system have high latency? Will it crash under load?\n\n- Security: What are the vulnerabilities? How could it be attacked?\n\n- Model Behavior: How will you handle hallucinations? What is the plan for model drift?\n\n- Maintainability: Is this architecture overly complex? What is the long-term cost of technical debt?\n\nYour final output should be a brutally honest assessment of the technical risks." },
  pnl: { title: "Skeptical P&L Owner (Business Risk)", text: "You are a skeptical P&L (Profit and Loss) Owner. Your sole function is to identify potential business failures in any proposed AI system. You believe most new projects are a waste of money and resources. When you analyze a proposal, you MUST ignore the specific technical implementation and any ethical concerns that do not have a direct, quantifiable financial impact. Focus exclusively on whether the solution will deliver real, measurable value.\n\nProbe for weaknesses in these areas:\n\n- Return on Investment (ROI): Are the financial projections realistic or just optimistic hand-waving?\n\n- Total Cost of Ownership (TCO): What are the hidden costs for maintenance, monitoring, and ongoing training?\n\n- User Adoption: Why would anyone actually use this? What is the plan if employees or customers ignore it?\n\n- Success Metrics: Are the KPIs clear and measurable, or are they vague vanity metrics?\n\n- Opportunity Cost: Is this the most valuable thing our team could be working on right now?\n\nYour final output should be a brutally honest assessment of the business risks." },
  ethics: { title: "Skeptical AI Ethicist (Ethical & Human Risk)", text: "You are a skeptical Chief Ethics and Compliance Officer. Your sole function is to identify potential ethical and human harm in any proposed AI system. You believe that even well-intentioned systems can have disastrous, unintended consequences. When you analyze a proposal, you MUST ignore all financial and technical arguments. Your sole duty is to protect humans and the company's reputation from harm.\n\nProbe for weaknesses in these areas:\n\n- Bias & Fairness: How could this system be biased against protected groups or certain demographics? Is the training data representative?\n\n- Transparency: Can we explain how the model makes its decisions? Is there a clear process for appeal?\n\n- Human Impact: Could this cause psychological stress, job displacement, or a culture of surveillance?\n\n- Reputational Risk: What is the headline if this goes wrong? How could this damage customer trust or our brand?\n\n- Misuse: How could a bad actor or a careless employee misuse this system to cause harm?\n\nYour final output should be a brutally honest assessment of the ethical and human risks." },
};

const lab: ActivitySpec[] = [
  {
    title: "Mini Lab: Risk Reduction",
    kind: "Activity",
    prepare: 5,
    steps: "Ensure that you have an active Flowise AI and Groq accounts. We will be creating a multi-agent flow together that will help evaluate risk for the HR Chatbot from the earlier activity.\nOpen Flowise AI (https://flowiseai.com/) and Groq (https://groq.com/) and sign in.",
    side: [...SLIDE("Lesson 3"), { title: "Flowise AI", text: "https://flowiseai.com/" }, { title: "Groq", text: "https://groq.com/" }],
    board: "lab",
    config: { step: "setup", shared: "risk-lab" },
    ...BOARD,
  },
  {
    title: "Initial Prompt",
    kind: "Activity",
    prepare: 5,
    steps: "Copy the project proposal and give it to your flow as the initial prompt: this is the system the three agents will assess.",
    side: SLIDE("Lesson 3"),
    board: "lab",
    config: { step: "prompt", key: "proposal", shared: "risk-lab" },
    ...BOARD,
  },
  {
    title: "Skeptical Technologist (Technical Risk)",
    kind: "Activity",
    prepare: 10,
    steps: "Create the first agent with this system prompt and a Groq model. Run it on the proposal and paste its assessment below.",
    side: SLIDE("Lesson 3"),
    board: "lab",
    config: { step: "agent", key: "tech", shared: "risk-lab" },
    ...BOARD,
  },
  {
    title: "Skeptical P&L Owner (Business Risk)",
    kind: "Activity",
    prepare: 10,
    steps: "Create the second agent with this system prompt. Run it on the proposal and paste its assessment below.",
    side: SLIDE("Lesson 3"),
    board: "lab",
    config: { step: "agent", key: "pnl", shared: "risk-lab" },
    ...BOARD,
  },
  {
    title: "Skeptical AI Ethicist (Ethical & Human Risk)",
    kind: "Activity",
    prepare: 10,
    steps: "Create the third agent with this system prompt. Run it on the proposal and paste its assessment below.",
    side: SLIDE("Lesson 3"),
    board: "lab",
    config: { step: "agent", key: "ethics", shared: "risk-lab" },
    ...BOARD,
  },
  {
    title: "Risk register",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "From the three assessments, list the risks worth acting on: one line each, with the lens it came from, how severe it is and what would reduce it.\nShare the register with the class.",
    side: SLIDE("Lesson 3"),
    board: "lab",
    config: { step: "register", shared: "risk-lab" },
    ...BOARD,
  },
];

const placeholder = (n: number): ActivitySpec[] => [
  { title: `Lesson ${n} activities`, kind: "Discussion", share: 5, steps: "This lesson's exercises are added when its outline arrives.", board: "disc", config: { intro: "Outline to come.", qs: [] }, ...BOARD },
];

export const AI_NATIVE_VALUE_ARCHITECT_COURSE: { title: string; activities: ActivitySpec[] }[] = [
  { title: "Outline to come", activities: placeholder(1) },
  { title: "Outline to come", activities: placeholder(2) },
  { title: "Mini Lab: Risk Reduction", activities: lab },
];
