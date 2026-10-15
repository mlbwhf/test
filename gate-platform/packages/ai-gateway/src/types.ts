import type { z } from "zod";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
export type ProviderKind = "anthropic" | "anthropic-bedrock" | "anthropic-vertex" | "openai-compatible";

/** Per-tenant "bring your own model" configuration. Secrets are references, never values. */
export interface TenantAiConfig {
  tenantId: string;
  provider: ProviderKind;
  /** Model for reasoning-heavy features (copilot, dispute drafting). */
  model: string;
  /** Model for high-volume, low-latency features (classification, triage). */
  fastModel: string;
  /** Reference into the secrets manager (KMS/Secrets Manager key), resolved at call time. */
  apiKeyRef?: string;
  /** For openai-compatible endpoints or self-hosted models. */
  baseUrl?: string;
  region?: string;
  monthlyTokenBudget: number;
  enabledFeatures: string[];
}

export type Tier = "reasoning" | "fast";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmRequest<T = unknown> {
  tenantId: string;
  /** Feature name for audit, budgets and routing: "copilot.explain_order", "support.triage", ... */
  feature: string;
  tier: Tier;
  system: string;
  messages: LlmMessage[];
  /** When present, the response must conform; the provider is asked for structured output. */
  schema?: z.ZodType<T>;
  effort?: Effort;
  maxTokens?: number;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
}

export interface LlmResponse<T = unknown> {
  text: string;
  parsed?: T;
  refused: boolean;
  refusalCategory?: string;
  model: string;
  provider: ProviderKind;
  usage: LlmUsage;
}

/** What a provider adapter receives: already redacted, already budget-checked. */
export interface ProviderRequest<T = unknown> {
  model: string;
  system: string;
  messages: LlmMessage[];
  schema?: z.ZodType<T>;
  effort: Effort;
  maxTokens: number;
}

export interface LlmProvider {
  readonly kind: ProviderKind;
  complete<T>(req: ProviderRequest<T>): Promise<LlmResponse<T>>;
}

export interface TenantAiConfigStore {
  get(tenantId: string): Promise<TenantAiConfig | undefined>;
  set(config: TenantAiConfig): Promise<void>;
}

export interface BudgetStore {
  /** Tokens consumed by the tenant in the given month (YYYY-MM). */
  consumed(tenantId: string, month: string): Promise<number>;
  add(tenantId: string, month: string, tokens: number): Promise<void>;
}

export interface AuditRecord {
  at: Date;
  tenantId: string;
  feature: string;
  provider: ProviderKind;
  model: string;
  /** SHA-256 of the redacted prompt; raw prompts are never stored by default. */
  promptHash: string;
  usage: LlmUsage;
  refused: boolean;
  durationMs: number;
}
export interface AuditSink {
  write(record: AuditRecord): Promise<void>;
}

export interface SecretResolver {
  resolve(ref: string): Promise<string>;
}
