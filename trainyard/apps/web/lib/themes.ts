// Workspace themes: each space and each method gets its own look, so the interface speaks the
// method's language (a SAFe plan is a train, a Kanban board is a dark flow console, an OKR review
// is an executive brief). Tokens come from the Trainyard Workspace design handoff. themeCss()
// turns them into CSS custom properties: the --th-* set the lane boards read, plus a remap of the
// app's existing variables so every existing page follows the theme without being rewritten.

export type ThemeId = "safe" | "scrum" | "kanban" | "lean" | "okr" | "classes" | "six-sigma" | "manufacturing" | "general" | "innovation" | "mutation";

export interface Theme {
  name: string;
  bg: string;
  chrome: string;
  ctext: string;
  cline: string;
  cbg: string;
  ink: string;
  mute: string;
  panel: string;
  line: string;
  accent: string;
  accentInk: string;
  hf: string;
  bf: string;
  h1: string;
  laneR: string;
  laneBd: string;
  laneSh: string;
  laneBg: string;
  hl: string;
  cardR: string;
  cardBd: string;
  cardSh: string;
  dragSh: string;
  btnR: string;
  btnSh: string;
  tones: [string, string, string, string, string];
  cardInk: string;
  cardMute: string;
  cf: string;
  sf: string;
  lt: string;
  grid: string;
  bar: string;
  warn: string;
  warnFill: string;
  pen: string;
  /** SAFe: lanes are railcars, equal height, with the locomotive strip. */
  car?: boolean;
  equal?: boolean;
  train?: boolean;
  /** Taped notes (Classes, Lean); coloured header bands (Lean); lanes cycle through the tones (Classes). */
  tape?: boolean;
  band?: boolean;
  cycle?: boolean;
}

