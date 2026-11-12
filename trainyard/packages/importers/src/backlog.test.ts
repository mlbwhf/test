import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { backlogFromFile, backlogFromRows, backlogFromWorkItems, mergeBacklogs } from "./backlog.js";

describe("planning backlogs", () => {
  it("reads a handout feature spreadsheet: stories, sizes, enablers and notes", () => {
    const f = backlogFromFile("Feature_2_Request_Delivery.xlsx", readFileSync(new URL("./fixtures/handout-feature.xlsx", import.meta.url)));
    expect(f).toHaveLength(1);
    expect(f[0]!.n).toBe(2);
    expect(f[0]!.title).toBe("Request Delivery");
    expect(f[0]!.stories.map((s) => [s.title, s.pts, !!s.enabler])).toEqual([["Pickup location", 0, false], ["Arrival time notification", 3, false], ["Bandwidth assessment", 5, true]]);
    expect(f[0]!.stories[1]!.note).toBe("requires GPS expertise to calculate time");
    expect(f[0]!.stories[1]!.text).toBe("As a mobile app supplier, I can be notified the anticipated arrive time, so that I can have the cargo ready for pickup.");
  });

  it("reads a CSV with a Feature column, numbers features in order and merges files", () => {
    const csv = Buffer.from("Feature,Title,Description,Type,Points\nShopping cart,Add item,As a shopper I add a book,Story,3\nShopping cart,Remove item,,Story,\nSearch,Search by author,,Story,5\n");
    const a = backlogFromFile("backlog.csv", csv);
    expect(a.map((f) => [f.title, f.stories.length])).toEqual([["Shopping cart", 2], ["Search", 1]]);
    expect(a[0]!.stories[0]!.pts).toBe(3);
    expect(a[0]!.stories[1]!.pts).toBe(0);
    const merged = mergeBacklogs([a, backlogFromRows([["Item Name", "Item Description", "Item Type"], ["Sort by price", "As a shopper\nSIZE: 2\nFeature: #7 - Book List Sorting", "User Story"]])]);
    expect(merged.map((f) => [f.n, f.title])).toEqual([[1, "Shopping cart"], [2, "Search"], [7, "Book List Sorting"]]);
  });

  it("groups a tracker's work items under their features", () => {
    const f = backlogFromWorkItems([
      { id: "F-1", title: "Shopping cart", level: "feature" },
      { id: "S-1", title: "Add item", level: "story", parentId: "F-1", estimate: 3 },
      { id: "S-2", title: "Spike: cart storage", level: "story", parentId: "F-1", flowType: "enabler" },
      { id: "S-3", title: "Loose story", level: "story" },
    ]);
    expect(f.map((x) => [x.title, x.stories.map((s) => s.title)])).toEqual([["Shopping cart", ["Add item", "Spike: cart storage"]], ["Not under a feature", ["Loose story"]]]);
    expect(f[0]!.stories[1]!.enabler).toBe(true);
  });
});
