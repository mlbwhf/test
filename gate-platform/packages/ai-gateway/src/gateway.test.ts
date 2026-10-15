import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AiGateway, AiGatewayError, DEFAULT_TENANT_DEFAULTS, InMemoryAuditSink, InMemoryBudgetStore, InMemoryTenantAiConfigStore } from "./gateway.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";
import { redact, restore } from "./redact.js";
import { Copilot } from "./copilot.js";
import type { LlmProvider, ProviderRequest } from "./types.js";

describe("redact", () => {
  it("tokenizes PII reversibly and consistently", () => {
    const r = redact("Refund jane@example.com, phone +1 416 555 0199, account 12345678901234 and jane@example.com again");
    expect(r.text).not.toContain("jane@example.com");
    expect(r.text).not.toContain("12345678901234");
    expect(r.text.match(/<EMAIL_1>/g)).toHaveLength(2);
    expect(restore(r.text, r.map)).toContain("jane@example.com, phone +1 416 555 0199, account 12345678901234");
  });
});

function fakeProvider(reply: string, opts: { refused?: boolean } = {}): LlmProvider & { seen: ProviderRequest[] } {
  const seen: ProviderRequest[] = [];
  return {
    kind: "anthropic",
    seen,
    async complete<T>(req: ProviderRequest<T>) {
      seen.push(req);
      const parsed = req.schema && !opts.refused ? req.schema.parse(JSON.parse(reply)) : undefined;
      return { text: reply, ...(parsed !== undefined ? { parsed } : {}), refused: opts.refused ?? false, model: req.model, provider: "anthropic" as const, usage: { inputTokens: 100, outputTokens: 50 } };
    },
  };
}

function makeGateway(provider: LlmProvider, budget = 5_000_000) {
  const audit = new InMemoryAuditSink();
  const budgets = new InMemoryBudgetStore();
  const configs = new InMemoryTenantAiConfigStore();
  const gateway = new AiGateway({
    configs, budgets, audit,
    secrets: { resolve: async (ref) => `secret-for-${ref}` },
    providerFactory: () => provider,
    defaults: { ...DEFAULT_TENANT_DEFAULTS, monthlyTokenBudget: budget },
    now: () => new Date("2026-10-15T12:00:00Z"),
  });
  return { gateway, audit, budgets, configs };
}

describe("AiGateway", () => {
  it("routes by tier, redacts before the provider, restores after, and audits", async () => {
    const provider = fakeProvider(JSON.stringify({ category: "refund", urgency: "normal", suggestedReply: "Hi <EMAIL_1>, your refund is on its way.", needsHuman: false }));
    const { gateway, audit, budgets } = makeGateway(provider);
    const res = await new Copilot(gateway).triageSupport("org_1", "Hi, I am bob@example.com and I want my money back");
    expect(provider.seen[0]!.model).toBe("claude-haiku-5-5");
    expect(provider.seen[0]!.effort).toBe("low");
    expect(provider.seen[0]!.messages[0]!.content).not.toContain("bob@example.com");
    expect(res.parsed?.suggestedReply).toBe("Hi bob@example.com, your refund is on its way.");
    expect(audit.records[0]).toMatchObject({ tenantId: "org_1", feature: "support.triage", model: "claude-haiku-5-5", refused: false });
    expect(await budgets.consumed("org_1", "2026-10")).toBe(150);
  });

  it("uses the reasoning model for the copilot and honours tenant overrides", async () => {
    const provider = fakeProvider(JSON.stringify({ summary: "ok", lines: [], nextSteps: [] }));
    const { gateway, configs } = makeGateway(provider);
    await configs.set({ tenantId: "org_2", provider: "anthropic", model: "claude-sonnet-5-5", fastModel: "claude-haiku-5-5", monthlyTokenBudget: 1000, enabledFeatures: ["*"], apiKeyRef: "TENANT_KEY" });
    await new Copilot(gateway).explainOrder("org_1", { order: {}, ledgerEntries: [] });
    expect(provider.seen[0]!.model).toBe("claude-opus-5-5");
    expect(provider.seen[0]!.effort).toBe("high");
    await new Copilot(gateway).explainOrder("org_2", { order: {}, ledgerEntries: [] });
    expect(provider.seen[1]!.model).toBe("claude-sonnet-5-5");
  });

  it("enforces budgets and feature flags", async () => {
    const provider = fakeProvider("{}");
    const { gateway, configs } = makeGateway(provider, 10);
    await gateway.complete({ tenantId: "org_1", feature: "x", tier: "fast", system: "s", messages: [{ role: "user", content: "hi" }] });
    await expect(gateway.complete({ tenantId: "org_1", feature: "x", tier: "fast", system: "s", messages: [{ role: "user", content: "hi" }] })).rejects.toMatchObject({ code: "BUDGET_EXCEEDED" } satisfies Partial<AiGatewayError>);
    await configs.set({ tenantId: "org_3", provider: "anthropic", model: "m", fastModel: "f", monthlyTokenBudget: 100, enabledFeatures: ["support.triage"] });
    await expect(gateway.complete({ tenantId: "org_3", feature: "copilot.explain_order", tier: "fast", system: "s", messages: [] })).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
  });
});

