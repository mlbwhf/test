import { describe, expect, it } from "vitest";
import { applyCapacity, calculatedCapacity, iterationCapacity, velocityHistory } from "./capacity.js";
import { demoWorkspace } from "./demo.js";

describe("team capacity", () => {
  const ws = demoWorkspace();
  const curr = ws.increments[ws.increments.length - 1]!;
  const it1 = curr.iterations[0]!;
  const it2 = curr.iterations[1]!;

  it("calculates SAFe's quick-start figure: allocation × 8 per contributor, minus days off, SM and PO excluded", () => {
    const checkout = ws.teams.find((t) => t.id === "t-checkout")!;
    const c1 = calculatedCapacity(checkout, it1, ws.people);
    // 4 full-timers (32) + a half-time UX (4); the Scrum Master and the half-time PO add nothing.
    expect(c1.total).toBe(36);
    expect(c1.members.filter((m) => !m.contributes).every((m) => m.points === 0)).toBe(true);
    const c2 = calculatedCapacity(checkout, it2, ws.people);
    // Mei Tanaka takes three days off in iteration 2.
    expect(c2.total).toBe(33);
    expect(c2.members.find((m) => m.name === "Mei Tanaka")!.points).toBe(5);
    // The IP iteration has no capacity whatever the members.
    const ip = curr.iterations.find((i) => i.isIP)!;
    expect(calculatedCapacity(checkout, ip, ws.people).total).toBe(0);
  });

  it("uses the calculated figure on the board for calculated teams, and keeps typed-in figures for manual ones", () => {
    const checkout = ws.teams.find((t) => t.id === "t-checkout")!;
    expect(checkout.capacityMode).toBe("calculated");
    expect(checkout.capacity[it1.id]).toBe(36);
    expect(checkout.capacity[it2.id]).toBe(33);
    const assist = ws.teams.find((t) => t.id === "t-assist")!;
    expect(assist.capacityMode).toBe("manual");
    expect(assist.capacity[it1.id]).toBeGreaterThanOrEqual(10);
    expect(iterationCapacity(assist, it1, ws).effective).toBe(assist.capacity[it1.id]);
  });

  it("averages the last iterations' finished points for velocity teams, falling back to the typed figure without history", () => {
    const search = ws.teams.find((t) => t.id === "t-search")!;
    expect(search.capacityMode).toBe("velocity");
    const hist = velocityHistory(search, ws.items, ws.increments, it1);
    expect(hist.length).toBeGreaterThan(0);
    expect(hist.length).toBeLessThanOrEqual(3);
    const cap = iterationCapacity(search, it1, ws);
    expect(cap.velocity.mean).not.toBeNull();
    expect(cap.effective).toBe(cap.velocity.mean);
    const fresh = { ...search, id: "t-new", capacity: { [it1.id]: 12 } };
    const noHistory = iterationCapacity(fresh, it1, ws);
    expect(noHistory.velocity.mean).toBeNull();
    expect(noHistory.effective).toBe(12);
  });

  it("switching a team to calculated recomputes every iteration", () => {
    const assist = ws.teams.find((t) => t.id === "t-assist")!;
    const next = applyCapacity({ ...assist, capacityMode: "calculated" }, ws);
    // 3 full-timers plus a quarter-time architect: 24 + 2.
    expect(next.capacity[it1.id]).toBe(26);
  });
});
