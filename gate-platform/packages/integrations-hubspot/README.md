# @gate/integrations-hubspot

CRM sync for the EnrollClass payments platform. Exposes a provider-neutral `CrmPort`
(`upsertContact`, `upsertDeal`), a `HubSpotCrm` implementation on the HubSpot
CRM v3 REST API, an `InMemoryCrm` for tests, and `CrmSync`, which turns order
lifecycle events (`onOrderPaid`, `onOrderRefunded`) into contact and deal upserts.

No runtime dependencies; uses the global `fetch`.

```ts
import { CrmSync, HubSpotCrm } from "@gate/integrations-hubspot";

const crm = new HubSpotCrm({ accessToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN! });
const sync = new CrmSync(crm);
await sync.onOrderPaid({ /* ... */ });
```

## HubSpot setup

Create a **private app** in HubSpot (Settings → Integrations → Private Apps) and
grant it these scopes:

- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.objects.deals.read`
- `crm.objects.deals.write`

Pass its access token as `accessToken`. The token is only ever sent in the
`Authorization: Bearer` header and never appears in errors or logs.

### Custom properties

Create these custom properties in HubSpot before syncing (Settings → Properties):

| Object  | Internal name            | Type                   | Purpose                                             |
| ------- | ------------------------ | ---------------------- | --------------------------------------------------- |
| Deal    | `gate_order_id`          | Single-line text       | EnrollClass order id; used to find and update the deal     |
| Deal    | `gate_refunded_minor`    | Single-line text       | Amount refunded, in minor units                     |
| Contact | `gate_last_course`       | Single-line text       | Name of the last course the contact was booked on   |
| Contact | `gate_last_cohort_start` | Single-line text       | Start date of that cohort, `YYYY-MM-DD`             |

`CrmSync` also writes `gate_course` and `gate_cohort` on deals; create those too
if you want them, or omit them from HubSpot and HubSpot will reject the write
with a 400 `HubSpotError`.

### Deal stages

Stages are mapped to HubSpot `dealstage` ids via `stageMap`. Defaults assume the
standard sales pipeline (`registered → appointmentscheduled`, `paid → closedwon`,
`refunded`/`cancelled → closedlost`). Override `pipeline` and `stageMap` with
your own pipeline and stage ids.

### Errors and retries

Non-2xx responses throw `HubSpotError` with `status`, the response `message`, and
the parsed `body`. `429` and `5xx` responses are retried up to 3 times with
exponential backoff (100 ms base; inject `sleep` in tests). `CrmSync` never
swallows errors; the caller decides whether to retry or queue.
