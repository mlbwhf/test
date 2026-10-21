import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AssistError } from "./provider.js";
import { OpenAICompatibleProvider, parseJson, type FetchLike } from "./openai-compatible.js";

const Answer = z.object({ title: z.string(), score: z.number().int().min(1).max(10) });

function server(replies: (string | { status: number; body?: unknown })[]) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    const r = replies.shift() ?? "{}";
    if (typeof r !== "string") return new Response(JSON.stringify(r.body ?? {}), { status: r.status });
    return new Response(JSON.stringify({ model: "qwen2.5:7b", choices: [{ message: { content: r }, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20 } }), { status: 200 });
  }) as FetchLike;
  return { fetchFn, calls };
}

describe("OpenAICompatibleProvider", () => {
  const req = { feature: "draft-objectives", system: "Draft.", user: "Features: a, b", schema: Answer };

  it("sends the schema and parses a clean answer", async () => {
    const { fetchFn, calls } = server(['{"title":"Ship it","score":8}']);
    const p = new OpenAICompatibleProvider({ baseUrl: "http://ollama:11434/v1/", model: "qwen2.5:7b", fetch: fetchFn });
    const res = await p.complete(req);
    expect(res.data).toEqual({ title: "Ship it", score: 8 });
    expect(res).toMatchObject({ model: "qwen2.5:7b", inputTokens: 100, outputTokens: 20 });
    expect(calls[0]!.url).toBe("http://ollama:11434/v1/chat/completions");
    const body = calls[0]!.body;
    expect(body.model).toBe("qwen2.5:7b");
    expect((body.response_format as { type: string }).type).toBe("json_schema");
    expect(String((body.messages as { content: string }[])[0]!.content)).toContain('"score"');
    expect(p.name).toBe("openai-compatible:qwen2.5:7b@ollama:11434");
  });

  it("strips fences and prose, and retries once with the validation errors", async () => {
    const { fetchFn, calls } = server(['Sure! ```json\n{"title":"x","score":42}\n```', '{"title":"x","score":9}']);
    const p = new OpenAICompatibleProvider({ baseUrl: "http://localhost:1234/v1", model: "m", fetch: fetchFn, jsonSchema: false });
    const res = await p.complete(req);
    expect(res.data.score).toBe(9);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.body.response_format).toBeUndefined();
    const retry = calls[1]!.body.messages as { role: string; content: string }[];
    expect(retry.at(-1)!.content).toMatch(/score: /);
    expect(res.inputTokens).toBe(200);
  });

  it("gives up after the retry and surfaces server errors by cause", async () => {
    const bad = server(["not json", "still not json"]);
    await expect(new OpenAICompatibleProvider({ baseUrl: "http://x/v1", model: "m", fetch: bad.fetchFn }).complete(req)).rejects.toMatchObject({ code: "UNPARSEABLE" });
    const missing = server([{ status: 404, body: { error: { message: "model not found" } } }]);
    await expect(new OpenAICompatibleProvider({ baseUrl: "http://x/v1", model: "llama3.2", fetch: missing.fetchFn }).complete(req)).rejects.toThrow(/ollama pull llama3.2/);
    const down = { fetchFn: (async () => { throw new Error("ECONNREFUSED"); }) as unknown as FetchLike };
    await expect(new OpenAICompatibleProvider({ baseUrl: "http://x/v1", model: "m", fetch: down.fetchFn }).complete(req)).rejects.toBeInstanceOf(AssistError);
    const cut = { fetchFn: (async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"title":' }, finish_reason: "length" }] }), { status: 200 })) as unknown as FetchLike };
    await expect(new OpenAICompatibleProvider({ baseUrl: "http://x/v1", model: "m", fetch: cut.fetchFn }).complete(req)).rejects.toThrow(/cut off/);
  });

  it("parseJson finds the object inside noise", () => {
    expect(parseJson('Here: {"a":1} done')).toEqual({ ok: true, value: { a: 1 } });
    expect(parseJson("")).toMatchObject({ ok: false });
  });
});
