import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { LlmProvider, LlmResponse, ProviderKind, ProviderRequest } from "../types.js";

/** The subset of the SDK client the adapter uses; lets tests inject a fake. */
export interface AnthropicLike {
  beta: { messages: { create: (params: Record<string, unknown>) => Promise<unknown> } };
}

export interface AnthropicProviderOptions {
  client?: AnthropicLike;
  apiKey?: string;
  kind?: ProviderKind;
}

/**
 * Anthropic first-party adapter. Requests run with adaptive thinking (the
 * default on current models), explicit effort, structured outputs when a
 * schema is given, and server-side refusal fallbacks so a safety decline
 * degrades to a fallback model inside the same call instead of erroring.
 */
export class AnthropicProvider implements LlmProvider {
  readonly kind: ProviderKind;
  private readonly client: AnthropicLike;

  constructor(opts: AnthropicProviderOptions = {}) {
    this.kind = opts.kind ?? "anthropic";
    this.client = opts.client ?? (new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {}) as unknown as AnthropicLike);
  }

  async complete<T>(req: ProviderRequest<T>): Promise<LlmResponse<T>> {
    const params: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens,
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      output_config: {
        effort: req.effort,
        ...(req.schema ? { format: zodOutputFormat(req.schema) } : {}),
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    };
    const raw = (await this.client.beta.messages.create(params)) as AnthropicMessageShape;

    const text = (raw.content ?? [])
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("");
    const refused = raw.stop_reason === "refusal";
    let parsed: T | undefined;
    if (!refused && req.schema && text) {
      const result = req.schema.safeParse(JSON.parse(text));
      if (!result.success) throw new Error(`structured output failed validation: ${result.error.message}`);
      parsed = result.data;
    }
    return {
      text,
      ...(parsed !== undefined ? { parsed } : {}),
      refused,
      ...(raw.stop_details?.category ? { refusalCategory: raw.stop_details.category } : {}),
      model: raw.model ?? req.model,
      provider: this.kind,
      usage: {
        inputTokens: raw.usage?.input_tokens ?? 0,
        outputTokens: raw.usage?.output_tokens ?? 0,
        ...(raw.usage?.cache_read_input_tokens !== undefined ? { cacheReadInputTokens: raw.usage.cache_read_input_tokens } : {}),
      },
    };
  }
}

interface AnthropicMessageShape {
  model?: string;
  stop_reason?: string;
  stop_details?: { category?: string | null } | null;
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number };
}
