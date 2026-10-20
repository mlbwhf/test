"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { idleState, type ActionState } from "@/components/action-form";

// Design a badge in the browser: shape, colors, icon and text drawn on a 600×600 canvas,
// saved as a transparent PNG that becomes the course's EnrollClass verified badge.

type Shape = "circle" | "shield" | "hexagon" | "ribbon" | "square";
type Icon = "star" | "check" | "cap" | "book" | "trophy" | "bolt" | "initials" | "none";
type Design = { shape: Shape; primary: string; accent: string; icon: Icon; initials: string; title: string; subtitle: string; footer: string; rings: boolean };

const SIZE = 600;
const SHAPES: Array<[Shape, string]> = [["circle", "Circle"], ["shield", "Shield"], ["hexagon", "Hexagon"], ["ribbon", "Rosette"], ["square", "Rounded"]];
const ICONS: Array<[Icon, string]> = [["star", "★ Star"], ["check", "✓ Check"], ["cap", "🎓 Cap"], ["book", "📖 Book"], ["trophy", "🏆 Trophy"], ["bolt", "⚡ Bolt"], ["initials", "AB Initials"], ["none", "None"]];
const PALETTES: Array<{ name: string; primary: string; accent: string }> = [
  { name: "EnrollClass", primary: "#14213d", accent: "#3fcb7e" },
  { name: "Navy & gold", primary: "#1d2b53", accent: "#e3b341" },
  { name: "Teal", primary: "#0f5257", accent: "#9be3d4" },
  { name: "Crimson", primary: "#8a1c2b", accent: "#f5d0a9" },
  { name: "Purple", primary: "#3d2463", accent: "#c9a7ff" },
  { name: "Graphite", primary: "#2b2d31", accent: "#d9dce1" },
];

type Props = {
  courseId: string;
  courseName: string;
  /** Server action that saves the badge (platform "own" + uploaded image). */
  action: (prev: ActionState, data: FormData) => Promise<ActionState>;
};

