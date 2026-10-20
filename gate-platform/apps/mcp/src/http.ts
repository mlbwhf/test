import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { GateClient } from "./client.js";
import { buildServer } from "./server.js";

/**
 * Hosted MCP over Streamable HTTP, stateless: every request gets a fresh server bound to the
 * caller's API key, so nothing about one organization lingers for the next.
 */
export async function handleMcpHttp(req: IncomingMessage, res: ServerResponse, body: unknown, client: GateClient): Promise<void> {
  const server = buildServer(client);
  // sessionIdGenerator undefined = stateless mode (the SDK's types predate exactOptionalPropertyTypes).
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true } as unknown as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]);
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport as unknown as Parameters<typeof server.connect>[0]);
  await transport.handleRequest(req, res, body);
}
