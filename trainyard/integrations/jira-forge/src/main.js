// Reads the Jira context (site, project) and opens the matching Trainyard page in a frame.
// TRAINYARD_URL is fixed at build time and must also be listed under permissions.external.frames
// in manifest.yml.
import { view } from "@forge/bridge";

const BASE = TRAINYARD_URL.replace(/\/+$/, "");
const frame = document.getElementById("trainyard");
const status = document.getElementById("status");

async function open() {
  let ctx = {};
  try {
    ctx = await view.getContext();
  } catch {
    /* outside Jira (local preview): open without context */
  }
  const project = ctx.extension?.project?.key;
  const params = new URLSearchParams({ source: "jira" });
  if (project) params.set("project", project);
  if (ctx.siteUrl) params.set("site", ctx.siteUrl);
  // A project opens on its program board; the global page on the dashboards.
  const page = project ? "board" : "dashboards";
  frame.src = `${BASE}/embed/${page}?${params}`;
  frame.hidden = false;
  status.remove();
}

open().catch((e) => {
  status.textContent = `Trainyard could not open: ${e?.message ?? e}`;
});
