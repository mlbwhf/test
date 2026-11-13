// Builds what the screens load: apps/web/public/i18n/<lang>.json, a plain { "<English>": "<translation>" }
// with only the translated class texts. Run after editing a catalogue:  node i18n/build.cjs fr-CA
const fs = require("fs"), path = require("path");
const lang = process.argv[2] || "fr-CA";
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, `${lang}.json`), "utf8"));
const out = {};
for (const [en, e] of Object.entries(cat)) {
  if (!e.fr || e.fr === en || e.status === "stale" || /not UI text/i.test(e.note ?? "")) continue;
  out[en] = e.fr;
}
const dir = path.join(__dirname, "..", "apps", "web", "public", "i18n");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${lang}.json`), JSON.stringify(out));
console.log(`${lang}: ${Object.keys(out).length} texts -> apps/web/public/i18n/${lang}.json`);
