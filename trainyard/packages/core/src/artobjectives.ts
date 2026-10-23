// ART PI objectives: the train's summary of what its teams committed to. SAFe writes them
// after the teams' objectives, as a synthesis the Business Owners can read in one page. The
// assistant drafts them from the team objectives when a provider is configured; this module
// is the deterministic fallback and the shape both share: cluster team objectives that talk
// about the same thing, name the cluster, carry the strongest business value, and keep the
// trace back to the team objectives.

import type { Objective, Team } from "./model.js";

export interface ArtObjectiveDraft {
  title: string;
  businessValue: number;
  committed: boolean;
  sourceObjectiveIds: string[];
  rationale: string;
}

const STOP = new Set(["the", "and", "for", "with", "from", "into", "that", "this", "our", "all", "across", "over", "under", "per", "via", "a", "an", "of", "to", "in", "on", "by", "at", "as", "is", "are", "be", "or", "its", "it", "we", "us", "new", "more", "less", "ship", "pilot", "cut", "half", "one", "two", "three"]);

function terms(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/(ies|s|ing|ed)$/, (m) => (m === "ies" ? "y" : "")))
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Groups the team objectives of one increment into ART objectives. Two objectives join the
 * same cluster when they share a meaningful word; clusters of one stay as they are. Business
 * value is the cluster's highest; an ART objective is committed only when every team objective
 * in it is.
 */
export function synthesiseArtObjectives(objectives: readonly Objective[], teams: readonly Team[]): ArtObjectiveDraft[] {
  const team = objectives.filter((o) => (o.level ?? "team") === "team");
  const sets = team.map((o) => terms(o.title));
  const parent = team.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < team.length; i++) for (let j = i + 1; j < team.length; j++) if ([...sets[i]!].some((w) => sets[j]!.has(w))) parent[find(i)] = find(j);
  const clusters = new Map<number, number[]>();
  team.forEach((_, i) => clusters.set(find(i), [...(clusters.get(find(i)) ?? []), i]));
  const drafts: ArtObjectiveDraft[] = [];
  for (const idx of clusters.values()) {
    const members = idx.map((i) => team[i]!);
    const counts = new Map<string, number>();
    for (const i of idx) for (const w of sets[i]!) counts.set(w, (counts.get(w) ?? 0) + 1);
    const shared = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([w]) => w);
    const lead = [...members].sort((a, b) => b.plannedValue - a.plannedValue)[0]!;
    const teamNames = [...new Set(members.map((m) => teams.find((t) => t.id === m.teamId)?.name ?? "a team"))];
    const title = members.length === 1 ? lead.title : `${cap(shared.slice(0, 2).join(" and "))}: ${lead.title}`;
    drafts.push({
      title: title.length > 120 ? `${title.slice(0, 117)}…` : title,
      businessValue: Math.max(...members.map((m) => m.plannedValue)),
      committed: members.every((m) => m.committed),
      sourceObjectiveIds: members.map((m) => m.id),
      rationale: members.length === 1 ? `${teamNames[0]}'s objective, carried up as it stands.` : `${teamNames.join(", ")} all commit to ${shared.slice(0, 2).join(" and ")}; the ART objective names what they add up to.`,
    });
  }
  return drafts.sort((a, b) => b.businessValue - a.businessValue || b.sourceObjectiveIds.length - a.sourceObjectiveIds.length);
}
