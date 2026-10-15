/** Thin typed client over the Gate REST API, used by the MCP tools. */
export interface GateClientOptions {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof fetch;
}

export class GateApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly hint?: string) {
    super(message);
  }
}

export class GateClient {
  private readonly f: typeof fetch;
  constructor(private readonly opts: GateClientOptions) {
    this.f = opts.fetch ?? fetch;
  }

  async request<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    const res = await this.f(`${this.opts.baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers: { "content-type": "application/json", "x-api-key": this.opts.apiKey, ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const err = (json as { error?: { code?: string; message?: string; hint?: string } } | null)?.error;
      throw new GateApiError(res.status, err?.code ?? "HTTP_ERROR", err?.message ?? `HTTP ${res.status}`, err?.hint);
    }
    return json as T;
  }

  me() { return this.request<{ id: string; name: string; currency: string }>("GET", "/v1/organizations/me"); }
  listCourses() { return this.request<{ items: unknown[] }>("GET", "/v1/courses"); }
  createCourse(input: { slug: string; name: string; certificationBody?: string | undefined; durationDays?: number | undefined }) { return this.request("POST", "/v1/courses", input); }
  listCohorts(courseId: string) { return this.request<{ items: unknown[] }>("GET", `/v1/courses/${encodeURIComponent(courseId)}/cohorts`); }
  createCohort(courseId: string, input: Record<string, unknown>) { return this.request("POST", `/v1/courses/${encodeURIComponent(courseId)}/cohorts`, input); }
  listSeats(eventId: string) { return this.request<{ items: Array<{ attendee: { email: string; name?: string; company?: string }; status: string; orderId: string }> }>("GET", `/v1/seats?eventId=${encodeURIComponent(eventId)}`); }
  listEvents() { return this.request<{ items: unknown[] }>("GET", "/v1/events"); }
  createEvent(input: { name: string; startsAt: string; currency?: string | undefined }) { return this.request("POST", "/v1/events", input); }
  listTicketTypes(eventId: string) { return this.request<{ items: unknown[] }>("GET", `/v1/events/${encodeURIComponent(eventId)}/ticket-types`); }
  createTicketType(eventId: string, input: { name: string; priceMinor: number; quantity: number }) { return this.request("POST", `/v1/events/${encodeURIComponent(eventId)}/ticket-types`, input); }
  quoteOrder(input: { ticketTypeId: string; quantity: number; buyerEmail: string }) { return this.request("POST", "/v1/orders?dry_run=true", input); }
  listOrders(limit = 50) { return this.request<{ items: unknown[] }>("GET", `/v1/orders?limit=${limit}`); }
  getOrder(id: string) { return this.request<{ id: string; status: string; pricing: { totalMinor: number }; refundedMinor: number; currency: string }>("GET", `/v1/orders/${encodeURIComponent(id)}`); }
  balances() { return this.request<{ accounts: Array<{ code: string; name: string; type: string; currency: string; balanceMinor: number }> }>("GET", "/v1/ledger/balances"); }
  explainOrder(orderId: string, question?: string | undefined) { return this.request("POST", "/v1/copilot/explain-order", { orderId, ...(question ? { question } : {}) }); }
}
