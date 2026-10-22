// Bundles src/hub.js (with the Azure DevOps extension SDK) into dist/. Set TRAINYARD_URL for a
// self-hosted server.
import { copyFileSync, mkdirSync } from "node:fs";
import { build } from "esbuild";

const url = (process.env.TRAINYARD_URL ?? "https://agileagilist.com").replace(/\/+$/, "");
if (!/^https:\/\//.test(url)) throw new Error(`TRAINYARD_URL must be https: ${url}`);
mkdirSync("dist", { recursive: true });
await build({
  entryPoints: ["src/hub.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  outfile: "dist/hub.js",
  define: { TRAINYARD_URL: JSON.stringify(url) },
});
copyFileSync("src/hub.html", "dist/hub.html");
console.log(`Built dist/ for ${url}`);
