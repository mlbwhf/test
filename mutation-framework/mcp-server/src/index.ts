#!/usr/bin/env node
/**
 * Mutation Readiness MCP server.
 *
 * Exposes the Mutation Readiness Scorecard (v1.0-draft) as four agentic
 * tools over stdio:
 *   run_assessment(unit_of_analysis, mode)  -> questions + instructions
 *   score_responses(answers)                -> scores, band, profile
 *   generate_report(score_data)             -> formatted markdown report
 *   get_band_recommendations(band)          -> actions + reading for a band
 *
 * Scoring per Appendix A of the Operating Manual: each question 1-5 (N/A
 * allowed); dimension score = floor(sum * 12 / (5 * answered_count)),
 * headline 0-12; total = sum of six dimensions, out of 72.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ALL_QUESTION_IDS,
  BANDS,
  DIMENSION_MAX,
  DIMENSIONS,
  MAX_SCORE,
  SCALE,
  VERSION,
  bandForScore,
} from "./spec.js";

interface DimensionScore {
  id: string;
  name: string;
  points: number;
  maxPoints: number;
  naCount: number;
}

interface ScoreData {
  version: string;
  unitOfAnalysis?: string;
  totalScore: number;
  maxScore: number;
  percentage?: number;
  band: string;
  bandReading: string;
  recommendedActions: string[];
  readingList: string[];
  dimensions: DimensionScore[];
}

function scoreResponses(
  answers: Record<string, number | null>,
  unitOfAnalysis?: string
): ScoreData {
  const missing = ALL_QUESTION_IDS.filter((id) => !(id in answers));
  if (missing.length > 0) {
    throw new Error(`Missing answers for: ${missing.join(", ")}`);
  }
  for (const [id, v] of Object.entries(answers)) {
    if (v !== null && (!Number.isInteger(v) || v < SCALE.min || v > SCALE.max)) {
      throw new Error(
        `Answer for ${id} must be an integer ${SCALE.min}-${SCALE.max} or null for N/A, got ${v}`
      );
    }
  }

  let anyNa = false;
  const dimensions: DimensionScore[] = DIMENSIONS.map((d) => {
    const vals = d.questions.map((q) => answers[q.id]);
    const answered = vals.filter((v): v is number => v !== null);
    if (answered.length === 0) {
      throw new Error(`All questions N/A in dimension ${d.id}`);
    }
    if (answered.length < vals.length) anyNa = true;
    const sum = answered.reduce((s, v) => s + v, 0);
    return {
      id: d.id,
      name: d.name,
      points: Math.floor((sum * DIMENSION_MAX) / (SCALE.max * answered.length)),
      maxPoints: DIMENSION_MAX,
      naCount: vals.length - answered.length,
    };
  });
  const totalScore = dimensions.reduce((s, d) => s + d.points, 0);
  const band = bandForScore(totalScore);

  const data: ScoreData = {
    version: VERSION,
    unitOfAnalysis,
    totalScore,
    maxScore: MAX_SCORE,
    band: band.name,
    bandReading: band.reading,
    recommendedActions: band.recommendedActions,
    readingList: band.readingList,
    dimensions,
  };
  if (anyNa) {
    data.percentage = Math.round((totalScore * 1000) / MAX_SCORE) / 10;
  }
  return data;
}

function renderReport(data: ScoreData): string {
  const weakest = [...data.dimensions].sort((a, b) => a.points - b.points)[0];
  const lines: string[] = [
    `# Mutation Readiness Report${data.unitOfAnalysis ? ` — ${data.unitOfAnalysis}` : ""}`,
    "",
    `**Total: ${data.totalScore}/${data.maxScore} — ${data.band}**` +
      (data.percentage !== undefined ? ` (${data.percentage}% with N/A items normalized)` : "") +
      ` (scorecard ${data.version})`,
    "",
    data.bandReading,
    "",
    "## Dimension profile",
    "",
    "| Dimension | Score | |",
    "|---|---|---|",
  ];
  for (const d of data.dimensions) {
    const bar = "█".repeat(d.points) + "░".repeat(d.maxPoints - d.points);
    const na = d.naCount > 0 ? ` (${d.naCount} N/A)` : "";
    lines.push(`| ${d.name} | ${d.points}/${d.maxPoints}${na} | ${bar} |`);
  }
  lines.push(
    "",
    `**Weakest dimension: ${weakest.name}.** The lowest dimension, not the total, sets the work program.`,
    "",
    "## Recommended actions for this band",
    ""
  );
  data.recommendedActions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  if (data.readingList.length > 0) {
    lines.push("", "## Recommended reading", "");
    data.readingList.forEach((r) => lines.push(`- ${r}`));
  }
  lines.push(
    "",
    "---",
    "*Generated with the Mutation Readiness framework from* Mutation Readiness: An Operating Manual for Innovation in the Age of AI *(companion to the novel* The Innovation Playground*).*"
  );
  return lines.join("\n");
}

const answersShape = Object.fromEntries(
  ALL_QUESTION_IDS.map((id) => [
    id,
    z
      .union([z.number().int().min(SCALE.min).max(SCALE.max), z.null()])
      .describe(`Likert response for ${id} (${SCALE.min}-${SCALE.max}, or null for N/A)`),
  ])
) as Record<string, z.ZodType<number | null>>;

const server = new McpServer({
  name: "mutation-readiness",
  version: "0.1.0",
});

server.tool(
  "run_assessment",
  "Start a Mutation Readiness assessment: returns the 18 questions, the 1-5 scale, and facilitation instructions for the given unit of analysis and mode. Ask the user the questions conversationally, then call score_responses.",
  {
    unit_of_analysis: z
      .string()
      .describe("What is being assessed: the user themselves, a team, or the whole organization"),
    mode: z
      .enum(["full", "rapid"])
      .default("full")
      .describe(
        "full: all 18 questions (~15 min, default). rapid: 6 questions, one per dimension (Q1.2, Q2.2, Q3.2, Q4.3, Q5.3, Q6.1), scored /30 with bands 0-12 / 13-22 / 23-30."
      ),
  },
  async ({ unit_of_analysis, mode }) => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            assessment: "mutation-readiness-scorecard",
            version: VERSION,
            unitOfAnalysis: unit_of_analysis,
            mode,
            scale: {
              ...SCALE,
              labels: {
                1: "Strongly disagree",
                2: "Disagree",
                3: "Neutral",
                4: "Agree",
                5: "Strongly agree",
              },
              naAllowed: true,
            },
            instructions: [
              `All answers must describe "${unit_of_analysis}" as it is today, not as planned. A "yes" that applies only to a small sub-team is a 3, not a 5.`,
              "Ask conversationally, one dimension at a time — do not paste a Likert scale at the respondent.",
              "If the respondent gives a story rather than a score, infer the 1-5 score, state it, and ask for confirmation before logging.",
              "If the respondent doesn't know or it's not applicable, mark the question null (N/A) and move on.",
              "If an answer is self-flattering and contradicts something said earlier, gently note the tension.",
              "When all answers are collected, call score_responses.",
            ],
            dimensions: DIMENSIONS,
          },
          null,
          2
        ),
      },
    ],
  })
);

server.tool(
  "score_responses",
  "Score a complete set of 18 Likert answers (1-5 or null for N/A, keyed by question id Q1.1..Q6.3). Dimension scores are 0-12 (floor(sum*12/(5*answered))); total 0-72. Returns band, profile, actions, and reading list. Pass the result to generate_report.",
  {
    answers: z.object(answersShape).describe("All 18 answers keyed by question id (null = N/A)"),
    unit_of_analysis: z.string().optional(),
  },
  async ({ answers, unit_of_analysis }) => {
    try {
      const data = scoreResponses(
        answers as Record<string, number | null>,
        unit_of_analysis
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: String(e) }],
      };
    }
  }
);

server.tool(
  "generate_report",
  "Render score data (output of score_responses) as a formatted markdown report with dimension bars, weakest-dimension callout, band actions, and reading list.",
  {
    score_data: z
      .object({
        version: z.string(),
        unitOfAnalysis: z.string().optional(),
        totalScore: z.number().int().min(0).max(MAX_SCORE),
        maxScore: z.number(),
        percentage: z.number().optional(),
        band: z.string(),
        bandReading: z.string(),
        recommendedActions: z.array(z.string()),
        readingList: z.array(z.string()),
        dimensions: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            points: z.number(),
            maxPoints: z.number(),
            naCount: z.number(),
          })
        ),
      })
      .describe("Exact JSON returned by score_responses"),
  },
  async ({ score_data }) => ({
    content: [{ type: "text" as const, text: renderReport(score_data as ScoreData) }],
  })
);

server.tool(
  "get_band_recommendations",
  "Get the band reading, recommended actions, and reading list for a readiness band.",
  {
    band: z
      .enum(["mutation-blind", "mutation-aware", "mutation-ready"])
      .describe("Band id"),
  },
  async ({ band }) => {
    const b = BANDS.find((x) => x.id === band)!;
    return {
      content: [{ type: "text" as const, text: JSON.stringify(b, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`mutation-readiness MCP server ${VERSION} listening on stdio`);
