import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GateApiError, GateClient } from "./client.js";
import { tools } from "./tools.js";

export function buildServer(client: GateClient): McpServer {
  const server = new McpServer({ name: "gate-platform", version: "0.1.0" });
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.input },
      async (args: Record<string, unknown>) => {
        try {
          const result = await tool.run(client, args as never);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          const e = err as GateApiError;
          const body = err instanceof GateApiError
            ? { error: { code: e.code, message: e.message, ...(e.hint ? { hint: e.hint } : {}), status: e.status } }
            : { error: { code: "MCP_TOOL_ERROR", message: (err as Error).message } };
          return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(body) }] };
        }
      },
    );
  }
  return server;
}
