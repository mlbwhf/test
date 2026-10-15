import type { LlmProvider, LlmResponse, ProviderRequest } from "../types.js";

/**
 * Adapter for tenants that bring their own OpenAI-compatible endpoint
 * (vLLM, Ollama, Azure OpenAI, etc.). Uses the chat completions shape.
 * Structured output is requested via JSON mode and validated locally.
 */
export class OpenAICompatibleProvider implements LlmProvider {
  readonly kind = "openai-compatible" as const;
  constructor(
    private readonly opts: { baseUrl: string; apiKey?: string; fetch?: typeof fetch },
  ) {}

  async complete<T>(req: ProviderRequest<T>): Promise<LlmResponse<T>> {
    const f = this.opts.fetch ?? fetch;
    const res = await f(`${this.opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.opts.apiKey ? { authorization: `Bearer ${this.opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens,
        messages: [{ role: "system", content: req.system }, ...req.messages],
        ...(req.schema ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`openai-compatible endpoint returned ${res.status}`);
    const body = (await res.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const refused = body.choices?.[0]?.finish_reason === "content_filter";
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
      model: body.model ?? req.model,
      provider: this.kind,
      usage: { inputTokens: body.usage?.prompt_tokens ?? 0, outputTokens: body.usage?.completion_tokens ?? 0 },
    };
  }
}
