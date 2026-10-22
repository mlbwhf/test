import { ClaudeProvider, OpenAICompatibleProvider, type AssistProvider } from "@trainyard/ai-assist";
import { AdoConnector, JiraConnector, type AdoConfig, type JiraConfig } from "@trainyard/connectors";
import { FilePersistence, MemoryPersistence, PgPersistence, createPool, migrate, type StatePersistence } from "@trainyard/db";
import { buildApp } from "./app.js";
import { Store, type StoreState } from "./store.js";

// Configuration is environment variables. Secrets are separate variables so they never
// end up in a config file:
//   DATABASE_URL                 Postgres; else TRAINYARD_DATA_DIR for JSON files; else memory
//   TRAINYARD_ADMIN_KEY          bootstrap admin API key (turns auth on)
//   TRAINYARD_SECRET             encrypts Miro/Mural/monday/Trello tokens at rest (falls back to the admin key)
//   ANTHROPIC_API_KEY            AI facilitation through Claude (model: TRAINYARD_AI_MODEL)
//   TRAINYARD_LLM_URL            or any OpenAI-compatible server, e.g. http://ollama:11434/v1
//                                (TRAINYARD_LLM_MODEL, optional TRAINYARD_LLM_KEY); free and local
//   TRAINYARD_JIRA + JIRA_API_TOKEN, TRAINYARD_ADO + ADO_PAT   tracker connections (JSON + secret)
//   TRAINYARD_SYNC_EVERY_MINUTES scheduled sync; TRAINYARD_WEBHOOK_SECRET enables /v1/webhooks/:system
//   TRAINYARD_DEMO_CLOCK=0       use the real clock instead of the demo date
async function main() {
  const env = process.env.TRAINYARD_ENV ?? "development";
  const port = Number(process.env.PORT ?? 4100);

  let persistence: StatePersistence<StoreState>;
  if (process.env.DATABASE_URL) {
    const pool = createPool(process.env.DATABASE_URL);
    const ran = await migrate(pool);
    if (ran.length) console.log(`[db] applied migrations: ${ran.join(", ")}`);
    persistence = new PgPersistence<StoreState>(pool);
    console.log("[db] postgres");
  } else if (process.env.TRAINYARD_DATA_DIR) {
    persistence = new FilePersistence<StoreState>(process.env.TRAINYARD_DATA_DIR);
    console.log(`[db] json files in ${process.env.TRAINYARD_DATA_DIR}`);
  } else {
    if (env === "production") throw new Error("set DATABASE_URL or TRAINYARD_DATA_DIR in production");
    persistence = new MemoryPersistence<StoreState>();
    console.log("[db] in-memory (set DATABASE_URL or TRAINYARD_DATA_DIR to keep data)");
  }

  const store = new Store({ persistence, ...(process.env.TRAINYARD_DEMO_CLOCK === "0" ? { now: () => new Date() } : {}) });
  console.log(`[state] ${await store.open()} workspace ${store.workspaceId} (version ${store.version})`);

  if (process.env.TRAINYARD_JIRA && process.env.JIRA_API_TOKEN) {
    const cfg = JSON.parse(process.env.TRAINYARD_JIRA) as Omit<JiraConfig, "apiToken">;
    store.connectors.set("jira", new JiraConnector({ ...cfg, apiToken: process.env.JIRA_API_TOKEN }));
    console.log(`[jira] ${cfg.baseUrl}`);
  }
  if (process.env.TRAINYARD_ADO && process.env.ADO_PAT) {
    const cfg = JSON.parse(process.env.TRAINYARD_ADO) as Omit<AdoConfig, "pat">;
    store.connectors.set("ado", new AdoConnector({ ...cfg, pat: process.env.ADO_PAT }));
    console.log(`[ado] ${cfg.organization}/${cfg.project}`);
  }
  if (store.connectors.size === 0) console.log("[trackers] none connected: serving the demo workspace");

  const adminKey = process.env.TRAINYARD_ADMIN_KEY;
  if (!adminKey && store.state.users.length === 0) {
    if (env === "production") throw new Error("set TRAINYARD_ADMIN_KEY in production, or the API runs open");
    console.log("[auth] open mode: no users and no TRAINYARD_ADMIN_KEY, every request acts as admin");
  } else console.log(`[auth] on (${store.state.users.length} users${adminKey ? ", bootstrap admin key" : ""})`);

  let assist: AssistProvider | undefined;
  if (process.env.ANTHROPIC_API_KEY) {
    assist = new ClaudeProvider({ ...(process.env.TRAINYARD_AI_MODEL ? { model: process.env.TRAINYARD_AI_MODEL } : {}) });
  } else if (process.env.TRAINYARD_LLM_URL) {
    assist = new OpenAICompatibleProvider({
      baseUrl: process.env.TRAINYARD_LLM_URL,
      model: process.env.TRAINYARD_LLM_MODEL ?? "qwen2.5:7b",
      ...(process.env.TRAINYARD_LLM_KEY ? { apiKey: process.env.TRAINYARD_LLM_KEY } : {}),
      ...(process.env.TRAINYARD_LLM_JSON_SCHEMA === "0" ? { jsonSchema: false } : {}),
    });
  }
  console.log(assist ? `[assist] ${assist.name}` : "[assist] off (set ANTHROPIC_API_KEY, or TRAINYARD_LLM_URL for a local model)");

  const secret = process.env.TRAINYARD_SECRET ?? adminKey;
  if (!secret) console.log("[connections] no TRAINYARD_SECRET: board connections will not survive a restart");
  else if (!process.env.TRAINYARD_SECRET && env === "production") console.log("[connections] TRAINYARD_SECRET not set: tokens are sealed with the admin key; set a separate secret so rotating one does not break the other");

  const app = await buildApp({
    store,
    ...(adminKey ? { bootstrapAdminKey: adminKey } : {}),
    ...(secret ? { secret } : {}),
    ...(assist ? { assist } : {}),
    ...(process.env.TRAINYARD_WEBHOOK_SECRET ? { webhookSecret: process.env.TRAINYARD_WEBHOOK_SECRET } : {}),
    syncEveryMinutes: Number(process.env.TRAINYARD_SYNC_EVERY_MINUTES ?? 0),
    corsOrigin: process.env.TRAINYARD_WEB_URL ?? true,
    // Behind Traefik in production the client address is in X-Forwarded-For.
    trustProxy: env === "production" || process.env.TRAINYARD_TRUST_PROXY === "1",
    rateLimitPerMinute: Number(process.env.TRAINYARD_RATE_LIMIT ?? 600),
    logger: true,
  });
  const shutdown = async () => {
    await app.close();
    await persistence.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
  await app.listen({ port, host: process.env.HOST ?? "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
