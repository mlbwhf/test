# Security

How Trainyard is protected, what you must do when you host it, and how to report a problem.

## Reporting

Email security@agile-agilist.com with the steps to reproduce. You will get an answer within three working days. Please do not open a public issue for a vulnerability until a fix has shipped.

## What the software does

**Access**

- Every request to `/v1/*` needs an API key once the first user exists or `TRAINYARD_ADMIN_KEY` is set. In production the API refuses to start open.
- Keys are 192-bit random, stored as SHA-256 hashes and compared in constant time. Roles: admin, planner, architect, viewer; reads are open to every role, writes are checked per permission.
- Twenty failed keys from one address lock that address out for ten minutes (429 `LOCKED_OUT`), and failures are logged with the address.
- Rate limits: 600 requests per minute per key or address by default (`TRAINYARD_RATE_LIMIT`), 30 per minute on AI routes. Over the limit returns 429 `RATE_LIMITED`.
- Request bodies are capped at 8 MB (413 `TOO_LARGE`).
- Behind Traefik the API trusts `X-Forwarded-For`, so limits and logs use the real client address. Set `TRAINYARD_TRUST_PROXY=1` for any other proxy, and never expose the API port directly when that is on.

**Secrets at rest**

- Tokens for Miro, Mural, monday.com and Trello are sealed with AES-256-GCM under `TRAINYARD_SECRET` before they are stored; the API never returns them.
- Jira and Azure DevOps credentials live only in environment variables.
- Every mutation is written with a version and an append-only audit entry naming the actor.

**Browser**

- A Content Security Policy with a per-request nonce and `strict-dynamic`: scripts only from the app itself, connections only to the app and its API, no framing, no plugins, no inline event handlers.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, HSTS for a year, `Cross-Origin-Opener-Policy: same-origin`, no `X-Powered-By`.
- The API sends `default-src 'none'` and the same transport headers; CORS is limited to the web app's origin in production.
- The API key lives in the browser's localStorage and is only ever sent to the API host. Sign-out removes it.

**AI assistance**

- Prompts carry titles, numbers and ids. People are referred to by role, never by name or email.
- Text from boards (typed by participants or imported from another tool) is passed as data with an instruction not to follow anything inside it, and every answer is validated against a schema before it is shown. Nothing is written to the plan until a person accepts a draft.
- Model calls have the tighter rate limit above and are off until you configure a provider.

**Containers**

- Images run as the unprivileged `node` user with `no-new-privileges`, all Linux capabilities dropped, memory limits, and (API) a read-only root filesystem.
- Postgres is on a private network with no published port. Only Traefik reaches the API and web containers.
- Weekly Dependabot updates for npm, GitHub Actions and base images. CI fails on a high or critical advisory in production dependencies.

## What you must do when hosting

1. Set `TRAINYARD_ADMIN_KEY`, `TRAINYARD_SECRET`, `TRAINYARD_WEBHOOK_SECRET` and `POSTGRES_PASSWORD` to long random values (`first-run.sh` generates them) and keep `.env` at mode 600.
2. Sign in with the admin key once, create named users, and keep the admin key for recovery only.
3. Terminate TLS at Traefik with a real certificate. HSTS is sent, so plain HTTP will not work afterwards.
4. Turn on backups (`BACKUP_S3_BUCKET` and a passphrase) and test a restore.
5. Keep the deploy SSH key out of the repository; GitHub holds it as a secret.
6. Review `/v1/audit` when something looks wrong. It records who changed what and when.

## Known limits

- Sign-in is by API key, not SSO. OIDC/SAML is on the roadmap.
- There is one workspace per server.
- The lockout and rate limits are held in memory per API process, which is fine for one instance and needs a shared store for several.