describe("AnthropicProvider", () => {
  it("sends structured output config, effort, cache control and server-side fallbacks", async () => {
    const seen: Record<string, unknown>[] = [];
    const client = { beta: { messages: { create: async (p: Record<string, unknown>) => { seen.push(p); return { model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ a: 1 }) }], usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 8 } }; } } } };
    const provider = new AnthropicProvider({ client });
    const res = await provider.complete({ model: "claude-opus-5-5", system: "sys", messages: [{ role: "user", content: "q" }], schema: z.object({ a: z.number() }), effort: "high", maxTokens: 16_000 });
    expect(res.parsed).toEqual({ a: 1 });
    expect(res.usage.cacheReadInputTokens).toBe(8);
    const p = seen[0]!;
    expect(p.model).toBe("claude-opus-5-5");
    expect(p.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(p.fallbacks).toBe("default");
    expect((p.output_config as Record<string, unknown>).effort).toBe("high");
    expect((p.output_config as Record<string, unknown>).format).toBeDefined();
    expect((p.system as Array<Record<string, unknown>>)[0]!.cache_control).toEqual({ type: "ephemeral" });
    expect(p).not.toHaveProperty("thinking");
  });
  it("surfaces refusals instead of throwing", async () => {
    const client = { beta: { messages: { create: async () => ({ model: "claude-opus-5-5", stop_reason: "refusal", stop_details: { category: "cyber" }, content: [], usage: { input_tokens: 1, output_tokens: 0 } }) } } };
    const res = await new AnthropicProvider({ client }).complete({ model: "claude-opus-5-5", system: "s", messages: [], effort: "low", maxTokens: 100 });
    expect(res.refused).toBe(true);
    expect(res.refusalCategory).toBe("cyber");
  });
});

describe("OpenAICompatibleProvider", () => {
  it("talks chat-completions and validates JSON locally", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fakeFetch = (async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ model: "llama", choices: [{ message: { content: JSON.stringify({ a: 2 }) }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 2 } }) };
    }) as unknown as typeof fetch;
    const p = new OpenAICompatibleProvider({ baseUrl: "http://llm.internal/v1/", apiKey: "k", fetch: fakeFetch });
    const res = await p.complete({ model: "llama", system: "s", messages: [{ role: "user", content: "q" }], schema: z.object({ a: z.number() }), effort: "low", maxTokens: 100 });
    expect(calls[0]!.url).toBe("http://llm.internal/v1/chat/completions");
    expect(res.parsed).toEqual({ a: 2 });
    expect(res.provider).toBe("openai-compatible");
  });
});