const safe: Theme = { name: "Train", bg: "#efe8d8", chrome: "#0d1815", ctext: "#f3ead3", cline: "#f3ead377", cbg: "transparent", ink: "#0d1815", mute: "#4d5a52", panel: "#fffaf0", line: "#0d1815", accent: "#ffb627", accentInk: "#0d1815", hf: "'Syne',sans-serif", bf: "'Familjen Grotesk',sans-serif", h1: "800 clamp(24px,2.6vw,34px)/1.05 'Syne',sans-serif", laneR: "16px 16px 6px 6px", laneBd: "2px solid #0d1815", laneSh: "0 6px 0 #0d1815", laneBg: "#fffaf0", hl: "#fff3d0", cardR: "8px", cardBd: "2px solid #0d1815", cardSh: "3px 3px 0 #0d1815", dragSh: "8px 10px 0 #0d1815", btnR: "10px", btnSh: "3px 3px 0 #0d1815", tones: ["#fffaf0", "#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae"], cardInk: "#0d1815", cardMute: "#35433b", cf: "800 15px 'Syne',sans-serif", sf: "700 17px 'Familjen Grotesk',sans-serif", lt: "800 17px 'Syne',sans-serif", grid: "radial-gradient(#0d181833 1.3px,transparent 1.5px)", bar: "#e29a00", warn: "#b4235f", warnFill: "#ff3d8f", pen: "#0d1815", car: true, equal: true, train: true };
const scrum: Theme = { name: "Sprint", bg: "#eef3ff", chrome: "#ffffff", ctext: "#10204a", cline: "#cdd9ff", cbg: "#fff", ink: "#10204a", mute: "#4a5a86", panel: "#fff", line: "#b9c9f5", accent: "#2f6bff", accentInk: "#ffffff", hf: "'Sora',sans-serif", bf: "'Manrope',sans-serif", h1: "700 clamp(22px,2.3vw,30px)/1.1 'Sora',sans-serif", laneR: "20px", laneBd: "1.5px solid #cdd9ff", laneSh: "0 10px 28px rgba(16,32,74,.10)", laneBg: "#fff", hl: "#e1ebff", cardR: "14px", cardBd: "1.5px solid #cdd9ff", cardSh: "0 3px 10px rgba(16,32,74,.10)", dragSh: "0 18px 36px rgba(16,32,74,.25)", btnR: "12px", btnSh: "0 0 0 transparent", tones: ["#ffffff", "#fff0b8", "#d6e4ff", "#d2f5e3", "#ffd6dd"], cardInk: "#10204a", cardMute: "#4a5a86", cf: "700 14px 'Sora',sans-serif", sf: "600 15px 'Manrope',sans-serif", lt: "700 15px 'Sora',sans-serif", grid: "radial-gradient(#10204a1f 1.2px,transparent 1.4px)", bar: "#2f6bff", warn: "#c4126a", warnFill: "#ff4d7d", pen: "#2f6bff" };
const kanban: Theme = { name: "Flow", bg: "#0e1117", chrome: "#0a0d12", ctext: "#e8ecf3", cline: "#2d3644", cbg: "#1e242e", ink: "#e8ecf3", mute: "#93a0b4", panel: "#171c25", line: "#2d3644", accent: "#5ff0e0", accentInk: "#0a0d12", hf: "'JetBrains Mono',monospace", bf: "'Instrument Sans',sans-serif", h1: "600 clamp(20px,2vw,26px)/1.15 'JetBrains Mono',monospace", laneR: "10px", laneBd: "1px solid #2d3644", laneSh: "0 0 0 transparent", laneBg: "#171c25", hl: "#1f2733", cardR: "8px", cardBd: "1px solid #3a4658", cardSh: "0 2px 0 #000000aa", dragSh: "0 16px 30px #000000cc", btnR: "8px", btnSh: "0 0 0 transparent", tones: ["#262d3a", "#4a4326", "#233a5a", "#1f4a3f", "#5a2a33"], cardInk: "#e8ecf3", cardMute: "#aab5c6", cf: "600 14px 'Instrument Sans',sans-serif", sf: "600 15px 'Instrument Sans',sans-serif", lt: "600 13px 'JetBrains Mono',monospace", grid: "radial-gradient(#ffffff17 1.2px,transparent 1.4px)", bar: "#5ff0e0", warn: "#ff7a90", warnFill: "#ff5470", pen: "#5ff0e0" };
const lean: Theme = { name: "Obeya", bg: "#fbfbf8", chrome: "#ffffff", ctext: "#1a1a1a", cline: "#1a1a1a", cbg: "#fff", ink: "#1a1a1a", mute: "#555555", panel: "#fff", line: "#1a1a1a", accent: "#d93a2b", accentInk: "#ffffff", hf: "'Caveat',cursive", bf: "'Work Sans',sans-serif", h1: "700 clamp(32px,3.4vw,46px)/1 'Caveat',cursive", laneR: "4px", laneBd: "2px solid #1a1a1a", laneSh: "0 0 0 transparent", laneBg: "#fff", hl: "#fffbd0", cardR: "3px", cardBd: "1.5px solid #1a1a1a33", cardSh: "2px 3px 6px rgba(0,0,0,.22)", dragSh: "8px 12px 18px rgba(0,0,0,.28)", btnR: "6px", btnSh: "0 0 0 transparent", tones: ["#ffffff", "#fff08a", "#bfe3ff", "#c9f2c7", "#ffb3ab"], cardInk: "#1a1a1a", cardMute: "#444444", cf: "700 23px 'Caveat',cursive", sf: "700 24px 'Caveat',cursive", lt: "700 25px 'Caveat',cursive", grid: "linear-gradient(#1a1a1a12 1px,transparent 1px),linear-gradient(90deg,#1a1a1a12 1px,transparent 1px)", bar: "#d93a2b", warn: "#d93a2b", warnFill: "#d93a2b", pen: "#d93a2b", tape: true, band: true };
const okr: Theme = { name: "Executive", bg: "#f3f4f7", chrome: "#0f2342", ctext: "#f4f6fa", cline: "#ffffff55", cbg: "transparent", ink: "#0f172a", mute: "#5b6678", panel: "#ffffff", line: "#c9d0dc", accent: "#e8c872", accentInk: "#0f2342", hf: "'Newsreader',serif", bf: "'IBM Plex Sans',sans-serif", h1: "600 clamp(26px,2.8vw,36px)/1.05 'Newsreader',serif", laneR: "10px", laneBd: "1px solid #d7dce5", laneSh: "0 1px 2px rgba(15,35,66,.08)", laneBg: "#fff", hl: "#eef2fa", cardR: "8px", cardBd: "1px solid #d7dce5", cardSh: "0 1px 3px rgba(15,35,66,.1)", dragSh: "0 14px 30px rgba(15,35,66,.25)", btnR: "8px", btnSh: "0 0 0 transparent", tones: ["#ffffff", "#fdf6e3", "#eaf1fb", "#eaf6ee", "#fbeaea"], cardInk: "#0f172a", cardMute: "#5b6678", cf: "600 14.5px 'IBM Plex Sans',sans-serif", sf: "500 15px 'IBM Plex Sans',sans-serif", lt: "600 19px 'Newsreader',serif", grid: "none", bar: "#0f2342", warn: "#b42318", warnFill: "#d92d20", pen: "#0f2342" };
const classes: Theme = { name: "Classroom", bg: "#efe6cf", chrome: "#efe6cf", ctext: "#14123a", cline: "#14123a", cbg: "#fff", ink: "#14123a", mute: "#4a4872", panel: "#fff", line: "#14123a", accent: "#ffe27a", accentInk: "#14123a", hf: "'Unbounded',sans-serif", bf: "'DM Sans',sans-serif", h1: "700 clamp(19px,2.1vw,26px)/1.1 'Unbounded',sans-serif", laneR: "6px", laneBd: "2px solid #14123a", laneSh: "5px 5px 0 #14123a", laneBg: "#fff", hl: "#ffffff", cardR: "12px", cardBd: "2px solid #14123a", cardSh: "3px 3px 0 #14123a", dragSh: "10px 12px 0 #14123a", btnR: "12px", btnSh: "3px 3px 0 #14123a", tones: ["#ffffff", "#ffe27a", "#b9c6ff", "#8ff0e3", "#ff9fc6"], cardInk: "#14123a", cardMute: "#2c2a55", cf: "700 13px 'Unbounded',sans-serif", sf: "700 25px 'Caveat',cursive", lt: "700 14px 'Unbounded',sans-serif", grid: "radial-gradient(#14123a38 1.3px,transparent 1.5px)", bar: "#4a5fe8", warn: "#c4126a", warnFill: "#ff3d8f", pen: "#4a5fe8", tape: true, cycle: true };

