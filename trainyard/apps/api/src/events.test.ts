import { describe, expect, it } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { EventEmitter } from "node:events";
import { onCommit, publish, stream, watchers } from "./events.js";

function fakeReply() {
  const out: string[] = [];
  const raw = { writeHead: () => undefined, write: (s: string) => (out.push(s), true), end: () => undefined };
  const reply = { raw, hijack: () => undefined, getHeaders: () => ({ "access-control-allow-origin": "*" }) } as unknown as FastifyReply;
  return { reply, out };
}

describe("live push", () => {
  it("streams a hello, then a change notice per commit that touched the board or document, until the client leaves", () => {
    const a = fakeReply();
    const b = fakeReply();
    const reqA = { raw: new EventEmitter() } as unknown as FastifyRequest;
    const reqB = { raw: new EventEmitter() } as unknown as FastifyRequest;
    stream(reqA, a.reply, "board:b-1", { rev: "r1" });
    stream(reqB, b.reply, "doc:planning-room:b-1", { rev: "d1" });
    expect(watchers("board:b-1")).toBe(1);
    expect(a.out[0]).toContain('event: hello\ndata: {"rev":"r1"}');
    onCommit("board.frame.state", { board: "b-1" }, { boards: ["b-1"], docs: [] });
    onCommit("docs.put", { key: "planning-room:b-1" }, { boards: [], docs: ["planning-room:b-1"] });
    expect(a.out.filter((l) => l.startsWith("event: change"))).toHaveLength(1);
    expect(b.out.filter((l) => l.startsWith("event: change"))).toHaveLength(1);
    publish("board:b-2", { at: 1 });
    expect(a.out.filter((l) => l.startsWith("event: change"))).toHaveLength(1);
    (reqA.raw as EventEmitter).emit("close");
    expect(watchers("board:b-1")).toBe(0);
    (reqB.raw as EventEmitter).emit("close");
  });
});
