// The Mini Lab: Risk Reduction board (AI-Native Value Architect, lesson 3). The texts come from
// the course (core VALUE_ARCHITECT_LAB) and are copied to the clipboard for Flowise; what the
// class pastes back (each agent's assessment) and the risk register are shared board state.

import { VALUE_ARCHITECT_LAB } from "@trainyard/core";
import type { StudioCtx } from "./studio-model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Item = { id: string; [k: string]: any };
type Blur = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;
export const LENSES = ["Technical", "Business", "Ethical & human"];
export const SEVERITY = ["High", "Medium", "Low"];

export function labModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi } = c;
  const op = (x: any) => (c.readOnly ? undefined : c.op(x));
  const str = (k: string) => (typeof S[k] === "string" ? (S[k] as string) : "");
  const list = (k: string): Item[] => (Array.isArray(S[k]) ? (S[k] as Item[]) : []);
  const set = (k: string, v: unknown) => op({ key: k, op: "set", value: v ?? null });
  const step = String(cfg.step ?? "setup");
  const key = String(cfg.key ?? "");
  const text = VALUE_ARCHITECT_LAB[key];
  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text.text);
      setUi({ copied: key });
      setTimeout(() => setUi({ copied: null }), 1600);
    } catch {
      setUi({ copied: null });
    }
  };
  const rows = list("register");
  return {
    step, readOnly: c.readOnly,
    links: [["Flowise AI", "https://flowiseai.com/"], ["Groq", "https://groq.com/"]],
    title: text?.title ?? "", text: text?.text ?? "", copy, copied: ui.copied === key, copyLabel: ui.copied === key ? "Copied" : "Copy to clipboard",
    // Each agent's assessment, pasted back from Flowise; shared with the group.
    answer: str(`ans:${key}`), saveAnswer: (e: Blur) => set(`ans:${key}`, e.target.value || null),
    answers: ["tech", "pnl", "ethics"].map((k) => ({ k, title: VALUE_ARCHITECT_LAB[k]!.title, text: str(`ans:${k}`) })),
    rows: rows.map((r) => ({
      id: r.id, risk: r.risk ?? "", lens: r.lens ?? LENSES[0], sev: r.sev ?? SEVERITY[1], fix: r.fix ?? "",
      save: (patch: Record<string, unknown>) => op({ key: "register", op: "update", id: r.id, value: patch }),
      del: () => op({ key: "register", op: "remove", id: r.id }),
    })),
    add: (lens: string) => op({ key: "register", op: "push", value: { risk: "", lens, sev: SEVERITY[1], fix: "" } }),
  };
}
