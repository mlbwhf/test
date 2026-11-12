// Keeps a language catalogue in step with the code. Reads i18n/labels.json (from extract.cjs) and
// i18n/<lang>.json, then: keeps every existing translation, adds new English texts as "new",
// and marks texts no longer in the code as "stale" (kept, so a wording change can reuse them).
// Usage: node i18n/sync.cjs fr-CA        (from the trainyard folder; with --check, exits 1 while a class text (phase 1) has no translation)
const fs = require("fs"), path = require("path");
const lang = process.argv[2] || "fr-CA", check = process.argv.includes("--check");
const dir = __dirname, labels = JSON.parse(fs.readFileSync(path.join(dir, "labels.json"), "utf8"));
const file = path.join(dir, `${lang}.json`);
const cat = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
const seen = new Set(), counts = { kept: 0, new: 0, stale: 0 };
for (const l of labels) {
  seen.add(l.en);
  const e = cat[l.en];
  if (e) { if (e.status === "stale") e.status = e.fr ? "draft" : "new"; e.phase = l.phase; e.where = l.where; counts.kept++; }
  else { cat[l.en] = { fr: "", status: l.phase === "course" ? "course" : "new", phase: l.phase, where: l.where }; counts.new++; }
}
for (const [en, e] of Object.entries(cat)) if (!seen.has(en) && e.status !== "stale") { e.status = "stale"; counts.stale++; }
const sorted = Object.fromEntries(Object.entries(cat).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(file, JSON.stringify(sorted, null, 1) + "\n");
const by = {}; for (const e of Object.values(sorted)) by[e.status] = (by[e.status] ?? 0) + 1;
console.log(`${lang}: kept ${counts.kept}, new ${counts.new}, newly stale ${counts.stale} ·`, JSON.stringify(by));
const missing = Object.entries(sorted).filter(([, e]) => e.phase === "1" && e.status === "new");
if (check && missing.length) {
  console.error(`${missing.length} class text(s) without ${lang}:`, missing.slice(0, 10).map(([en, e]) => `\n  ${JSON.stringify(en)} (${e.where.split(" ")[0]})`).join(""));
  process.exit(1);
}
