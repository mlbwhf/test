// Provider for any OpenAI-compatible chat endpoint: Ollama, vLLM, LM Studio, llama.cpp,
// LocalAI, or a hosted service. This is how AI assistance runs with no paid key, on the
// same box as the API. Quality and speed depend on the model; on a CPU-only VPS a 3–8B
// model answers in tens of seconds and sometimes misses the schema, so every answer is
// validated and the request is retried once with the validation errors.

import { z } from "zod";
import { AssistError, type AssistProvider, type AssistRequest, type AssistResult } from "./provider.js";

export type FetchLike = typeof fetch;

export interface OpenAICompatibleOptions {
  /** Base URL ending in /v1, e.g. http://ollama:11434/v1 or http://localhost:1234/v1. */
  baseUrl: string;
  model: string;
  apiKey?: string;
  /** Ask for JSON Schema-constrained output. Ollama and vLLM support it; set false for servers that reject response_format. */
  jsonSchema?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
  fetch?: FetchLike;
}

interface ChatResponse {
  model?: string;
  choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

const GROUND_RULES = `You help a scaled agile planning team. Work only from the data in the message: never invent items, people, numbers or dates that are not there. Be concrete and brief. People stay accountable for decisions; you draft, they decide. Answer with a single JSON object that matches the requested schema exactly, with no markdown fences and no text before or after it.`;

export class OpenAICompatibleProvider implements AssistProvider {
  readonly name: string;
  private readonly fetchFn: FetchLike;
  private readonly base: string;

  constructor(private readonly opts: OpenAICompatibleOptions) {
    this.base = opts.baseUrl.replace(/\/+$/, "");
    this.fetchFn = opts.fetch ?? fetch;
    this.name = `openai-compatible:${opts.model}@${new URL(this.base).host}`;
  }

  async complete<T>(req: AssistRequest<T>): Promise<AssistResult<T>> {
    const schema = z.toJSONSchema(req.schema, { target: "draft-7", unrepresentable: "any" });
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: `${GROUND_RULES}\n\n${req.system}\n\nJSON schema for the answer:\n${JSON.stringify(schema)}` },
      { role: "user", content: req.user },
    ];
    let lastError = "";
    let usage = { input: 0, output: 0 };
    let model = this.opts.model;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        messages.push({ role: "assistant", content: lastError.slice(0, 4000) });
        messages.push({ role: "user", content: `That answer did not match the schema. Return only a corrected JSON object. Problems:\n${lastError}` });
      }
      const res = await this.chat(messages, this.opts.jsonSchema === false ? undefined : { type: "json_schema", json_schema: { name: req.feature.replace(/[^a-zA-Z0-9_-]/g, "_"), schema, strict: false } });
      usage = { input: usage.input + (res.usage?.prompt_tokens ?? 0), output: usage.output + (res.usage?.completion_tokens ?? 0) };
      model = res.model ?? model;
      const choice = res.choices?.[0];
      if (choice?.message?.refusal) throw new AssistError("REFUSED", choice.message.refusal);
      const text = choice?.message?.content ?? "";
      if (choice?.finish_reason === "length") throw new AssistError("UNPARSEABLE", "The answer was cut off; try with less data or a larger max_tokens.");
      const parsed = parseJson(text);
      if (parsed.ok) {
        const checked = req.schema.safeParse(parsed.value);
        if (checked.success) return { data: checked.data, model, inputTokens: usage.input, outputTokens: usage.output };
        lastError = `${text}\n\nValidation errors: ${checked.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ")}`;
      } else {
        lastError = `${text}\n\nNot valid JSON: ${parsed.error}`;
      }
    }
    throw new AssistError("UNPARSEABLE", "The model's answer did not match the expected shape after a retry.");
  }

  private async chat(messages: unknown[], response_format: unknown): Promise<ChatResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 120_000);
    let res: Response;
    try {
      res = await this.fetchFn(`${this.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(this.opts.apiKey ? { Authorization: `Bearer ${this.opts.apiKey}` } : {}) },
        body: JSON.stringify({ model: this.opts.model, messages, max_tokens: this.opts.maxTokens ?? 4000, temperature: 0.2, ...(response_format ? { response_format } : {}) }),
        signal: controller.signal,
      });
    } catch (e) {
      throw new AssistError("PROVIDER", `Could not reach the local model at ${this.base}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
    const body = (await res.json().catch(() => ({}))) as ChatResponse;
    if (res.status === 401 || res.status === 403) throw new AssistError("PROVIDER", "The model server rejected the API key.");
    if (res.status === 404) throw new AssistError("PROVIDER", `Model "${this.opts.model}" is not available at ${this.base}. With Ollama, run: ollama pull ${this.opts.model}`);
    if (res.status === 429) throw new AssistError("PROVIDER", "The model server is busy; try again shortly.");
    if (!res.ok) throw new AssistError("PROVIDER", `Model server error ${res.status}: ${body.error?.message ?? ""}`.trim());
    return body;
  }
}

/** Small models sometimes wrap JSON in fences or prose; take the outermost object. */
export function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const candidates = [trimmed];
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
  let error = "empty answer";
  for (const c of candidates) {
    if (!c) continue;
    try {
      return { ok: true, value: JSON.parse(c) };
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error };
}