export const THEMES: Record<ThemeId, Theme> = {
  safe,
  scrum,
  kanban,
  lean,
  okr,
  classes,
  "six-sigma": { ...scrum, name: "Lab", bg: "#eefaf8", ctext: "#073b3a", cline: "#a6d9d3", ink: "#073b3a", mute: "#3f6f6c", line: "#a6d9d3", accent: "#0f9d8f", accentInk: "#ffffff", hf: "'JetBrains Mono',monospace", bf: "'IBM Plex Sans',sans-serif", h1: "600 clamp(20px,2.1vw,27px)/1.15 'JetBrains Mono',monospace", laneR: "4px", laneBd: "1px solid #a6d9d3", laneSh: "0 0 0 transparent", cardR: "4px", cardBd: "1px solid #a6d9d3", cardSh: "0 1px 0 #a6d9d3", btnR: "4px", tones: ["#ffffff", "#fff4c2", "#d3f0ee", "#d7f5d0", "#ffd9d4"], cardInk: "#073b3a", cardMute: "#3f6f6c", cf: "600 14px 'IBM Plex Sans',sans-serif", lt: "600 13px 'JetBrains Mono',monospace", grid: "linear-gradient(#073b3a10 1px,transparent 1px),linear-gradient(90deg,#073b3a10 1px,transparent 1px)", bar: "#0f9d8f", pen: "#0f9d8f" },
  manufacturing: { ...safe, name: "Factory", bg: "#e9e9e4", chrome: "#1b1b1b", ctext: "#ffd400", cline: "#ffd40088", ink: "#1b1b1b", mute: "#55554f", panel: "#ffffff", line: "#1b1b1b", accent: "#ffd400", accentInk: "#1b1b1b", hf: "'Archivo',sans-serif", bf: "'Archivo',sans-serif", h1: "800 clamp(22px,2.4vw,32px)/1.05 'Archivo',sans-serif", laneR: "2px", laneBd: "3px solid #1b1b1b", laneSh: "0 0 0 transparent", laneBg: "#f7f7f2", hl: "#fff5b0", cardR: "2px", cardBd: "2px solid #1b1b1b", cardSh: "4px 4px 0 #1b1b1b", tones: ["#ffffff", "#ffd400", "#cfe0ee", "#cdeccb", "#ff9d8f"], cf: "800 14px 'Archivo',sans-serif", lt: "800 15px 'Archivo',sans-serif", grid: "repeating-linear-gradient(45deg,#1b1b1b0d 0 2px,transparent 2px 12px)", bar: "#1b1b1b", car: false, equal: false, train: false, btnR: "2px", btnSh: "3px 3px 0 #1b1b1b" },
  general: { ...okr, name: "Plain", bg: "#f6f1ea", chrome: "#ffffff", ctext: "#2a2a2a", cline: "#e2d9cb", cbg: "#fff", ink: "#2a2a2a", mute: "#6b645a", line: "#d9cfbf", accent: "#2a2a2a", accentInk: "#f6f1ea", hf: "'DM Sans',sans-serif", bf: "'DM Sans',sans-serif", h1: "700 clamp(22px,2.4vw,32px)/1.1 'DM Sans',sans-serif", laneR: "18px", laneBd: "1.5px solid #e2d9cb", laneSh: "0 6px 20px rgba(42,42,42,.06)", hl: "#fbf3df", cardR: "12px", cardBd: "1.5px solid #e2d9cb", cardSh: "0 2px 6px rgba(42,42,42,.08)", btnR: "99px", tones: ["#ffffff", "#fde9a9", "#d7e6f7", "#d8efd3", "#f7d4d0"], cf: "700 14.5px 'DM Sans',sans-serif", sf: "600 15px 'DM Sans',sans-serif", lt: "700 16px 'DM Sans',sans-serif", grid: "radial-gradient(#2a2a2a1f 1.2px,transparent 1.4px)", bar: "#2a2a2a", pen: "#2a2a2a" },
  innovation: { ...kanban, name: "Playground", bg: "#1a1033", chrome: "#120a26", ctext: "#f1eaff", cline: "#5b3fa0", cbg: "#241547", ink: "#f1eaff", mute: "#b7a6e0", panel: "#241547", line: "#5b3fa0", accent: "#c6ff3d", accentInk: "#1a1033", hf: "'Unbounded',sans-serif", bf: "'DM Sans',sans-serif", h1: "700 clamp(19px,2.1vw,26px)/1.1 'Unbounded',sans-serif", laneR: "22px", laneBd: "1.5px solid #5b3fa0", laneBg: "#241547", hl: "#30205c", cardR: "16px", cardBd: "1.5px solid #7a5cd0", cardSh: "0 4px 0 #0c0620", tones: ["#33225e", "#5c4a14", "#2a3f7a", "#1d5a3b", "#6a2450"], cardInk: "#f1eaff", cardMute: "#c4b6ea", cf: "700 13px 'Unbounded',sans-serif", lt: "700 14px 'Unbounded',sans-serif", grid: "radial-gradient(#ffffff18 1.2px,transparent 1.4px)", bar: "#c6ff3d", warn: "#ff8ab0", warnFill: "#ff5c93", pen: "#c6ff3d", btnR: "14px" },
  mutation: { ...kanban, name: "Signal", bg: "#12100f", chrome: "#0b0908", ctext: "#f6ece6", cline: "#4a3a33", cbg: "#201a17", ink: "#f6ece6", mute: "#b8a79d", panel: "#1c1715", line: "#4a3a33", accent: "#ff5a36", accentInk: "#12100f", laneBg: "#1c1715", laneR: "6px", laneBd: "1px solid #4a3a33", hl: "#2a211d", cardR: "6px", cardBd: "1px solid #6a554b", tones: ["#2a221e", "#4d3d12", "#1f3b5c", "#1f4a34", "#5c2222"], bar: "#ff5a36", warn: "#ff8a70", warnFill: "#ff5a36", pen: "#ff5a36" },
};

