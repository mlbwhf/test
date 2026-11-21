// Development only: the API with a small pretend Azure DevOps behind it (organization "acme",
// project "Shop"), so the board link can be tried in a browser without a real organization.
//   PORT=4300 npx tsx src/dev-fake-ado.ts

import { MemoryPersistence } from "@trainyard/db";
import { buildApp } from "./app.js";
import { Store, type StoreState } from "./store.js";

type W = { id: number; rev: number; fields: Record<string, unknown> };
const items = new Map<number, W>();
const add = (id: number, type: string, fields: Record<string, unknown>) => items.set(id, { id, rev: 1, fields: { "System.Id": id, "System.WorkItemType": type, "System.State": "New", "System.Tags": "", ...fields } });
add(101, "Feature", { "System.Title": "Shopping cart", "System.State": "Active", "Microsoft.VSTS.Scheduling.Effort": 8, "Microsoft.VSTS.Common.BusinessValue": 13, "Microsoft.VSTS.Common.TimeCriticality": 8 });
add(102, "Feature", { "System.Title": "Checkout latency budget", "Microsoft.VSTS.Common.ValueArea": "Architectural", "Microsoft.VSTS.Scheduling.Effort": 5 });
add(103, "Feature", { "System.Title": "Shipping method selection", "Microsoft.VSTS.Scheduling.Effort": 5, "Microsoft.VSTS.Common.BusinessValue": 8 });
add(104, "Feature", { "System.Title": "Semantic product search", "System.State": "Resolved", "Microsoft.VSTS.Scheduling.Effort": 13, "Microsoft.VSTS.Common.BusinessValue": 13 });
add(105, "Feature", { "System.Title": "Retire legacy payout job", "System.State": "Closed", "Microsoft.VSTS.Common.ValueArea": "Architectural" });
add(301, "User Story", { "System.Title": "Reach my shopping cart from any page", "System.IterationPath": "Shop\\PI 1\\Iteration 1", "Microsoft.VSTS.Scheduling.StoryPoints": 3 });
add(302, "User Story", { "System.Title": "Research AJAX for the shopping experience", "System.IterationPath": "Shop\\PI 1\\Iteration 2", "Microsoft.VSTS.Scheduling.StoryPoints": 5, "System.Tags": "Spike" });
add(303, "User Story", { "System.Title": "Get a shipping quote from my cart", "System.State": "Active", "System.IterationPath": "Shop\\PI 1\\Iteration 2", "Microsoft.VSTS.Scheduling.StoryPoints": 8 });

const res = (status: number, body?: unknown) => ({ ok: status < 300, status, headers: { get: () => null }, text: async () => (body === undefined ? "" : JSON.stringify(body)) });
const fetchFn = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
  const body = init.body ? JSON.parse(init.body) : undefined;
  if (!url.startsWith("https://dev.azure.com/acme/")) return res(404, { message: "No such organization (the pretend one is acme / Shop)" });
  if (url.includes("/_apis/projects/")) return res(200, { id: "p1", name: "Shop" });
  if (url.includes("/workitemtypes?")) return res(200, { value: [{ name: "Epic" }, { name: "Feature" }, { name: "User Story" }, { name: "Bug" }] });
  if (url.includes("/states?")) return res(200, { value: [{ name: "New", category: "Proposed" }, { name: "Active", category: "InProgress" }, { name: "Resolved", category: "Resolved" }, { name: "Closed", category: "Completed" }, { name: "Removed", category: "Removed" }] });
  if (url.includes("/classificationnodes/")) return res(200, { name: "Shop", children: [{ name: "PI 1", children: ["Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "IP"].map((name) => ({ name })) }] });
  if (url.includes("/wiql?")) {
    const type = /\[System\.WorkItemType\] = '([^']+)'/.exec((body as { query: string }).query)?.[1];
    return res(200, { workItems: [...items.values()].filter((w) => w.fields["System.WorkItemType"] === type).map((w) => ({ id: w.id })) });
  }
  if (url.includes("/workitemsbatch?")) return res(200, { value: (body as { ids: number[] }).ids.map((id) => items.get(id)) });
  const ops = body as { op: string; path: string; value?: unknown }[];
  const apply = (w: W) => {
    for (const o of ops) o.op === "remove" ? delete w.fields[o.path.replace("/fields/", "")] : (w.fields[o.path.replace("/fields/", "")] = o.value);
    w.rev++;
    console.log(`[pretend ADO] #${w.id} ${JSON.stringify(Object.fromEntries(ops.map((o) => [o.path.replace("/fields/", ""), o.value ?? null])))}`);
    return w;
  };
  const made = /\/workitems\/%24([^?]+)\?/.exec(url);
  if (init.method === "POST" && made) {
    const id = 400 + items.size;
    add(id, decodeURIComponent(made[1]!), {});
    return res(200, apply(items.get(id)!));
  }
  const m = /\/workitems\/(\d+)\?/.exec(url);
  if (init.method === "PATCH" && m && items.has(Number(m[1]))) return res(200, apply(items.get(Number(m[1]))!));
  return res(404, { message: "unknown" });
};

const store = new Store({ persistence: new MemoryPersistence<StoreState>() });
await store.open();
const app = await buildApp({ store, importFetch: fetchFn as never, corsOrigin: true });
await app.listen({ port: Number(process.env.PORT ?? 4300), host: "0.0.0.0" });
console.log("[pretend ADO] API up; connect with organization acme, project Shop and any token of 20+ characters");
