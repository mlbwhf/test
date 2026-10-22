import { describe, expect, it } from "vitest";
import { ImportError, MiroImporter, MondayImporter, MuralImporter, TrelloImporter, boardFromCsv, boardFromJson, createImporter, parseCsv, stripHtml, type FetchLike } from "./index.js";

function server(routes: Record<string, unknown | ((url: URL, init: RequestInit) => unknown)>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(String(input));
    calls.push({ url: url.toString(), init });
    const key = Object.keys(routes).find((k) => url.pathname === k || url.pathname.endsWith(k));
    if (!key) return new Response(JSON.stringify({ message: "no route" }), { status: 404 });
    const r = routes[key];
    const body = typeof r === "function" ? (r as (u: URL, i: RequestInit) => unknown)(url, init) : r;
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200 });
  }) as FetchLike;
  return { fetchFn, calls };
}

describe("Miro", () => {
  it("imports frames, items and connectors with board positions", async () => {
    const { fetchFn, calls } = server({
      "/v2/boards/uXj": { id: "uXj", name: "PI Planning", viewLink: "https://miro.com/app/board/uXj" },
      "/v2/boards/uXj/items": (url: URL) =>
        url.searchParams.get("cursor")
          ? { data: [{ id: "s2", type: "sticky_note", data: { content: "<p>Wallet &amp; tokens</p>" }, style: { fillColor: "light_blue" }, position: { x: 50, y: 50 }, geometry: { width: 200, height: 200 }, parent: { id: "f1" } }] }
          : {
              data: [
                { id: "f1", type: "frame", data: { title: "Checkout" }, position: { x: 500, y: 300 }, geometry: { width: 1000, height: 600 } },
                { id: "s1", type: "sticky_note", data: { content: "Guest<br>checkout" }, style: { fillColor: "#fff9b1" }, position: { x: 100, y: 100 }, geometry: { width: 200, height: 200 }, parent: { id: "f1" } },
                { id: "c1", type: "card", data: { title: "Latency budget", description: "<b>p95</b> under 300ms" }, position: { x: 3000, y: 10 } },
              ],
              cursor: "next",
            },
      "/v2/boards/uXj/connectors": { data: [{ id: "k1", startItem: { id: "s2" }, endItem: { id: "s1" }, captions: [{ content: "needs" }] }] },
    });
    const b = await new MiroImporter("tok", { fetch: fetchFn }).fetchBoard("uXj");
    expect(b.name).toBe("PI Planning");
    expect(b.origin).toMatchObject({ system: "miro", url: "https://miro.com/app/board/uXj" });
    expect(b.frames).toEqual([{ id: "f1", title: "Checkout", x: 0, y: 0, width: 1000, height: 600 }]);
    expect(b.nodes.map((n) => [n.id, n.text, n.x, n.y, n.frameId, n.color])).toEqual([
      ["s1", "Guest\ncheckout", 100, 100, "f1", "#fff9b1"],
      ["c1", "Latency budget\np95 under 300ms", 3000, 10, undefined, undefined],
      ["s2", "Wallet & tokens", 50, 50, "f1", "light_blue"],
    ]);
    expect(b.edges).toEqual([{ id: "k1", fromId: "s2", toId: "s1", label: "needs" }]);
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(calls.filter((c) => c.url.includes("/items")).length).toBe(2);
  });

  it("lists boards and surfaces auth errors", async () => {
    const { fetchFn } = server({ "/v2/boards": { data: [{ id: "a", name: "A", viewLink: "u", team: { name: "Dev" } }] } });
    expect(await new MiroImporter("t", { fetch: fetchFn }).listBoards()).toEqual([{ id: "a", name: "A", url: "u", container: "Dev" }]);
    const denied = server({ "/v2/boards": new Response("{}", { status: 401 }) });
    await expect(new MiroImporter("bad", { fetch: denied.fetchFn }).listBoards()).rejects.toMatchObject({ code: "AUTH" });
  });
});

