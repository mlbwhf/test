// Bundles src/main.js (with @forge/bridge) into static/main.js. Set TRAINYARD_URL for a
// self-hosted server; it must match the frames address in manifest.yml.
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const url = (process.env.TRAINYARD_URL ?? "https://agileagilist.com").replace(/\/+$/, "");
if (!/^https:\/\//.test(url)) throw new Error(`TRAINYARD_URL must be https: ${url}`);
const manifest = readFileSync(new URL("./manifest.yml", import.meta.url), "utf8");
if (!manifest.includes(`address: ${url}`)) {
  console.warn(`manifest.yml does not list ${url} under permissions.external.frames; Jira will block the frame.`);
}
await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  outfile: "static/main.js",
  define: { TRAINYARD_URL: JSON.stringify(url) },
});
console.log(`Built static/main.js for ${url}`);
