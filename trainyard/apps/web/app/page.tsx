import type { Metadata } from "next";
import Link from "next/link";
import { REPO_URL, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trainyard: scaled agile planning, PI planning boards and AI portfolio management",
  alternates: { canonical: "/" },
};

const MODELS = ["SAFe Essential", "SAFe Portfolio", "Full SAFe", "AI-Native SAFe", "LeSS", "Scrum@Scale", "Nexus", "Flight Levels", "Tribes & squads"];
const SOURCES = ["iObeya", "Miro", "Mural", "monday.com", "Trello", "CSV", "JSON"];

const FEATURES = [
  {
    title: "PI planning that already knows your teams",
    body: "Nineteen built-in boards sized to your Agile Release Train: PI planning, team breakouts, ROAM, program board, story map, value stream and ART identification, portfolio and ART Kanban, roadmaps, Inspect & Adapt. Drag, write, connect, and every card is one API call.",
  },
  {
    title: "Jira and Azure DevOps, two ways",
    body: "Features, stories, risks and dependencies come from the tracker and go back to it. Move a card on the program board and the iteration changes in Jira or Azure DevOps on the next sync, with a queue you can inspect first.",
  },
  {
    title: "Every scaling model as data, not a plugin",
    body: "Pick an operating model, fork it, rename levels and ceremonies. Work levels, cadences, roles and metrics are configuration, so the same boards serve SAFe, LeSS, Scrum@Scale, Nexus or Flight Levels.",
  },
  {
    title: "An AI-native portfolio",
    body: "A module for AI initiatives and platforms: lifecycle stages with gates, evidence and evaluations, EU AI Act risk tiers, an agent registry with autonomy levels zero to four, and sign-off by a value architect, aligned with AI-Native SAFe.",
  },
  {
    title: "Reporting you build, not a fixed set",
    body: "A metric catalogue of flow, planning, portfolio and AI metrics. Compose dashboards by team, increment and work level, and ask the assistant to write the narrative for the readout.",
  },
  {
    title: "SAFe's own artifacts, measured",
    body: "Value stream identification as the workshop and value stream mapping as the measurement, with wait time, active time and %C&A calculated from Jira, Azure DevOps or any Kanban export. Portfolio canvas, SWOT and TOWS into a future state and vision, LACE mission, epic hypothesis, Lean business case, ART launch readiness, feature and enabler canvases.",
  },
  {
    title: "Inside Jira and Azure DevOps too",
    body: "Run it standalone, or install the Jira app and the Azure DevOps extension so the boards, value streams and canvases open as a project page or hub inside the tracker people already use.",
  },
  {
    title: "Bring your own boards",
    body: "Upload iObeya board exports, connect Miro, Mural, monday.com or Trello, or upload CSV and JSON. Boards arrive as they are, at their positions and colours, become templates, and map onto the plan only when you say so.",
  },
];

// Capabilities only, from a side-by-side evaluation of dashboard tools for PI planning. Vendors
// change their products; the note under the table says so.
const COMPARISON: { tool: string; hosting: string; pi: string; art: string; beyond: string; integration: string; ours?: boolean }[] = [
  {
    tool: "Trainyard",
    hosting: "Self-hosted, open source; also as a Jira app and an Azure DevOps extension",
    pi: "Integrated: PI planning, team breakouts, PI objectives, confidence vote",
    art: "ART and team boards, program board, ROAM, WSJF, retrospectives",
    beyond: "Portfolio Kanban, roadmaps, SAFe canvases, value stream identification and mapping, AI portfolio, dashboards",
    integration: "Jira and Azure DevOps, two ways; imports boards from iObeya, Miro, Mural, monday.com",
    ours: true,
  },
  { tool: "iObeya", hosting: "On premises or separate server", pi: "Integrated web interface", art: "ART board, ROAM, WSJF, retrospectives", beyond: "Portfolio and more", integration: "Full integration through API and iFrame" },
  { tool: "Easy Agile", hosting: "Jira plugin", pi: "Within Jira", art: "ART and team boards", beyond: "None", integration: "Jira only" },
  { tool: "Agile Hive", hosting: "Jira plugin", pi: "Within Jira", art: "ART board, ROAM, WSJF, team execution", beyond: "Portfolio Kanban, roadmap, reporting", integration: "Jira only" },
  { tool: "BigPicture", hosting: "Jira plugin", pi: "Within Jira", art: "ART board, ROAM, WSJF, team execution", beyond: "Project planning and reporting, OKR and risk widgets", integration: "Jira only" },
  { tool: "PIPlanning.io", hosting: "On premises or separate server", pi: "Dedicated tool", art: "ART and ROAM boards", beyond: "None", integration: "Jira" },
  { tool: "Miro", hosting: "Public cloud", pi: "Not integrated; templates", art: "Limited ART board", beyond: "None", integration: "None for planning data" },
];

