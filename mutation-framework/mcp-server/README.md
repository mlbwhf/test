# Mutation Readiness MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes the **Mutation Readiness Scorecard** as agentic tools, so Claude,
GPT, and other MCP-capable agents can run the assessment, score responses,
and generate reports programmatically.

**Status:** v0.1.0 scaffold (brief milestone: day 45 / framework v1.1).
Spec embedded from `assessments/mutation-readiness-scorecard.yaml` v1.0-draft.

## Tools

| Tool | Purpose |
|---|---|
| `run_assessment(unit_of_analysis, mode)` | Returns the 18 questions, scale, and facilitation instructions. Modes: `full` (18 questions) and `rapid` (6 questions, /30). |
| `score_responses(answers, unit_of_analysis?)` | Scores 18 Likert answers (keyed `Q1.1`…`Q6.3`, `null` = N/A) → total 0–72, band, per-dimension profile. |
| `generate_report(score_data)` | Renders score data as a markdown report with dimension bars, band actions, and reading list. |
| `get_band_recommendations(band)` | Band reading, recommended actions, and reading list for `mutation-blind` / `mutation-aware` / `mutation-ready`. |

## Run locally

```bash
cd mcp-server
npm install
npm run build
npm start          # stdio transport
```

### Use with Claude Code

```bash
claude mcp add mutation-readiness -- node /path/to/mcp-server/dist/index.js
```

### Use with Claude Desktop

```json
{
  "mcpServers": {
    "mutation-readiness": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## Deployment

The server uses the stdio transport and runs anywhere Node ≥18 runs. For a
hosted endpoint (Vercel, Cloudflare Workers), swap `StdioServerTransport`
for the SDK's streamable HTTP transport — the tool definitions are
transport-agnostic.

## Keeping the spec in sync

`src/spec.ts` mirrors the canonical YAML at
`../assessments/mutation-readiness-scorecard.yaml`. If the questions, bands,
or actions change there, regenerate `spec.ts` to match. The YAML is the
source of truth.
