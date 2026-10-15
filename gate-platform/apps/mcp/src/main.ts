#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GateClient } from "./client.js";
import { buildServer } from "./server.js";

const baseUrl = process.env.GATE_API_URL ?? "http://localhost:4000";
const apiKey = process.env.GATE_API_KEY;
if (!apiKey) {
  console.error("GATE_API_KEY is required");
  process.exit(1);
}
const server = buildServer(new GateClient({ baseUrl, apiKey }));
await server.connect(new StdioServerTransport());