const FAQ = [
  {
    q: "Can it run inside Jira or Azure DevOps?",
    a: "Yes. A Jira app (Atlassian Forge) and an Azure DevOps extension put the boards, value streams and canvases in a project page or hub, so people plan without leaving their tracker. The same server also runs standalone in the browser.",
  },
  {
    q: "How does it compare with other PI planning tools?",
    a: "See the comparison table above: hosting, how PI planning is supported, what exists at ART and portfolio level, and which trackers each tool integrates with. Trainyard is the only one in that set that is open source and integrates with both Jira and Azure DevOps.",
  },
  {
    q: "Which scaling frameworks are supported?",
    a: "SAFe (Essential, Portfolio and Full), AI-Native SAFe, LeSS, Scrum@Scale, Nexus, Flight Levels and tribe models ship as operating-model templates. Each can be forked and edited; the boards and metrics follow the model you choose.",
  },
  {
    q: "Can we keep our Miro or Mural templates?",
    a: "Yes. Connect the tool with a token, import the board as it is, save it as a template and create new boards from it. CSV and a documented JSON format cover any other application.",
  },
  {
    q: "Does the AI assistant need a cloud model?",
    a: "No. It works with Claude through an Anthropic API key, with any OpenAI-compatible server, or with a local Ollama model. Every answer is validated against a schema and nothing is written to the plan until a person accepts it.",
  },
  {
    q: "How is it licensed and hosted?",
    a: "Apache-2.0, one edition with every module. Self-host with Docker Compose behind your own reverse proxy, or run it next to an existing site on the same server.",
  },
];