describe("Mural", () => {
  it("imports areas as frames and widgets as nodes", async () => {
    const { fetchFn } = server({
      "/murals/m1": { value: { title: "Retro", _canvasLink: "https://app.mural.co/t/x/m/m1" } },
      "/murals/m1/widgets": {
        value: [
          { id: "a1", type: "area", title: "Went well", x: 0, y: 0, width: 600, height: 400 },
          { id: "w1", type: "sticky note", htmlText: "<p>Fast releases</p>", x: 10, y: 10, width: 138, height: 138, style: { backgroundColor: "#FCF281FF" }, parentId: "a1", tags: [{ text: "ops" }] },
          { id: "w2", type: "arrow", startRefId: "w1", endRefId: "w3" },
          { id: "w3", type: "text", text: "Keep doing", x: 700, y: 10 },
        ],
      },
    });
    const b = await new MuralImporter("tok", { fetch: fetchFn }).fetchBoard("m1");
    expect(b.frames[0]).toMatchObject({ title: "Went well", width: 600 });
    expect(b.nodes.map((n) => [n.id, n.kind, n.text, n.frameId, n.tags])).toEqual([
      ["w1", "sticky", "Fast releases", "a1", ["ops"]],
      ["w3", "text", "Keep doing", undefined, []],
    ]);
    expect(b.edges).toEqual([{ id: "w2", fromId: "w1", toId: "w3" }]);
  });

  it("lists murals across workspaces", async () => {
    const { fetchFn } = server({ "/workspaces": { value: [{ id: "w", name: "Acme" }] }, "/workspaces/w/murals": { value: [{ id: "m1", title: "Retro", updatedOn: 1760000000000 }] } });
    const list = await new MuralImporter("t", { fetch: fetchFn }).listBoards();
    expect(list[0]).toMatchObject({ id: "m1", name: "Retro", container: "Acme" });
  });
});

describe("monday.com", () => {
  it("imports columns, groups and paged items with raw values kept", async () => {
    let page = 0;
    const { fetchFn, calls } = server({
      "/v2": (_u: URL, init: RequestInit) => {
        const q = JSON.parse(String(init.body)).query as string;
        if (q.includes("next_items_page")) {
          return { data: { next_items_page: { cursor: null, items: [{ id: "i3", name: "Third", group: { id: "g2" }, column_values: [{ id: "status", text: "Done", value: '{"index":1}' }] }] } } };
        }
        page++;
        return {
          data: {
            boards: [
              {
                id: "123",
                name: "Roadmap",
                url: "https://acme.monday.com/boards/123",
                columns: [{ id: "name", title: "Name", type: "name" }, { id: "status", title: "Status", type: "status" }, { id: "numbers", title: "Points", type: "numbers" }],
                groups: [{ id: "g1", title: "PI 26.4", color: "#00c875" }, { id: "g2", title: "Later" }],
                items_page: {
                  cursor: "c2",
                  items: [
                    { id: "i1", name: "Semantic search", group: { id: "g1" }, column_values: [{ id: "status", text: "Working on it", value: '{"index":0}' }, { id: "numbers", text: "13", value: '"13"' }] },
                    { id: "i2", name: "Facet fix", group: { id: "g1" }, column_values: [{ id: "status", text: "Done", value: null }, { id: "numbers", text: "", value: null }] },
                  ],
                },
              },
            ],
          },
        };
      },
    });
    const b = await new MondayImporter("tok", { fetch: fetchFn }).fetchBoard("123");
    expect(page).toBe(1);
    expect(b.columns.map((c) => c.title)).toEqual(["Item", "Status", "Points"]);
    expect(b.groups).toEqual([{ id: "g1", title: "PI 26.4", color: "#00c875" }, { id: "g2", title: "Later" }]);
    expect(b.rows).toHaveLength(3);
    expect(b.rows[0]).toEqual({ id: "i1", groupId: "g1", cells: { name: "Semantic search", status: "Working on it", "status:raw": { index: 0 }, numbers: "13", "numbers:raw": "13" } });
    expect(b.rows[2]!.cells.status).toBe("Done");
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: "tok", "API-Version": "2024-10" });
  });

  it("turns GraphQL errors into errors", async () => {
    const { fetchFn } = server({ "/v2": { errors: [{ message: "Not Authenticated" }] } });
    await expect(new MondayImporter("x", { fetch: fetchFn }).listBoards()).rejects.toThrow(/Not Authenticated/);
  });
});