/** The theme a template method speaks in. Unknown methods (and boards with none) get the plain theme. */
export function methodTheme(method: string | undefined): ThemeId {
  if (!method) return "general";
  if (method === "two-chasms") return "innovation";
  return method in THEMES ? (method as ThemeId) : "general";
}

/** Swatch colour per method chip, from the handoff. */
export const METHOD_DOT: Record<string, string> = { safe: "#ffb627", scrum: "#2f6bff", kanban: "#5ff0e0", lean: "#d93a2b", "six-sigma": "#0f9d8f", manufacturing: "#ffd400", general: "#2a2a2a", innovation: "#c6ff3d", "two-chasms": "#c6ff3d", mutation: "#ff5a36" };

function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
}

function family(font: string): string {
  return font.slice(font.indexOf("'"));
}

/** CSS for every theme, as :root[data-theme="…"] blocks. */
export function themeCss(): string {
  return (Object.entries(THEMES) as [ThemeId, Theme][])
    .map(([id, t]) => {
      const dark = isDark(t.bg);
      const v: Record<string, string> = {
        "--th-bg": t.bg, "--th-chrome": t.chrome, "--th-ctext": t.ctext, "--th-cline": t.cline, "--th-cbg": t.cbg, "--th-ink": t.ink, "--th-mute": t.mute, "--th-panel": t.panel, "--th-line": t.line,
        "--th-accent": t.accent, "--th-accent-ink": t.accentInk, "--th-hf": t.hf, "--th-bf": t.bf, "--th-h1": t.h1,
        "--th-lane-r": t.laneR, "--th-lane-bd": t.laneBd, "--th-lane-sh": t.laneSh, "--th-lane-bg": t.laneBg, "--th-hl": t.hl,
        "--th-card-r": t.cardR, "--th-card-bd": t.cardBd, "--th-card-sh": t.cardSh, "--th-drag-sh": t.dragSh, "--th-btn-r": t.btnR, "--th-btn-sh": t.btnSh,
        "--th-t0": t.tones[0], "--th-t1": t.tones[1], "--th-t2": t.tones[2], "--th-t3": t.tones[3], "--th-t4": t.tones[4],
        "--th-card-ink": t.cardInk, "--th-card-mute": t.cardMute, "--th-cf": t.cf, "--th-sf": t.sf, "--th-lt": t.lt, "--th-grid": t.grid,
        "--th-bar": t.bar, "--th-warn": t.warn, "--th-warn-fill": t.warnFill, "--th-pen": t.pen,
        // The existing pages' variables, re-pointed at the theme.
        "--paper": t.bg, "--ink": t.ink, "--ink-2": t.mute, "--ink-3": t.mute, "--line": `color-mix(in srgb, ${t.line} 35%, transparent)`, "--line-strong": `color-mix(in srgb, ${t.line} 60%, transparent)`,
        "--signal": dark ? t.accent : t.bar, "--signal-soft": `color-mix(in srgb, ${t.accent} 30%, transparent)`, "--chart": t.bar,
        "--panel": t.panel, "--sunken": `color-mix(in srgb, ${t.ink} 7%, transparent)`,
        "--glass-rail": t.panel, "--glass-panel": t.panel, "--glass-card": t.laneBg, "--glass-strong": dark ? `color-mix(in srgb, ${t.panel} 80%, #fff 8%)` : "#ffffff", "--glass-edge": `color-mix(in srgb, ${t.line} 45%, transparent)`, "--glass-highlight": "transparent",
        "--shadow-ink": dark ? "0, 0, 0" : "23, 33, 43", "--light-alpha": "0",
        "--font-display": family(t.hf), "--font-body": family(t.bf),
        "--radius": t.cardR.split(" ")[0]!, "--radius-panel": t.laneR.split(" ")[0]!,
        "color-scheme": dark ? "dark" : "light",
      };
      if (dark) Object.assign(v, { "--ok": "#5cc28a", "--ok-soft": "#173325", "--warn": "#e2a74a", "--warn-soft": "#3a2c12", "--crit": "#ef7f6a", "--crit-soft": "#3d1e19", "--ai": "#a993ee", "--ai-soft": "#2a2343" });
      else Object.assign(v, { "--ok": "#2f8a57", "--ok-soft": "#e1f2e7", "--warn": "#b7791f", "--warn-soft": "#fbf0d9", "--crit": "#c2412d", "--crit-soft": "#fae3de", "--ai": "#6b4fbb", "--ai-soft": "#ece7fa" });
      return `:root[data-theme="${id}"]{${Object.entries(v).map(([k, x]) => `${k}:${x}`).join(";")}}`;
    })
    .join("\n");
}