export default function LandingPage() {
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Trainyard",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Docker",
      url: base,
      description: "Open-source scaled agile planning: PI planning boards, program board, ROAM and dashboards synced with Jira and Azure DevOps, with an AI-native portfolio module.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://www.apache.org/licenses/LICENSE-2.0",
      featureList: FEATURES.map((f) => f.title),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="site-nav">
        <Link href="/" className="brand" aria-label="Trainyard home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 20 L12 4 L21 20" stroke="#f0b43a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M7 13h10M5.3 16.5h13.4" stroke="#8a95a1" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Trainyard
        </Link>
        <nav className="row" aria-label="Site">
          <a href="#features" className="site-link">
            Features
          </a>
          <a href="#models" className="site-link">
            Models
          </a>
          <a href="#compare" className="site-link">
            Compare
          </a>
          <a href="#faq" className="site-link">
            FAQ
          </a>
          <a href={REPO_URL} className="site-link" rel="noopener">
            Source
          </a>
          <Link href="/dashboards" className="btn primary small">
            Open the app
          </Link>
        </nav>
      </header>

      <section className="site-hero">
        <span className="eyebrow">Open source · Apache-2.0 · self-hosted</span>
        <h1>The planning room for scaled agile, with the trackers you already run.</h1>
        <p className="site-lede">
          PI planning boards, program board, ROAM and dashboards that stay in step with Jira and Azure DevOps. Every scaling model as configuration. An AI-native portfolio for the initiatives that need gates. Bring the boards you
          already have from Miro, Mural, monday.com or Trello.
        </p>
        <div className="row" style={{ gap: 10 }}>
          <Link href="/templates" className="btn primary">
            Start from a template
          </Link>
          <Link href="/dashboards" className="btn">
            See the dashboards
          </Link>
          <a href={REPO_URL} className="btn ghost" rel="noopener">
            Read the code
          </a>
        </div>
        <div className="site-board" aria-hidden="true">
          <div className="site-board-head">
            <span>PI 26.4 · Program board</span>
            <span className="chip">4 teams · 6 iterations</span>
          </div>
          <div className="site-board-grid">
            {["Checkout", "Search & Discovery", "Payments", "AI Assist"].map((team, r) => (
              <div key={team} className="site-board-row">
                <span className="site-board-team">{team}</span>
                {Array.from({ length: 6 }, (_, c) => (
                  <span key={c} className={`site-board-cell ${(r * 7 + c * 3) % 4 === 0 ? "" : (r + c) % 3 === 0 ? "blue" : (r + c) % 5 === 0 ? "red" : "yellow"}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="site-section">
        <span className="eyebrow">What is inside</span>
        <h2>One tool for the room, the tracker and the portfolio</h2>
        <div className="site-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="card site-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="models" className="site-section">
        <span className="eyebrow">Operating models</span>
        <h2>Pick a model, fork it, keep your words for things</h2>
        <p className="site-lede">Work levels, cadences, events, roles and metrics are data. Change the model and the boards, the sync mapping and the dashboards follow.</p>
        <div className="row" style={{ gap: 8 }}>
          {MODELS.map((m) => (
            <span key={m} className="chip site-chip">
              {m}
            </span>
          ))}
        </div>
        <p className="site-lede" style={{ marginTop: 20 }}>Boards come from where your teams already work:</p>
        <div className="row" style={{ gap: 8 }}>
          {SOURCES.map((m) => (
            <span key={m} className="chip site-chip">
              {m}
            </span>
          ))}
        </div>
      </section>

      <section id="ai" className="site-section">
        <span className="eyebrow">AI, two ways</span>
        <h2>Assistance for the facilitator, governance for the portfolio</h2>
        <div className="site-grid two">
          <article className="card site-card">
            <h3>In the room</h3>
            <p>Draft PI objectives from what is planned, suggest ROAM states, brief the readiness of an increment, write the dashboard narrative, and review any board for themes, risks and missing connections. Drafts only; a person accepts.</p>
          </article>
          <article className="card site-card">
            <h3>Over the AI portfolio</h3>
            <p>Stage gates with evidence and evaluations, EU AI Act risk tiers, an agent registry with autonomy levels, value-architect sign-off and an audit trail. Built for AI-Native SAFe and usable with any model you run.</p>
          </article>
        </div>
      </section>

      <section id="compare" className="site-section">
        <span className="eyebrow">Compared</span>
        <h2>How the PI planning tools differ</h2>
        <p className="site-lede">Where each tool runs, how it supports PI planning, what it offers at train and portfolio level, and which trackers it talks to.</p>
        <div className="scroll-x card" style={{ padding: 0 }}>
          <table className="table site-compare">
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Hosting</th>
                <th scope="col">PI planning</th>
                <th scope="col">ART level</th>
                <th scope="col">Portfolio and beyond</th>
                <th scope="col">Integration</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.tool} className={c.ours ? "ours" : undefined}>
                  <th scope="row">{c.tool}</th>
                  <td>{c.hosting}</td>
                  <td>{c.pi}</td>
                  <td>{c.art}</td>
                  <td>{c.beyond}</td>
                  <td>{c.integration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint" style={{ fontSize: "0.78rem" }}>
          From a side-by-side evaluation of the capabilities each product offered for PI planning dashboards. Products change; check each vendor for its current features. Product names are trademarks of their owners.
        </p>
      </section>

      <section id="faq" className="site-section">
        <span className="eyebrow">Questions</span>
        <h2>Frequently asked</h2>
        <div className="site-faq">
          {FAQ.map((f) => (
            <details key={f.q} className="card">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>Trainyard · Apache-2.0 · built by Agile Agilist</span>
        <span className="row" style={{ gap: 14 }}>
          <a href={REPO_URL} rel="noopener">
            Source
          </a>
          <a href="/llms.txt">llms.txt</a>
          <Link href="/login">Sign in</Link>
        </span>
        <p className="faint" style={{ fontSize: "0.75rem", flexBasis: "100%" }}>
          SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Jira is a trademark of Atlassian. Azure DevOps is a trademark of Microsoft. Trainyard is not affiliated with them.
        </p>
      </footer>
    </div>
  );
}
