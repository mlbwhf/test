// Reads the Azure DevOps context (organization, project) and opens the matching Trainyard
// page in a frame. TRAINYARD_URL is fixed at build time.
import * as SDK from "azure-devops-extension-sdk";

const BASE = TRAINYARD_URL.replace(/\/+$/, "");
const frame = document.getElementById("trainyard");
const status = document.getElementById("status");

async function open() {
  SDK.init({ loaded: false });
  await SDK.ready();
  const web = SDK.getWebContext();
  const host = SDK.getHost();
  const params = new URLSearchParams({ source: "ado" });
  if (web.project?.name) params.set("project", web.project.name);
  if (host?.name) params.set("org", host.name);
  const asked = new URLSearchParams(window.location.search).get("page");
  const page = asked && /^[a-z-]+$/.test(asked) ? asked : web.project ? "board" : "portfolio";
  frame.src = `${BASE}/embed/${page}?${params}`;
  frame.hidden = false;
  status.remove();
  SDK.notifyLoadSucceeded();
}

open().catch((e) => {
  status.textContent = `Trainyard could not open: ${e?.message ?? e}`;
  SDK.notifyLoadFailed(e);
});
