// Bundles src/index.ts into dist/gate-widget.js (IIFE, minified, es2020, no sourcemap).
// Plain JS on purpose: the widget tsconfig has "types": [] and never sees this file.
import { build } from "esbuild";
import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = resolve(root, "dist/gate-widget.js");
const LIMIT = 40 * 1024;

await build({
  entryPoints: [resolve(root, "src/index.ts")],
  outfile,
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2020",
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
});

const size = statSync(outfile).size;
console.log(`dist/gate-widget.js: ${size} bytes (${(size / 1024).toFixed(1)} KB)`);
if (size > LIMIT) {
  console.error(`Bundle exceeds the ${LIMIT / 1024} KB limit`);
  process.exit(1);
}
