import { AdoConnector, JiraConnector, type AdoConfig, type JiraConfig } from "@trainyard/connectors";
import { buildApp } from "./app.js";
import { Store } from "./store.js";

// Tracker connections come from the environment. Mappings are JSON without secrets;
// tokens are separate variables so they never end up in a config file.
//   TRAINYARD_JIRA='{"baseUrl":"https://x.atlassian.net","email":"bot@x.com","jql":"project = CHK","mapping":{...},"fields":{...}}'
//   JIRA_API_TOKEN=...
//   TRAINYARD_ADO='{"organization":"x","project":"Customer","where":"[System.AreaPath] UNDER \'Customer\'","mapping":{...}}'
//   ADO_PAT=...
async function main() {
  const port = Number(process.env.PORT ?? 4100);
  const store = new Store(undefined, process.env.TRAINYARD_DEMO_CLOCK === "0" ? () => new Date() : undefined);

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

  const app = await buildApp({
    store,
    ...(process.env.TRAINYARD_API_KEY ? { apiKey: process.env.TRAINYARD_API_KEY } : {}),
    corsOrigin: process.env.TRAINYARD_WEB_URL ?? true,
    logger: true,
  });
  await app.listen({ port, host: process.env.HOST ?? "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
