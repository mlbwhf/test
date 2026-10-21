// Bundles the embeddable scripts (IIFE, minified, es2020, no sourcemap):
//   dist/gate-widget.js   registration widget            src/index.ts
//   dist/gate-schedule.js website schedule (list/calendar) src/schedule-entry.ts
// Plain JS on purpose: the widget tsconfig has "types": [] and never sees this file.
import { build } from "esbuild";
import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLES = [
  { entry: "src/index.ts", out: "dist/gate-widget.js", limit: 40 * 1024 },
  // Carries the registration widget for its inline checkout.
  { entry: "src/schedule-entry.ts", out: "dist/gate-schedule.js", limit: 64 * 1024 },
];

let failed = false;
for (const b of BUNDLES) {
  const outfile = resolve(root, b.out);
  await build({
    entryPoints: [resolve(root, b.entry)],
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
  console.log(`${b.out}: ${size} bytes (${(size / 1024).toFixed(1)} KB)`);
  if (size > b.limit) {
    console.error(`${b.out} exceeds the ${b.limit / 1024} KB limit`);
    failed = true;
  }
}
if (failed) process.exit(1);