export function BadgeDesigner({ courseId, courseName, action }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [d, setD] = useState<Design>({
    shape: "circle", primary: PALETTES[0]!.primary, accent: PALETTES[0]!.accent, icon: "star",
    initials: initialsOf(courseName), title: courseName.slice(0, 40), subtitle: "CERTIFIED", footer: String(new Date().getFullYear()), rings: true,
  });
  const [state, save] = useActionState(action, idleState);
  const [pending, start] = useTransition();
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setD((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let cancelled = false;
    // Draw once now, and again when the display fonts finish loading.
    draw(c, d);
    void document.fonts?.ready.then(() => !cancelled && draw(c, d));
    return () => {
      cancelled = true;
    };
  }, [d]);

  function onSave() {
    const c = canvas.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.set("courseId", courseId);
      fd.set("platform", "own");
      fd.set("name", d.title.trim() || courseName);
      fd.set("badgeImage", new File([blob], "badge.png", { type: "image/png" }));
      start(() => save(fd));
    }, "image/png");
  }

  return (
    <div className="designer">
      <div className="designer-preview">
        <canvas ref={canvas} width={SIZE} height={SIZE} role="img" aria-label={`Badge preview: ${d.title}`} />
      </div>
      <div className="designer-controls">
        <fieldset>
          <legend>Shape</legend>
          <div className="designer-chips">
            {SHAPES.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={d.shape === v} onClick={() => set("shape", v)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Colors</legend>
          <div className="designer-palettes">
            {PALETTES.map((p) => (
              <button key={p.name} type="button" title={p.name} aria-label={p.name} aria-pressed={d.primary === p.primary && d.accent === p.accent} onClick={() => setD((x) => ({ ...x, primary: p.primary, accent: p.accent }))}>
                <span style={{ background: p.primary }} />
                <span style={{ background: p.accent }} />
              </button>
            ))}
          </div>
          <div className="designer-row">
            <label>
              Main
              <input type="color" value={d.primary} onChange={(e) => set("primary", e.target.value)} />
            </label>
            <label>
              Accent
              <input type="color" value={d.accent} onChange={(e) => set("accent", e.target.value)} />
            </label>
            <label className="designer-check">
              <input type="checkbox" checked={d.rings} onChange={(e) => set("rings", e.target.checked)} /> Double ring
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Icon</legend>
          <div className="designer-chips">
            {ICONS.map(([v, label]) => (
              <button key={v} type="button" aria-pressed={d.icon === v} onClick={() => set("icon", v)}>
                {label}
              </button>
            ))}
          </div>
          {d.icon === "initials" && (
            <label>
              Initials
              <input value={d.initials} maxLength={4} onChange={(e) => set("initials", e.target.value.toUpperCase())} />
            </label>
          )}
        </fieldset>
        <label>
          Badge name
          <input value={d.title} maxLength={40} onChange={(e) => set("title", e.target.value)} />
        </label>
        <div className="designer-row">
          <label>
            Top line
            <input value={d.subtitle} maxLength={20} onChange={(e) => set("subtitle", e.target.value.toUpperCase())} />
          </label>
          <label>
            Bottom line
            <input value={d.footer} maxLength={20} onChange={(e) => set("footer", e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Use this badge"}
        </button>
        {state.status !== "idle" && (
          <p className={`notice ${state.status === "ok" ? "notice-info" : "notice-error"}`} role="status">
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  const w = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w.slice(0, 3).map((x) => x[0]) : [w[0]?.slice(0, 2) ?? "EC"]).join("").toUpperCase();
}

/** Black or white, whichever reads better on the color. */
function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? "#14213d" : "#ffffff";
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (shape === "circle" || shape === "ribbon") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "hexagon") {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === "shield") {
    const w = r * 0.92, top = cy - r, bottom = cy + r * 1.02;
    ctx.moveTo(cx, top);
    ctx.quadraticCurveTo(cx + w * 0.55, top + r * 0.12, cx + w, top + r * 0.08);
    ctx.lineTo(cx + w, cy + r * 0.05);
    ctx.quadraticCurveTo(cx + w * 0.95, cy + r * 0.72, cx, bottom);
    ctx.quadraticCurveTo(cx - w * 0.95, cy + r * 0.72, cx - w, cy + r * 0.05);
    ctx.lineTo(cx - w, top + r * 0.08);
    ctx.quadraticCurveTo(cx - w * 0.55, top + r * 0.12, cx, top);
    ctx.closePath();
  } else {
    ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.28);
  }
}

function drawIcon(ctx: CanvasRenderingContext2D, d: Design, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  switch (d.icon) {
    case "star":
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? s : s * 0.42;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      break;
    case "check":
      ctx.lineWidth = s * 0.32;
      ctx.moveTo(cx - s * 0.75, cy + s * 0.02);
      ctx.lineTo(cx - s * 0.2, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.55);
      ctx.stroke();
      break;
    case "cap":
      ctx.moveTo(cx, cy - s * 0.7);
      ctx.lineTo(cx + s * 1.1, cy - s * 0.2);
      ctx.lineTo(cx, cy + s * 0.3);
      ctx.lineTo(cx - s * 1.1, cy - s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.62, cy + s * 0.05);
      ctx.lineTo(cx - s * 0.62, cy + s * 0.55);
      ctx.quadraticCurveTo(cx, cy + s * 0.9, cx + s * 0.62, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.62, cy + s * 0.05);
      ctx.lineTo(cx, cy + s * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.95, cy - s * 0.15);
      ctx.lineTo(cx + s * 0.95, cy + s * 0.55);
      ctx.stroke();
      break;
    case "book":
      ctx.moveTo(cx, cy - s * 0.45);
      ctx.quadraticCurveTo(cx - s * 0.5, cy - s * 0.75, cx - s, cy - s * 0.55);
      ctx.lineTo(cx - s, cy + s * 0.6);
      ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.4, cx, cy + s * 0.7);
      ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.4, cx + s, cy + s * 0.6);
      ctx.lineTo(cx + s, cy - s * 0.55);
      ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.75, cx, cy - s * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = d.primary;
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.4);
      ctx.lineTo(cx, cy + s * 0.62);
      ctx.stroke();
      break;
    case "trophy":
      ctx.moveTo(cx - s * 0.62, cy - s * 0.75);
      ctx.lineTo(cx + s * 0.62, cy - s * 0.75);
      ctx.quadraticCurveTo(cx + s * 0.6, cy + s * 0.15, cx, cy + s * 0.25);
      ctx.quadraticCurveTo(cx - s * 0.6, cy + s * 0.15, cx - s * 0.62, cy - s * 0.75);
      ctx.fill();
      ctx.fillRect(cx - s * 0.12, cy + s * 0.2, s * 0.24, s * 0.35);
      ctx.fillRect(cx - s * 0.45, cy + s * 0.55, s * 0.9, s * 0.18);
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.arc(cx - s * 0.62, cy - s * 0.42, s * 0.28, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + s * 0.62, cy - s * 0.42, s * 0.28, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      break;
    case "bolt":
      [[0.15, -1], [-0.6, 0.12], [-0.05, 0.12], [-0.2, 1], [0.6, -0.15], [0.05, -0.15]].forEach(([x, y], i) => (i ? ctx.lineTo(cx + x! * s, cy + y! * s) : ctx.moveTo(cx + x! * s, cy + y! * s)));
      ctx.closePath();
      ctx.fill();
      break;
    case "initials": {
      const text = d.initials.trim() || "EC";
      ctx.font = `800 ${Math.round(s * (text.length > 2 ? 0.95 : 1.2))}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, cx, cy + s * 0.05);
      break;
    }
    case "none":
      break;
  }
  ctx.restore();
}

/** Wraps the name onto at most two lines, shrinking the font until it fits. */
function fitTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): { lines: string[]; size: number } {
  for (let size = 46; size >= 22; size -= 2) {
    ctx.font = `800 ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { lines, size };
  }
  return { lines: [text.slice(0, 22)], size: 22 };
}

function draw(c: HTMLCanvasElement, d: Design) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const cx = SIZE / 2, cy = d.shape === "ribbon" ? SIZE / 2 - 30 : SIZE / 2, r = d.shape === "ribbon" ? 215 : 250;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Rosette tails behind the badge.
  if (d.shape === "ribbon") {
    ctx.fillStyle = shade(d.accent, -0.15);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 40, cy + 120);
      ctx.lineTo(cx + dir * 150, cy + 300);
      ctx.lineTo(cx + dir * 95, cy + 280);
      ctx.lineTo(cx + dir * 70, cy + 325);
      ctx.lineTo(cx + dir * -20, cy + 150);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Body with a soft gradient, outer ring in the accent color.
  shapePath(ctx, d.shape, cx, cy, r);
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, shade(d.primary, 0.18));
  g.addColorStop(1, shade(d.primary, -0.12));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = d.accent;
  ctx.stroke();
  if (d.rings) {
    shapePath(ctx, d.shape, cx, cy, r - 26);
    ctx.lineWidth = 3;
    ctx.strokeStyle = shade(d.accent, -0.05);
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const text = onColor(d.primary);
  drawIcon(ctx, d, cx, cy - (d.icon === "none" ? 0 : 95), 62, d.accent);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const top = d.icon === "none" ? cy - 70 : cy - 8;
  if (d.subtitle.trim()) {
    ctx.fillStyle = d.accent;
    ctx.font = `600 22px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.letterSpacing = "4px";
    ctx.fillText(d.subtitle.trim(), cx, top);
    ctx.letterSpacing = "0px";
  }
  const { lines, size } = fitTitle(ctx, d.title.trim() || "Badge", r * 1.45);
  ctx.fillStyle = text;
  lines.forEach((l, i) => ctx.fillText(l, cx, top + 48 + i * (size + 6)));
  if (d.footer.trim()) {
    ctx.fillStyle = text;
    ctx.globalAlpha = 0.8;
    ctx.font = `600 20px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.fillText(d.footer.trim(), cx, top + 48 + lines.length * (size + 6) + 22);
    ctx.globalAlpha = 1;
  }
}
