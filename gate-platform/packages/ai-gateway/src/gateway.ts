import { createHash } from "node:crypto";
import { redact, restore } from "./redact.js";
import type {
  AuditSink, BudgetStore, LlmProvider, LlmRequest, LlmResponse, ProviderKind, SecretResolver, TenantAiConfig, TenantAiConfigStore,
} from "./types.js";

export class AiGatewayError extends Error {
  override readonly name = "AiGatewayError";
  constructor(readonly code: "BUDGET_EXCEEDED" | "FEATURE_DISABLED" | "PROVIDER_UNAVAILABLE" | "REFUSED", message: string) {
    super(message);
  }
}

export type ProviderFactory = (config: TenantAiConfig, apiKey: string | undefined) => LlmProvider;

export interface AiGatewayDeps {
  configs: TenantAiConfigStore;
  budgets: BudgetStore;
  audit: AuditSink;
  secrets: SecretResolver;
  /** Builds a provider for a tenant config. The default provider is Anthropic first-party. */
  providerFactory: ProviderFactory;
  defaults: Pick<TenantAiConfig, "provider" | "model" | "fastModel" | "monthlyTokenBudget" | "enabledFeatures">;
  now?: () => Date;
}

export const DEFAULT_TENANT_DEFAULTS: AiGatewayDeps["defaults"] = {
  provider: "anthropic",
  model: "claude-opus-5-5",
  fastModel: "claude-haiku-5-5",
  monthlyTokenBudget: 5_000_000,
  enabledFeatures: ["*"],
};

const EFFORT_BY_TIER = { reasoning: "high", fast: "low" } as const;
const MAX_TOKENS_BY_TIER = { reasoning: 16_000, fast: 2_048 } as const;

/**
 * Every product feature calls the gateway, never a vendor SDK directly.
 * The gateway resolves the tenant's model, enforces budget and feature
 * policy, redacts PII, calls the provider, restores tokens, and audits.
 */
export class AiGateway {
  private readonly now: () => Date;
  constructor(private readonly deps: AiGatewayDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async configFor(tenantId: string): Promise<TenantAiConfig> {
    return (await this.deps.configs.get(tenantId)) ?? { tenantId, ...this.deps.defaults };
  }

  async complete<T>(req: LlmRequest<T>): Promise<LlmResponse<T>> {
    const config = await this.configFor(req.tenantId);
    if (!config.enabledFeatures.includes("*") && !config.enabledFeatures.includes(req.feature)) {
      throw new AiGatewayError("FEATURE_DISABLED", `feature ${req.feature} is disabled for tenant ${req.tenantId}`);
    }
    const month = this.now().toISOString().slice(0, 7);
    const used = await this.deps.budgets.consumed(req.tenantId, month);
    if (used >= config.monthlyTokenBudget) {
      throw new AiGatewayError("BUDGET_EXCEEDED", `tenant ${req.tenantId} used ${used}/${config.monthlyTokenBudget} tokens this month`);
    }

    const apiKey = config.apiKeyRef ? await this.deps.secrets.resolve(config.apiKeyRef) : undefined;
    const provider = this.deps.providerFactory(config, apiKey);

    const map = new Map<string, string>();
    const system = redact(req.system, map).text;
    const messages = req.messages.map((m) => ({ role: m.role, content: redact(m.content, map).text }));

    const started = Date.now();
    let response: LlmResponse<T>;
    try {
      response = await provider.complete<T>({
        model: req.tier === "fast" ? config.fastModel : config.model,
        system,
        messages,
        ...(req.schema ? { schema: req.schema } : {}),
        effort: req.effort ?? EFFORT_BY_TIER[req.tier],
        maxTokens: req.maxTokens ?? MAX_TOKENS_BY_TIER[req.tier],
      });
    } catch (err) {
      throw new AiGatewayError("PROVIDER_UNAVAILABLE", `${provider.kind} failed: ${(err as Error).message}`);
    }

    const tokens = response.usage.inputTokens + response.usage.outputTokens;
    await this.deps.budgets.add(req.tenantId, month, tokens);
    await this.deps.audit.write({
      at: this.now(),
      tenantId: req.tenantId,
      feature: req.feature,
      provider: provider.kind,
      model: response.model,
      promptHash: createHash("sha256").update(system + "\n" + messages.map((m) => m.content).join("\n")).digest("hex"),
      usage: response.usage,
      refused: response.refused,
      durationMs: Date.now() - started,
    });

    return {
      ...response,
      text: restore(response.text, map),
      ...(response.parsed !== undefined ? { parsed: restoreDeep(response.parsed, map) } : {}),
    };
  }
}

function restoreDeep<T>(value: T, map: Map<string, string>): T {
  if (typeof value === "string") return restore(value, map) as T;
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, map)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, restoreDeep(v, map)])) as T;
  }
  return value;
}

// ---------- In-memory implementations for dev/tests ----------

export class InMemoryTenantAiConfigStore implements TenantAiConfigStore {
  private readonly m = new Map<string, TenantAiConfig>();
  async get(id: string) { return this.m.get(id); }
  async set(c: TenantAiConfig) { this.m.set(c.tenantId, c); }
}
export class InMemoryBudgetStore implements BudgetStore {
  private readonly m = new Map<string, number>();
  async consumed(t: string, month: string) { return this.m.get(`${t}:${month}`) ?? 0; }
  async add(t: string, month: string, n: number) { this.m.set(`${t}:${month}`, (this.m.get(`${t}:${month}`) ?? 0) + n); }
}
export class InMemoryAuditSink implements AuditSink {
  readonly records: Parameters<AuditSink["write"]>[0][] = [];
  async write(r: Parameters<AuditSink["write"]>[0]) { this.records.push(r); }
}
export class EnvSecretResolver implements SecretResolver {
  async resolve(ref: string) {
    const v = process.env[ref];
    if (!v) throw new Error(`secret ${ref} is not set`);
    return v;
  }
}

export function providerKindLabel(kind: ProviderKind): string {
  return { anthropic: "Anthropic", "anthropic-bedrock": "Claude on Amazon Bedrock", "anthropic-vertex": "Claude on Vertex AI", "openai-compatible": "OpenAI-compatible endpoint" }[kind];
}
