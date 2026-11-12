// Live push. A page watching a board or a planning document holds one streaming response
// (server-sent events) and is told the moment a commit touched it; it then fetches, so nothing
// polls while nothing changes. The hub is in-process: one API instance serves the class, and a
// page that cannot hold a stream falls back to its slow poll. A heartbeat every 25 s keeps
// proxies (Cloudflare, Traefik) from closing an idle stream.

import type { FastifyReply, FastifyRequest } from "fastify";

type Client = { write: (line: string) => void; end: () => void };
const topics = new Map<string, Set<Client>>();
const HEARTBEAT_MS = 25_000;

/** Tells every watcher of a topic ("board:<id>" or "doc:<key>") that it changed. */
export function publish(topic: string, data: Record<string, unknown>): void {
  const set = topics.get(topic);
  if (!set?.size) return;
  const line = `event: change\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of set) c.write(line);
}

/** How many pages watch a topic (tests, and the health page). */
export const watchers = (topic: string) => topics.get(topic)?.size ?? 0;

/** Answers a request with an event stream for a topic until the client goes away. */
export function stream(req: FastifyRequest, reply: FastifyReply, topic: string, first: Record<string, unknown>): void {
  const raw = reply.raw;
  reply.hijack();
  // The CORS and security headers the plugins set go out with the stream's own.
  const headers: Record<string, string | number | string[]> = { ...(reply.getHeaders() as Record<string, string | number | string[]>), "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" };
  raw.writeHead(200, headers);
  raw.flushHeaders?.();
  const client: Client = { write: (line) => raw.write(line), end: () => raw.end() };
  const set = topics.get(topic) ?? new Set<Client>();
  set.add(client);
  topics.set(topic, set);
  raw.write(`retry: 3000\nevent: hello\ndata: ${JSON.stringify(first)}\n\n`);
  const beat = setInterval(() => raw.write(`: beat\n\n`), HEARTBEAT_MS);
  const close = () => {
    clearInterval(beat);
    set.delete(client);
    if (!set.size) topics.delete(topic);
  };
  req.raw.on("close", close);
  req.raw.on("error", close);
}

/** The store's commit hook: every touched board and document gets a change notice. */
export function onCommit(_action: string, _detail: unknown, touched: { boards: string[]; docs: string[] }): void {
  const at = Date.now();
  for (const id of touched.boards) publish(`board:${id}`, { at });
  for (const key of touched.docs) publish(`doc:${key}`, { at });
}