describe("Trello", () => {
  it("imports lists as groups and cards as rows", async () => {
    const { fetchFn, calls } = server({
      "/boards/b1": { id: "b1", name: "Team board", shortUrl: "https://trello.com/b/b1" },
      "/boards/b1/lists": [{ id: "l1", name: "Doing" }, { id: "l2", name: "Done" }],
      "/boards/b1/cards": [{ id: "c1", name: "Ship it", desc: "soon", idList: "l1", due: "2026-11-01T00:00:00.000Z", labels: [{ name: "feature", color: "green" }], idMembers: ["m1"], shortUrl: "https://trello.com/c/c1" }],
      "/boards/b1/members": [{ id: "m1", fullName: "Amara Okafor" }],
    });
    const b = await new TrelloImporter("key", "tok", { fetch: fetchFn }).fetchBoard("b1");
    expect(b.groups.map((g) => g.title)).toEqual(["Doing", "Done"]);
    expect(b.rows[0]).toMatchObject({ id: "c1", groupId: "l1", cells: { name: "Ship it", list: "Doing", labels: "feature", members: "Amara Okafor", url: "https://trello.com/c/c1" } });
    expect(calls[0]!.url).toContain("key=key&token=tok");
  });
});

describe("files", () => {
  it("parses CSV with quotes, CRLF and a detected delimiter", () => {
    const { headers, rows } = parseCsv('Item;Team;Notes\r\n"Guest, checkout";Checkout;"He said ""hi"""\r\nSaved carts;Checkout;\r\n\r\n');
    expect(headers).toEqual(["Item", "Team", "Notes"]);
    expect(rows).toEqual([["Guest, checkout", "Checkout", 'He said "hi"'], ["Saved carts", "Checkout", ""]]);
  });

  it("builds a table board from CSV, grouped by a column", () => {
    const b = boardFromCsv("Feature,Team,Points\nA,Checkout,5\nB,Payments,8\nC,Checkout,3\n", { name: "Backlog export", groupBy: "team", now: "2026-10-21T00:00:00.000Z" });
    expect(b.origin.system).toBe("csv");
    expect(b.columns.map((c) => c.title)).toEqual(["Feature", "Team", "Points"]);
    expect(b.groups.map((g) => g.title)).toEqual(["Checkout", "Payments"]);
    expect(b.rows[1]).toMatchObject({ groupId: "g-payments", cells: { "c1-feature": "B", "c3-points": "8" } });
  });

  it("builds boards from the JSON format in both row styles", () => {
    const b = boardFromJson({
      name: "From script",
      url: "https://example.com/x",
      frames: [{ id: "f", title: "Team A", width: 100, height: 100 }],
      nodes: [{ text: "hello", frameId: "f", color: "yellow", custom: 1 }, { id: "n9", kind: "card", text: "card" }],
      edges: [{ fromId: "n1", toId: "n9" }, { fromId: "x" }],
      columns: ["Title", { id: "pts", title: "Points", type: "numbers" }],
      rows: [{ Title: "Row one", Points: 5, Owner: "Pat" }, { id: "r-raw", cells: { pts: 3 } }],
    });
    expect(b.nodes[0]).toMatchObject({ id: "n1", kind: "sticky", text: "hello", frameId: "f", color: "yellow", fields: { custom: 1 } });
    expect(b.edges).toEqual([{ id: "e1", fromId: "n1", toId: "n9" }]);
    expect(b.columns.map((c) => c.title)).toEqual(["Title", "Points", "Owner"]);
    expect(b.rows[0]!.cells).toEqual({ "c1-title": "Row one", pts: 5, "c3-owner": "Pat" });
    expect(b.rows[1]).toEqual({ id: "r-raw", cells: { pts: 3 } });
    expect(() => boardFromJson({})).toThrow(/name/);
  });

  it("strips HTML and creates importers by system", () => {
    expect(stripHtml("<p>a</p><p>b &amp; c</p>")).toBe("a\nb & c");
    expect(createImporter("trello", { token: "t", apiKey: "k" }).system).toBe("trello");
    expect(createImporter("monday", { token: "t" }).system).toBe("monday");
    expect(new ImportError("AUTH", "x").code).toBe("AUTH");
  });
});
