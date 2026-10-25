import { describe, expect, it } from "vitest";
import { ImportError, LucidImporter, MiroImporter, MondayImporter, MuralImporter, TrelloImporter, boardFromCsv, boardFromJson, boardFromLucidCsv, createImporter, isLucidCsvExport, parseCsv, stripHtml, type FetchLike } from "./index.js";

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

describe("Lucid", () => {
  // Shaped like the documented Document Content resource: pages with items.shapes / items.lines,
  // shapes with class and textAreas, lines with endpoint1/endpoint2.connectedTo.
  const contents = {
    id: "d0c-1",
    title: "PI 26.4 dependencies",
    product: "lucidchart",
    pages: [
      { id: "0_1", title: "Risks", index: 1, items: { shapes: [{ id: "r1", class: "StickyNoteBlock", textAreas: [{ label: "Text", text: "Vendor SLA unknown" }], boundingBox: { x: 500, y: 300, w: 120, h: 120 } }] } },
      {
        id: "0_0",
        title: "ART board",
        index: 0,
        items: {
          shapes: [
            { id: "s1", class: "ProcessBlock", textAreas: [{ label: "Text", text: "Guest checkout" }], customData: [{ key: "Points", value: "13" }] },
            { id: "s2", class: "DecisionBlock", textAreas: [{ label: "Text", text: "Go <b>live</b>?" }] },
            { id: "s3", class: "TextBlock", textAreas: [] },
          ],
          lines: [
            { id: "l1", endpoint1: { style: "None", connectedTo: "s1" }, endpoint2: { style: "Arrow", connectedTo: "s2" }, textAreas: [{ label: "t0", text: "depends on" }] },
            { id: "l2", endpoint1: { style: "None", connectedTo: "s1" }, endpoint2: { style: "Arrow", connectedTo: null } },
          ],
          groups: [{ id: "g1", members: ["s1", "s2"] }],
        },
      },
    ],
  };

  it("imports pages as frames, shapes as nodes and lines as edges", async () => {
    const { fetchFn, calls } = server({
      "/documents/d0c-1": { documentId: "d0c-1", title: "PI 26.4 dependencies", editUrl: "https://lucid.app/lucidchart/d0c-1/edit" },
      "/documents/d0c-1/contents": contents,
    });
    const b = await new LucidImporter("key-abc", { fetch: fetchFn }).fetchBoard("d0c-1");
    expect(b.id).toBe("lucid-d0c-1");
    expect(b.origin).toMatchObject({ system: "lucid", externalId: "d0c-1", url: "https://lucid.app/lucidchart/d0c-1/edit" });
    expect(b.frames.map((f) => f.title)).toEqual(["ART board", "Risks"]);
    expect(b.nodes.map((n) => [n.id, n.kind, n.text, n.frameId])).toEqual([
      ["s1", "shape", "Guest checkout", "page-0_0"],
      ["s2", "shape", "Go live?", "page-0_0"],
      ["s3", "text", "", "page-0_0"],
      ["r1", "sticky", "Vendor SLA unknown", "page-0_1"],
    ]);
    expect(b.nodes[0]!.fields).toEqual({ lucidShape: "ProcessBlock", lucidGroup: "g1", customData: { Points: "13" } });
    // The Risks page has bounding boxes, so its sticky keeps its place relative to the page.
    const risks = b.frames[1]!;
    expect(b.nodes[3]).toMatchObject({ x: 20, y: risks.y + 50, width: 120, height: 120 });
    expect(b.edges).toEqual([{ id: "l1", fromId: "s1", toId: "s2", label: "depends on" }]);
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: "Bearer key-abc", "Lucid-Api-Version": "1" });
  });

  it("lists documents through the Link header and never follows it off the API host", async () => {
    const { fetchFn, calls } = server({
      "/users/me/profile": { id: 7, fullName: "Amara Okafor", email: "amara@example.com", username: "amara" },
      "/documents/search": (url: URL, init: RequestInit) => {
        expect(init.method).toBe("POST");
        expect(JSON.parse(String(init.body))).toEqual({ product: ["lucidchart", "lucidspark"] });
        if (url.searchParams.get("pageToken") === "p2") {
          return new Response(JSON.stringify([{ documentId: "d2", title: "Retro", product: "lucidspark", viewUrl: "https://lucid.app/lucidspark/d2/view" }]), { status: 200, headers: { Link: '<https://evil.example/documents/search?pageToken=p3>; rel="next"' } });
        }
        return new Response(JSON.stringify([{ documentId: "d1", title: "Program board", product: "lucidchart", editUrl: "https://lucid.app/lucidchart/d1/edit", lastModified: "2026-10-01T09:00:00Z" }]), { status: 200, headers: { Link: '<https://api.lucid.co/documents/search?pageSize=200&pageToken=p2>; rel="next"' } });
      },
    });
    const lucid = new LucidImporter("tok", { fetch: fetchFn });
    expect(await lucid.whoami()).toEqual({ name: "Amara Okafor" });
    expect(await lucid.listBoards()).toEqual([
      { id: "d1", name: "Program board", url: "https://lucid.app/lucidchart/d1/edit", container: "Lucidchart", updatedAt: "2026-10-01T09:00:00Z" },
      { id: "d2", name: "Retro", url: "https://lucid.app/lucidspark/d2/view", container: "Lucidspark" },
    ]);
    expect(calls.some((c) => c.url.includes("evil.example"))).toBe(false);
    expect(calls.filter((c) => c.url.includes("/documents/search"))).toHaveLength(2);
  });

  it("checks an API key without a profile through a search, and encodes ids", async () => {
    const { fetchFn, calls } = server({ "/users/me/profile": new Response("{}", { status: 403 }), "/documents/search": [] });
    expect(await new LucidImporter("key", { fetch: fetchFn }).whoami()).toEqual({ name: "Lucid user" });
    const denied = server({ "/documents/search": new Response("{}", { status: 401 }) });
    await expect(new LucidImporter("bad", { fetch: denied.fetchFn }).whoami()).rejects.toMatchObject({ code: "AUTH" });
    await new LucidImporter("key", { fetch: fetchFn }).fetchBoard("a/b?c").catch(() => undefined);
    expect(calls.at(-1)!.url).toContain("/documents/a%2Fb%3Fc/contents");
    expect(createImporter("lucid", { token: "t" }).system).toBe("lucid");
  });

  it("reads a Lucidchart CSV of Shape Data: pages, containers, shapes and lines", () => {
    const csv = [
      "Id,Name,Shape Library,Page ID,Contained By,Group,Line Source,Line Destination,Source Arrow,Destination Arrow,Status,Text Area 1,Text Area 2,Comments",
      "1,Document,,,,,,,,,Draft,PI 26.4 dependencies,,",
      "2,Page,,,,,,,,,,ART board,,",
      "3,Page,,,,,,,,,,Risks,,",
      "4,Swim Lane,Flowchart Shapes,2,,,,,,,,Team Checkout,,",
      "5,Process,Flowchart Shapes,2,4,,,,,,,Guest checkout,13 pts,",
      '6,Process,Flowchart Shapes,2,4,,,,,,,"Saved carts, phase 2",,',
      "7,Decision,Flowchart Shapes,2,,,,,,,,Go live?,,",
      "8,Line,,2,,,5,7,None,Arrow,,depends on,,",
      "9,Sticky Note,Standard,3,,,,,,,,Vendor SLA unknown,,Raised by the RTE",
      "10,Line,,2,,,5,99,None,Arrow,,,,",
    ].join("\r\n");
    expect(isLucidCsvExport(csv)).toBe(true);
    const b = boardFromLucidCsv(csv, { name: "Dependencies", now: "2026-10-24T00:00:00.000Z" });
    expect(b.origin).toMatchObject({ system: "lucid", externalId: "csv:Dependencies" });
    expect(b.frames.map((f) => [f.title, f.parentId])).toEqual([
      ["ART board", undefined],
      ["Team Checkout", "page-2"],
      ["Risks", undefined],
    ]);
    expect(b.nodes.map((n) => [n.id, n.kind, n.text, n.frameId])).toEqual([
      ["7", "shape", "Go live?", "page-2"],
      ["5", "shape", "Guest checkout\n13 pts", "frame-4"],
      ["6", "shape", "Saved carts, phase 2", "frame-4"],
      ["9", "sticky", "Vendor SLA unknown", "page-3"],
    ]);
    expect(b.nodes[1]!.fields).toEqual({ lucidShape: "Process", shapeLibrary: "Flowchart Shapes" });
    expect(b.nodes[3]!.fields).toMatchObject({ Comments: "Raised by the RTE" });
    // Containers sit inside their page; their cards inside them.
    const lane = b.frames[1]!;
    expect(b.nodes[1]!.y).toBeGreaterThan(lane.y);
    expect(b.nodes[1]!.y + 170).toBeLessThanOrEqual(lane.y + lane.height);
    expect(b.edges).toEqual([{ id: "8", fromId: "5", toId: "7", label: "depends on" }]);
    expect(b.fields).toMatchObject({ lucidCsv: true, pages: 2, documentTitle: "PI 26.4 dependencies" });
  });

  it("reads a Lucidspark CSV with frames, tags and comments, and refuses other CSVs", () => {
    const csv = ["Id,Name,Shape Library,Page ID,Contained By,Group,Status,Text Area 1,Comments,Tags", "1,Page,,,,,,Retro board,,", "2,Frame,Lucidspark,1,,,,Went well,,", "3,Sticky Note,Lucidspark,1,2,,,Fast releases,,ops", '4,Sticky Note,Lucidspark,1,,,,Too many meetings,"Agreed, cut one","process; meetings"'].join("\n");
    expect(isLucidCsvExport(csv)).toBe(true);
    const b = boardFromLucidCsv(csv, { name: "Retro" });
    expect(b.frames.map((f) => f.title)).toEqual(["Retro board", "Went well"]);
    expect(b.nodes.map((n) => [n.text, n.kind, n.frameId, n.tags])).toEqual([
      ["Too many meetings", "sticky", "page-1", ["process", "meetings"]],
      ["Fast releases", "sticky", "frame-2", ["ops"]],
    ]);
    expect(b.nodes[0]!.fields).toMatchObject({ Comments: "Agreed, cut one" });
    expect(isLucidCsvExport("Feature,Team,Points\nGuest checkout,Checkout,13")).toBe(false);
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

describe("Miro CSV export", () => {
  it("turns blocks into frames of stickies and tables into grids of cards", async () => {
    const { boardFromMiroCsv, isMiroCsvExport } = await import("./miroCsv.js");
    const csv = ['""', '"Parking Lot"', '"Questions"', '"Closed"', "", '"<p>Leading SAFe</p>"', '"Lesson 1: Thriving","","","To do"', '"Lesson 2: Foundation","","",""', "", '"Column 1","Column 2"', '"Steps to create one:","…"', '"Impediments:","…"'].join("\n");
    expect(isMiroCsvExport(csv)).toBe(true);
    const b = boardFromMiroCsv(csv, { name: "Leading SAFe", now: "2026-01-01T00:00:00.000Z" });
    expect(b.frames.map((f) => f.title)).toEqual(["Parking Lot", "Leading SAFe", "Block 3"]);
    expect(b.nodes.filter((n) => n.frameId === b.frames[0]!.id).map((n) => n.text)).toEqual(["Questions", "Closed"]);
    expect(b.nodes.filter((n) => n.frameId === b.frames[1]!.id && n.kind === "card")).toHaveLength(8);
    expect(b.nodes.filter((n) => n.frameId === b.frames[2]!.id).map((n) => n.text)).toEqual(["Column 1", "Column 2", "Steps to create one:", "…", "Impediments:", "…"]);
    expect(isMiroCsvExport("Feature,Team,Points\nGuest checkout,Checkout,13")).toBe(false);
  });
});

describe("PowerPoint course decks", () => {
  // A stored zip of the given parts: enough of a .pptx for the reader. Every word is invented.
  const zip = async (parts: Record<string, string>) => {
    const { crc32 } = await import("node:zlib");
    const locals: Buffer[] = [];
    const centrals: Buffer[] = [];
    let offset = 0;
    for (const [name, text] of Object.entries(parts)) {
      const n = Buffer.from(name);
      const data = Buffer.from(text);
      const crc = crc32(data);
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(n.length, 28); central.writeUInt32LE(offset, 42);
      locals.push(local, n, data);
      centrals.push(central, n);
      offset += 30 + n.length + data.length;
    }
    const cd = Buffer.concat(centrals);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(parts).length, 8); end.writeUInt16LE(Object.keys(parts).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, cd, end]);
  };
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const rels = (list: [string, string, string][]) => `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id, type, target]) => `<Relationship Id="${id}" Type="${REL}/${type}" Target="${target}"/>`).join("")}</Relationships>`;
  const xfrm = (x: number, y: number, cx: number, cy: number) => `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`;
  const para = (t: string) => `<a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>${t}</a:t></a:r></a:p>`;
  const title = (t: string, pos = "") => `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr>${pos}</p:spPr><p:txBody><a:bodyPr/>${para(t)}</p:txBody></p:sp>`;
  const box = (t: string, pos: string, fill?: string) => `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Box"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${pos}${fill ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` : ""}</p:spPr><p:txBody><a:bodyPr/>${t.split("\n").map(para).join("")}</p:txBody></p:sp>`;
  const cell = (t: string) => `<a:tc><a:txBody><a:bodyPr/>${para(t)}</a:txBody><a:tcPr/></a:tc>`;
  const table = (pos: [number, number], rows: string[][]) =>
    `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${pos[0]}" y="${pos[1]}"/><a:ext cx="2540000" cy="1270000"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblGrid><a:gridCol w="1270000"/><a:gridCol w="1270000"/></a:tblGrid>${rows.map((r) => `<a:tr h="635000">${r.map(cell).join("")}</a:tr>`).join("")}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  const slide = (shapes: string) => `<?xml version="1.0"?><p:sld ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${shapes}</p:spTree></p:cSld></p:sld>`;
  const toLayout = rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"]]);
  // Presentation order is not file order: the second slide shown lives in slide3.xml.
  const file = (i: number) => `ppt/slides/slide${[1, 3, 2, 4][i] ?? i + 1}.xml`;
  const deck = (slides: string[]) =>
    zip({
      "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
      "ppt/presentation.xml": `<?xml version="1.0"?><p:presentation ${NS}><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 10}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`,
      "ppt/_rels/presentation.xml.rels": rels(slides.map((_, i) => [`rId${i + 10}`, "slide", file(i).replace("ppt/", "")])),
      ...Object.fromEntries(slides.flatMap((s, i) => [[file(i), s], [file(i).replace("slides/", "slides/_rels/") + ".rels", toLayout]])),
      // The layout gives titles their place when a slide leaves it out.
      "ppt/slideLayouts/slideLayout1.xml": slide(title("", xfrm(635000, 317500, 10922000, 952500))),
    });

  it("turns slides into lesson bands of slide frames, with text boxes in place and tables as stickies", async () => {
    const { boardFromPptx, isPptx, lessonOf, readPptx } = await import("./pptx.js");
    const bytes = await deck([
      slide(title("Kite Flying Basics") + box("Meet the crew\nPack a snack", xfrm(635000, 1270000, 3175000, 1270000))),
      slide(title("Lesson 2 Activity: Paper planes", xfrm(0, 0, 12192000, 952500)) + box("Fold along the line", xfrm(635000, 1270000, 1905000, 952500), "FFEE99") + table([6350000, 1270000], [["Wing", "Notes"], ["Delta", "…"]])),
      slide(title("L5: Launch day") + box("Bring string", xfrm(0, 3175000, 1270000, 635000))),
      slide(title("Lesson 2 Discussion: Landings")),
    ]);
    expect(isPptx(bytes)).toBe(true);
    const parsed = readPptx(bytes);
    expect(parsed).toMatchObject({ width: 1920, height: 1080, hidden: 0 });
    expect(parsed.slides.map((s) => [s.number, s.title, s.lesson])).toEqual([
      [1, "Kite Flying Basics", undefined],
      [2, "Lesson 2 Activity: Paper planes", 2],
      [3, "L5: Launch day", 5],
      [4, "Lesson 2 Discussion: Landings", 2],
    ]);
    // The first title has no position of its own and takes the layout's.
    expect(parsed.slides[0]!.texts[0]).toMatchObject({ role: "title", x: 100, y: 50, width: 1720, height: 150, fontSize: 48 });

    const b = boardFromPptx(bytes, { fileName: "Kite_Course.pptx", id: "tpl-deck-1", now: "2026-01-01T00:00:00.000Z" });
    expect(b).toMatchObject({ id: "tpl-deck-1", name: "Kite Course", isTemplate: true, origin: { system: "pptx", externalId: "Kite_Course.pptx" } });
    expect(b.fields).toMatchObject({ class: "custom", source: "deck", slides: 4, lessons: 2, bands: ["Welcome", "Lesson 2", "Lesson 5"] });
    const bands = b.frames.filter((f) => !f.parentId);
    expect(bands.map((f) => f.title)).toEqual(["Welcome", "Lesson 2", "Lesson 5"]);
    // Bands stack top to bottom; slides sit side by side inside, in deck order.
    expect(bands[1]!.y).toBeGreaterThan(bands[0]!.y + bands[0]!.height);
    const inLesson2 = b.frames.filter((f) => f.parentId === "lesson-2");
    expect(inLesson2.map((f) => f.title)).toEqual(["2. Lesson 2 Activity: Paper planes", "4. Lesson 2 Discussion: Landings"]);
    expect(inLesson2[1]!.x).toBe(inLesson2[0]!.x + 1920 + 40);
    expect(inLesson2[0]).toMatchObject({ width: 1920, y: inLesson2[1]!.y });

    const s2 = inLesson2[0]!;
    const onS2 = b.nodes.filter((n) => n.frameId === s2.id);
    // The filled text box is a sticky at its slide position (EMU / 6350), under the frame's heading.
    expect(onS2.find((n) => n.text === "Fold along the line")).toMatchObject({ kind: "sticky", color: "#ffee99", x: s2.x + 100, y: s2.y + 50 + 200, width: 300, height: 150 });
    expect(onS2.find((n) => n.fields.role === "title")).toMatchObject({ kind: "text", text: "Lesson 2 Activity: Paper planes" });
    const cells = onS2.filter((n) => n.id.includes("-tbl1-"));
    expect(cells.map((n) => [n.kind, n.text])).toEqual([["card", "Wing"], ["card", "Notes"], ["sticky", "Delta"], ["sticky", ""]]);
    expect(cells[0]!.fields).toMatchObject({ header: true, bold: true, fontColor: "#ffffff" });
    expect(cells[3]!.fields.placeholder).toBe(true);
    expect(cells[3]).toMatchObject({ x: s2.x + 1000 + 200, y: s2.y + 50 + 200 + 100, width: 200, height: 100 });
    const s1 = b.frames.find((f) => f.parentId === "welcome")!;
    expect(b.nodes.find((n) => n.frameId === s1.id && n.text === "Meet the crew\nPack a snack")).toMatchObject({ kind: "text", x: s1.x + 100 });

    expect(lessonOf("Lesson 6 Discussion: Wind")).toBe(6);
    expect(lessonOf("L3: Gliding")).toBe(3);
    expect(lessonOf("L4 Discussion")).toBe(4);
    expect(lessonOf("Launch day")).toBeUndefined();
    expect(lessonOf("Lessons learned")).toBeUndefined();
  });

  it("refuses files that are not decks and decks over the slide and card caps", async () => {
    const { boardFromPptx, isPptx, readPptx } = await import("./pptx.js");
    expect(isPptx(Buffer.from("just some text, not a zip"))).toBe(false);
    const other = await zip({ "notes.txt": "hello" });
    expect(isPptx(other)).toBe(false);
    expect(() => readPptx(other)).toThrow(ImportError);
    const bytes = await deck([slide(title("One")), slide(title("Two")), slide(title("Three"))]);
    expect(() => readPptx(bytes, { maxSlides: 2 })).toThrow(/3 slides; up to 2/);
    expect(() => boardFromPptx(bytes, { fileName: "x.pptx", maxNodes: 2 })).toThrow(/more than 2 cards/);
  });
});
