// LLM port for the facilitation features. Every call asks for a typed, schema-validated
// answer. ClaudeProvider uses the Anthropic SDK's parse helper; FakeProvider answers from a
// table so features can be tested offline; the API runs with no provider when no key is set.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export interface AssistRequest<T> {
  /** Stable name used for logging, budgets and FakeProvider lookups. */
  feature: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
}

export interface AssistResult<T> {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AssistProvider {
  readonly name: string;
  complete<T>(req: AssistRequest<T>): Promise<AssistResult<T>>;
}

export class AssistError extends Error {
  constructor(
    readonly code: "NO_PROVIDER" | "REFUSED" | "UNPARSEABLE" | "PROVIDER",
    message: string,
  ) {
    super(message);
    this.name = "AssistError";
  }
}

export const DEFAULT_MODEL = "claude-opus-5-5";

const GROUND_RULES = `You help a scaled agile planning team. Work only from the data in the message: never invent items, people, numbers or dates that are not there. Be concrete and brief. Where the data is thin, say so in the field provided rather than padding. People stay accountable for decisions; you draft, they decide.`;

export interface ClaudeProviderOptions {
  apiKey?: string;
  model?: string;
  /** low | medium | high. Facilitation drafts are routine work; medium is the default. */
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
  client?: Anthropic;
}

export class ClaudeProvider implements AssistProvider {
  readonly name: string;
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly effort: "low" | "medium" | "high";
  private readonly maxTokens: number;

  constructor(opts: ClaudeProviderOptions = {}) {
    this.client = opts.client ?? new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
    this.model = opts.model ?? DEFAULT_MODEL;
    this.effort = opts.effort ?? "medium";
    this.maxTokens = opts.maxTokens ?? 8000;
    this.name = `claude:${this.model}`;
  }

  async complete<T>(req: AssistRequest<T>): Promise<AssistResult<T>> {
    let res;
    try {
      res = await this.client.messages.parse({
        model: this.model,
        max_tokens: this.maxTokens,
        // The ground rules are the stable prefix; the feature prompt and data follow.
        system: [
          { type: "text", text: GROUND_RULES, cache_control: { type: "ephemeral" } },
          { type: "text", text: req.system },
        ],
        messages: [{ role: "user", content: req.user }],
        output_config: { effort: this.effort, format: zodOutputFormat(req.schema) },
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new AssistError("PROVIDER", "The Anthropic API key was rejected.");
      if (e instanceof Anthropic.RateLimitError) throw new AssistError("PROVIDER", "The AI provider is rate limiting requests; try again shortly.");
      if (e instanceof Anthropic.APIConnectionError) throw new AssistError("PROVIDER", "Could not reach the AI provider.");
      if (e instanceof Anthropic.APIError) throw new AssistError("PROVIDER", `AI provider error: ${e.message}`);
      throw e;
    }
    if (res.stop_reason === "refusal") {
      throw new AssistError("REFUSED", res.stop_details?.explanation ?? "The model declined this request.");
    }
    if (res.stop_reason === "max_tokens") throw new AssistError("UNPARSEABLE", "The answer was cut off; try with less data.");
    if (!res.parsed_output) throw new AssistError("UNPARSEABLE", "The model's answer did not match the expected shape.");
    return { data: res.parsed_output, model: res.model, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
  }
}

/** Answers from a table keyed by feature; the answer is validated against the schema. */
export class FakeProvider implements AssistProvider {
  readonly name = "fake";
  readonly calls: { feature: string; system: string; user: string }[] = [];

  constructor(private readonly answers: Record<string, unknown | ((user: string) => unknown)>) {}

  async complete<T>(req: AssistRequest<T>): Promise<AssistResult<T>> {
    this.calls.push({ feature: req.feature, system: req.system, user: req.user });
    const a = this.answers[req.feature];
    if (a === undefined) throw new AssistError("PROVIDER", `FakeProvider has no answer for ${req.feature}`);
    const raw = typeof a === "function" ? (a as (u: string) => unknown)(req.user) : a;
    const parsed = req.schema.safeParse(raw);
    if (!parsed.success) throw new AssistError("UNPARSEABLE", parsed.error.message);
    return { data: parsed.data, model: "fake", inputTokens: 0, outputTokens: 0 };
  }
}
