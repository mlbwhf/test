// The workspace's information architecture: four spaces in the top bar, each with its own
// sub-views and theme. Every route of the app belongs to one space, so the top bar always shows
// where you are and the second row always shows what else lives there.

import type { ThemeId } from "./themes";

export interface SubView {
  href: string;
  label: string;
  /** Extra path prefixes that count as this view. */
  also?: string[];
}

export interface Space {
  id: "okrs" | "classes" | "templates" | "plan" | "setup";
  label: string;
  theme: ThemeId;
  eyebrow: string;
  subs: SubView[];
}

export const SPACES: Space[] = [
  {
    id: "okrs",
    label: "OKRs",
    theme: "okr",
    eyebrow: "OKRs · Executive theme",
    subs: [
      { href: "/okrs", label: "Dashboard" },
      { href: "/okrs/alignment", label: "Alignment" },
      { href: "/okrs/check-in", label: "Check-in" },
      { href: "/outcomes", label: "Sources, measures & funding" },
    ],
  },
  {
    id: "classes",
    label: "Classes",
    theme: "classes",
    eyebrow: "Classes · Classroom theme",
    subs: [
      { href: "/classroom", label: "Class boards" },
      { href: "/classroom/breakouts", label: "Breakouts" },
      { href: "/classroom/agenda", label: "Agenda" },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    theme: "general",
    eyebrow: "Templates",
    subs: [
      { href: "/templates", label: "Gallery" },
      { href: "/boards", label: "Your boards", also: ["/boards/"] },
      { href: "/imports", label: "Bring your own boards" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    theme: "safe",
    eyebrow: "Plan · Train theme",
    subs: [
      { href: "/board", label: "PI planning board" },
      { href: "/board/coach-sync", label: "Coach Sync" },
      { href: "/outcome-planning", label: "PI Outcome Planning" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/value-streams", label: "Value streams" },
      { href: "/canvases", label: "Canvases" },
      { href: "/dashboards", label: "Delivery dashboards" },
    ],
  },
  {
    id: "setup",
    label: "Setup",
    theme: "general",
    eyebrow: "Setup",
    subs: [
      { href: "/model", label: "Operating model" },
      { href: "/sync", label: "Jira & Azure DevOps" },
      { href: "/card-types", label: "Card types" },
      { href: "/ai", label: "AI portfolio" },
      { href: "/agents", label: "AI agents" },
      { href: "/users", label: "Users" },
      { href: "/billing", label: "Plan & billing" },
      { href: "/admin", label: "Support console" },
    ],
  },
];

const matches = (path: string, s: SubView) => path === s.href || path.startsWith(`${s.href}/`) || !!s.also?.some((a) => path.startsWith(a));

/** The space and sub-view a path belongs to; the most specific sub-view wins (Coach Sync over the PI board). */
export function locate(path: string): { space: Space; sub: SubView | undefined } | null {
  let best: { space: Space; sub: SubView } | null = null;
  for (const space of SPACES) for (const sub of space.subs) if (matches(path, sub) && (!best || sub.href.length > best.sub.href.length)) best = { space, sub };
  return best;
}
