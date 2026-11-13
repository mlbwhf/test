// Extracts user-visible English text from the Trainyard sources: JSX text, text attributes
// (placeholder, title, aria-label, alt, label) and string literals that read like UI text.
// Usage: node i18n/extract.cjs . i18n/labels.json   (from the trainyard folder)
const ts = require(require.resolve("typescript", { paths: [process.argv[2] + "/apps/web"] }));
const fs = require("fs"), path = require("path");
const root = process.argv[2];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === "node_modules" || e.name.startsWith(".") ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = [
  ...walk(path.join(root, "apps/web/app")),
  ...walk(path.join(root, "apps/web/components")),
  ...walk(path.join(root, "apps/web/lib")),
  ...walk(path.join(root, "packages/core/src")),
].filter((f) => /\.(tsx?|mts)$/.test(f) && !/\.test\.|\.d\.ts$/.test(f));
const ATTRS = new Set(["placeholder", "title", "aria-label", "alt", "label"]);
// Not UI text: CSS values, colours, paths, ids, keys, code.
const notText = (s) =>
  !/[A-Za-z]{2}/.test(s) || /^[#.]?[\w-]+$/.test(s) && !/^[A-Z][a-z]+$/.test(s) && !/^[A-Z]{2,}$/.test(s) ||
  /^(https?:|mailto:|\/|\.\/|@\/|data:|#[0-9a-f]{3,8}\b|rgba?\(|var\(--|calc\(|repeat\(|linear-gradient|conic-gradient|translate|rotate|cubic-bezier)/i.test(s) ||
  /^\d+(\.\d+)?(px|%|em|rem|vh|vw|deg|s|ms)?( |$)/.test(s) && /\d(px|%|em|rem|deg)/.test(s) ||
  /^(flex|grid|block|none|inline|absolute|relative|fixed|sticky|solid|dashed|center|left|right|top|bottom|auto|hidden|pointer|grab|copy|nowrap|uppercase|bold|normal|italic|transparent|inherit|ltr|rtl|start|end|middle|stretch|baseline|space-between|column|row|wrap|both|forwards)( |$)/.test(s) ||
  /[{};]|=>|\$\{/.test(s) && !/[a-z]{3,} [a-z]{3,}/.test(s) ||
  /^[a-z]+([A-Z][a-z]*)+$/.test(s) || /^[a-z0-9]+(-[a-z0-9]+)+$/.test(s) || /^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(s) ||
  /^(GET|POST|PUT|PATCH|DELETE|HEAD)$/.test(s) || /^[a-z]+:[a-z]/.test(s) || /^\w+\/[\w+.-]+$/.test(s) ||
  /'(Instrument Sans|Familjen Grotesk|Helvetica|JetBrains|Caveat|Syne)/.test(s) || /ui-monospace|sans-serif|monospace/.test(s);
const looksUi = (s) => /\s/.test(s.trim()) || /^[A-Z][a-z]/.test(s) || /^[A-Z]{2,}( |$)/.test(s);
const out = new Map();
const add = (text, file, kind, line) => {
  // A text written over several lines (an exercise's steps) is shown line by line: one entry per line.
  if (kind === "string" && /\n/.test(text.trim())) return text.split(/\n+/).forEach((l) => add(l, file, kind, line));
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 2 || notText(t) || (kind === "string" && !looksUi(t))) return;
  const rel = path.relative(root, file);
  const e = out.get(t) ?? { en: t, kinds: new Set(), files: new Set(), lines: [] };
  e.kinds.add(kind); e.files.add(rel); if (e.lines.length < 3) e.lines.push(`${rel}:${line}`);
  out.set(t, e);
};
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const visit = (n, ctx) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isJsxText(n)) add(n.text, file, "jsx", lineOf(n));
    else if (ts.isJsxAttribute(n)) {
      const name = n.name.getText(sf);
      if (n.initializer && ts.isStringLiteral(n.initializer)) { if (ATTRS.has(name)) add(n.initializer.text, file, "attr:" + name, lineOf(n)); return; }
      if (name === "style" || name === "className" || name === "key" || name === "href" || name === "src" || name === "id" || name === "viewBox" || name === "d" || /^on[A-Z]/.test(name) && false) return;
    } else if (ts.isPropertyAssignment(n) && ["style", "className"].includes(n.name.getText(sf))) return;
    else if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !ts.isJsxAttribute(n.parent) && !ts.isImportDeclaration(n.parent) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isLiteralTypeNode(n.parent) && !(ts.isElementAccessExpression(n.parent)) && !(ts.isCallExpression(n.parent) && /^(require|import|querySelector|getElementById|addEventListener|removeEventListener|setItem|getItem|removeItem|get|has|startsWith|endsWith|includes|split|join|replace|test|api|useApi|fetch|header|matchMedia|createElement|setAttribute|getAttribute|closest|download|toLocaleString|toLocaleDateString|padStart)$/.test((n.parent.expression.name ?? n.parent.expression).getText?.(sf) ?? ""))) add(n.text, file, "string", lineOf(n));
    else if (ts.isTemplateExpression(n)) {
      // A template with holes: keep it as one message with {0}, {1} placeholders when it reads like text.
      let t = n.head.text, i = 0; for (const sp of n.templateSpans) t += `{${i++}}` + sp.literal.text;
      if (/[a-z]{3,} [a-z]{3,}/i.test(t)) add(t, file, "template", lineOf(n));
      n.templateSpans.forEach((sp) => visit(sp.expression));
      return;
    }
    ts.forEachChild(n, (c) => visit(c));
  };
  visit(sf);
}
const area = (f) => /courses\//.test(f) ? "course" : /studio-views|planning-views|outcome-roadmap/.test(f) ? "template" : /studio-model|planning-pages/.test(f) ? "template-logic" : /packages\/core/.test(f) ? "core" : /app\/\(app\)|components\/(class|board|students|site-nav|canvas|exercise)/.test(f) ? "app" : "app";
const rows = [...out.values()].map((e) => ({ en: e.en, area: [...new Set([...e.files].map(area))].sort().join("+"), kind: [...e.kinds].join(","), where: e.lines.join(" "), files: e.files.size }));
// Phases: 1 = what a class sees, 2 = the rest of the app, 3 = public website and legal, course = Scaled Agile wording.
const P1 = /components\/(studio-views|studio-model|planning-views|planning-pages|outcome-roadmap|class-|exercise-boards|classroom|activity-editor|canvas-editor|handout-scenarios|site-nav|lane-board|stack)|app\/\(app\)\/(boards\/\[id\]|classroom|planning-room)|app\/join|packages\/core\/src\/(classes|teams|activities|coachsync|inspectadapt|canvases|class-meta|export|capacity|portfolio)\.ts/;
const P3 = /app\/(privacy|terms|pricing|page\.tsx|compare|guides|book|examples|insights|methods|support|classes\/|not-found)|components\/(landing|public-page|module-page|pay-inline)|lib\/(public|pricing|help)\.ts/;
for (const r of rows) {
  const ws = r.where.split(" ");
  r.phase = ws.every((w) => /packages\/core\/src\/courses\//.test(w)) ? "course" : ws.some((w) => P1.test(w)) ? "1" : ws.some((w) => P3.test(w)) ? "3" : "2";
}
rows.sort((a, b) => a.area.localeCompare(b.area) || a.where.localeCompare(b.where));
fs.writeFileSync(process.argv[3], JSON.stringify(rows, null, 1));
const by = {}; for (const r of rows) by[r.area] = (by[r.area] ?? 0) + 1;
console.log(rows.length, "texts", JSON.stringify(by), "words", rows.reduce((n, r) => n + r.en.split(/\s+/).length, 0));
