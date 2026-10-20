import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getMe } from "@/lib/console-data";
import { publicApiUrl } from "@/lib/urls";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { createApiKeyAction, createWebhookAction, revokeApiKeyAction, testWebhookAction, toggleWebhookAction } from "@/app/integration-actions";
import { HelpLink } from "@/components/help-link";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  "order.paid": "Order paid",
  "order.refunded": "Order refunded",
  "seat.cancelled": "Seat cancelled",
  "seat.transferred": "Seat moved to another date",
  "seat.substituted": "Attendee substituted",
  "checkin.created": "Checked in",
  "event.created": "Class created",
  "event.published": "Class published",
  "cohort.at_risk": "Class below minimum",
  "cohort.cancelled": "Class cancelled",
  "certificate.issued": "Certificate issued",
  "waitlist.offered": "Waitlist seat offered",
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never");

export default async function IntegrationsPage() {
  const me = await getMe();
  if (!me.ok || !me.data.permissions.includes("settings")) redirect("/dashboard");
  const [keysRes, hooksRes] = await Promise.all([api.listApiKeys(), api.listWebhooks()]);
  const hooks = hooksRes.ok ? hooksRes.data.items : [];
  const deliveries = await Promise.all(hooks.map((h) => api.listDeliveries(h.id)));
  const apiUrl = publicApiUrl();
  const mcpUrl = `${apiUrl}/mcp`;
  const claudeCode = `claude mcp add --transport http enrollclass ${mcpUrl} --header "Authorization: Bearer YOUR_KEY"`;
  const desktopJson = JSON.stringify({ mcpServers: { enrollclass: { command: "npx", args: ["-y", "mcp-remote", mcpUrl, "--header", "Authorization: Bearer YOUR_KEY"] } } }, null, 2);

  return (
    <div className="ints">
      <div className="page-header">
        <h1>
          Integrations <HelpLink slug="api-keys" />
        </h1>
        <span className="today-date">Connect AI assistants, Zapier, Make, n8n or your own code</span>
      </div>

      <section className="card" aria-labelledby="keys-title">
        <h2 id="keys-title">API keys</h2>
        <p className="hint">Each tool gets its own key so you can revoke one without breaking the others. Read-only keys can look but not change anything. Keys act as an admin: no team or key management.</p>
        <ActionForm action={createApiKeyAction} submitLabel="Create key" pendingLabel="Creating…" wide>
          <div className="fields-row">
            <label>
              Name
              <input name="name" placeholder="e.g. Zapier, Claude, Reports" maxLength={80} required />
            </label>
            <fieldset className="ints-access">
              <legend>Access</legend>
              <label>
                <input type="radio" name="access" value="full" defaultChecked /> Full
              </label>
              <label>
                <input type="radio" name="access" value="read" /> Read only
              </label>
            </fieldset>
          </div>
        </ActionForm>
        {!keysRes.ok ? (
          <ApiNotice failure={keysRes.error} />
        ) : keysRes.data.items.length > 0 ? (
          <ul className="ints-list">
            {keysRes.data.items.map((k) => (
              <li key={k.id} className={k.revokedAt ? "is-off" : ""}>
                <div>
                  <strong>{k.name}</strong>
                  <span className="mono muted">
                    {k.prefix}… · {k.access === "read" ? "read only" : "full access"} · last used {when(k.lastUsedAt)}
                  </span>
                </div>
                {k.revokedAt ? (
                  <span className="chip">Revoked</span>
                ) : (
                  <ActionForm action={revokeApiKeyAction} submitLabel="Revoke" pendingLabel="…" variant="danger" inline>
                    <input type="hidden" name="id" value={k.id} />
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card" aria-labelledby="mcp-title">
        <h2 id="mcp-title">AI assistants (MCP)</h2>
        <p className="hint">
          Let Claude or any MCP-capable assistant read your Today view, check fill rates, duplicate classes, check people in and issue certificates. It uses an API key, so a read-only key keeps it to questions. Money moves (refunds) come back as proposals for you to approve.
        </p>
        <div className="ints-snippet">
          <span>Server URL</span>
          <code>{mcpUrl}</code>
          <CopyButton text={mcpUrl} label="Copy" />
        </div>
        <div className="ints-snippet">
          <span>Claude Code</span>
          <code>{claudeCode}</code>
          <CopyButton text={claudeCode} label="Copy" />
        </div>
        <details className="ints-more">
          <summary>Claude Desktop, Cursor and others</summary>
          <p className="hint">Add this to the app&apos;s MCP configuration and replace YOUR_KEY:</p>
          <pre>{desktopJson}</pre>
          <CopyButton text={desktopJson} label="Copy configuration" />
        </details>
      </section>

      <section className="card" aria-labelledby="hooks-title">
        <h2 id="hooks-title">Webhooks</h2>
        <p className="hint">
          EnrollClass POSTs a JSON message to your URL when something happens, signed with the webhook&apos;s secret (header <code>EnrollClass-Signature</code>). Failed deliveries are retried for about 6 minutes.
        </p>
        <ActionForm action={createWebhookAction} submitLabel="Add webhook" pendingLabel="Adding…" wide>
          <div className="fields-row">
            <label>
              URL
              <input name="url" type="url" placeholder="https://hooks.zapier.com/hooks/catch/…" required />
            </label>
            <label>
              Label (optional)
              <input name="description" placeholder="e.g. Zapier → Google Sheets" maxLength={200} />
            </label>
          </div>
          <fieldset className="ints-events">
            <legend>Send these events</legend>
            {(hooksRes.ok ? hooksRes.data.events : Object.keys(EVENT_LABELS)).map((e) => (
              <label key={e}>
                <input type="checkbox" name="events" value={e} defaultChecked={e === "order.paid"} /> {EVENT_LABELS[e] ?? e} <span className="mono muted">{e}</span>
              </label>
            ))}
          </fieldset>
        </ActionForm>
        {!hooksRes.ok && <ApiNotice failure={hooksRes.error} />}
        {hooks.length > 0 && (
          <ul className="ints-list">
            {hooks.map((h, i) => {
              const log = deliveries[i]?.ok ? deliveries[i].data.items : [];
              return (
                <li key={h.id} className={h.enabled ? "" : "is-off"}>
                  <div>
                    <strong>{h.description ?? h.url}</strong>
                    <span className="mono muted ints-url">{h.url}</span>
                    <span className="muted">{h.events.map((e) => EVENT_LABELS[e] ?? e).join(" · ")}</span>
                    <details className="ints-more">
                      <summary>Signing secret and recent deliveries</summary>
                      <div className="ints-snippet">
                        <span>Secret</span>
                        <code>{h.secret}</code>
                        <CopyButton text={h.secret} label="Copy" />
                      </div>
                      {log.length === 0 ? (
                        <p className="muted">No deliveries yet.</p>
                      ) : (
                        <ul className="ints-log">
                          {log.slice(0, 10).map((d) => (
                            <li key={d.id}>
                              <span className={`chip ${d.status === "succeeded" ? "chip-ok" : d.status === "failed" ? "chip-err" : ""}`}>{d.status === "succeeded" ? `${d.responseStatus}` : d.status === "failed" ? "failed" : "sending"}</span>
                              <span className="mono">{d.type}</span>
                              <span className="muted">
                                {when(d.createdAt)}
                                {d.attempts > 1 ? ` · ${d.attempts} tries` : ""}
                                {d.error ? ` · ${d.error}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </div>
                  <div className="ints-actions">
                    <ActionForm action={testWebhookAction} submitLabel="Send test" pendingLabel="Sending…" inline>
                      <input type="hidden" name="id" value={h.id} />
                    </ActionForm>
                    <ActionForm action={toggleWebhookAction} submitLabel={h.enabled ? "Pause" : "Turn on"} pendingLabel="…" inline>
                      <input type="hidden" name="id" value={h.id} />
                      <input type="hidden" name="enabled" value={h.enabled ? "0" : "1"} />
                    </ActionForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="auto-title">
        <h2 id="auto-title">Zapier, Make and n8n</h2>
        <div className="ints-recipes">
          <div>
            <strong>Zapier</strong>
            <p>Trigger: <em>Webhooks by Zapier → Catch Hook</em>, paste its URL above. Actions: <em>Webhooks by Zapier → Custom Request</em> to {apiUrl}/v1/… with header <code>Authorization: Bearer YOUR_KEY</code>.</p>
          </div>
          <div>
            <strong>Make</strong>
            <p>Trigger: <em>Webhooks → Custom webhook</em>, paste its address above. Actions: <em>HTTP → Make a request</em> with the same Authorization header.</p>
          </div>
          <div>
            <strong>n8n</strong>
            <p>Trigger: the <em>Webhook</em> node (production URL above). Actions: <em>HTTP Request</em> with Header Auth (Authorization: Bearer YOUR_KEY).</p>
          </div>
        </div>
        <p className="hint">
          Every endpoint is listed in the API reference:{" "}
          <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
            {apiUrl.replace(/^https?:\/\//, "")}/docs
          </a>
          .
        </p>
      </section>
    </div>
  );
}
