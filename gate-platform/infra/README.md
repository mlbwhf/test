# Deploying EnrollClass

Target: one Hostinger KVM VPS (Ubuntu 24.04, "Docker and Traefik" template) running the
API, the web app and Postgres behind the Traefik that the template already installed.
Images are built by GitHub Actions and pushed to GitHub Container Registry.

```
infra/docker/Dockerfile.api            Fastify API + scheduler + widget bundle
infra/docker/Dockerfile.web            Next.js dashboard and learner portal (standalone)
infra/compose/docker-compose.prod.yml  postgres, api, web, optional nightly backup
infra/compose/.env.production.example  every runtime variable, with which ones are secret
infra/scripts/server-setup.sh          one-time hardening (ufw, fail2ban, swap, deploy user)
infra/scripts/detect-traefik.sh        prints the Traefik network/entrypoint/resolver names
infra/scripts/deploy.sh                pull, roll, wait for /health (used by CI and by hand)
infra/scripts/bootstrap-tenant.sh      create the first organization, print its API key
.github/workflows/gate-deploy.yml      test, build, push images, roll the VPS over SSH
```

## 1. DNS

Create two A records at your DNS provider, both pointing at the VPS public IP:

| Name | Serves |
|---|---|
| `api.enrollclass.com` | REST API, OpenAPI docs at `/docs`, Stripe webhook, embeddable widget |
| `app.enrollclass.com` | organizer dashboard and learner self-service portal |

Traefik requests the Let's Encrypt certificates on the first HTTPS hit, so the records
must resolve before the first deploy. Check with `dig +short api.enrollclass.com`.

## 2. Server, once

SSH in as root and run the first-run script. It performs everything in this section
and prints what is left to fill in:

```bash
curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/scripts/first-run.sh | bash -s -- enrollclass.com "ssh-ed25519 AAAA... laptop" "ssh-ed25519 AAAA... gate-deploy"
```

The manual equivalent, if you prefer to see each step:

```bash
curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/scripts/server-setup.sh -o server-setup.sh
bash server-setup.sh
```

It opens only 22, 80 and 443, enables fail2ban and unattended security updates, adds a
2 GB swap file, rotates Docker logs, and creates a `deploy` user (docker group, your SSH
key copied from root) that owns `/opt/gate`. Password SSH logins are turned off.

Then, as `deploy`:

```bash
mkdir -p /opt/gate && cd /opt/gate
curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/compose/.env.production.example -o .env
curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/scripts/detect-traefik.sh | bash
```

Paste the three `TRAEFIK_*` lines it prints into `.env`, set `GATE_DOMAIN`, and fill the
secrets. Generate the two platform secrets on the server:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
echo "GATE_ADMIN_KEY=$(openssl rand -hex 32)"
```

`chmod 600 .env`. Leave `GATE_ORG_API_KEY` empty for now.

## 3. GitHub secrets

Repository Settings > Secrets and variables > Actions:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | VPS IP or `api.enrollclass.com` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | a new private key generated only for Actions (`ssh-keygen -t ed25519 -f gate-deploy -N ""`); put `gate-deploy.pub` in `/home/deploy/.ssh/authorized_keys` |

No application secret goes into GitHub. They live only in `/opt/gate/.env`.

## 4. First deploy

Run the `gate-deploy` workflow from the Actions tab (or push to the deploy branch). It
runs typecheck and tests, builds both images, pushes them to `ghcr.io/mlbwhf/gate-api`
and `ghcr.io/mlbwhf/gate-web`, copies the Compose file and scripts to `/opt/gate`, and
runs `deploy.sh`, which waits for the API health check.

Verify:

```bash
curl -s https://api.enrollclass.com/health      # {"ok":true,"payments":"stripe","env":"production"}
open https://api.enrollclass.com/docs
```

## 5. First tenant

```bash
cd /opt/gate && set -a && . ./.env && set +a
./bootstrap-tenant.sh "Agile Agilist" CA CAD
```

Copy the printed API key into `.env` as `GATE_ORG_API_KEY`, then `./deploy.sh` so the
dashboard picks it up. `https://app.enrollclass.com/dashboard` now shows the organization.

## 6. Stripe

1. Dashboard > Developers > Webhooks > Add endpoint: `https://api.enrollclass.com/v1/webhooks/stripe`,
   events `payment_intent.succeeded`, `payment_intent.payment_failed`, `refund.updated` and
   `charge.refund.updated` (the adapter ignores anything else). Put the signing secret in
   `.env` as `STRIPE_WEBHOOK_SECRET` and run `./deploy.sh`.
2. In the dashboard, Connect payments for the organization; Stripe redirects back to
   `https://app.enrollclass.com/dashboard?connect=return`.
3. Stay on test keys until Connect platform review approves the live account.

## 7. Backups

Create a bucket on Cloudflare R2 or Backblaze B2, fill the `BACKUP_*` variables, and run
`./deploy.sh`. The backup service starts automatically once `BACKUP_S3_BUCKET` is set.
Dumps are encrypted with `BACKUP_PASSPHRASE`; keep a copy of it outside the server.
Restore test, quarterly: `docker compose exec backup sh restore.sh` restores the latest
dump into the running database, so run it against a scratch Postgres, never production.

## Day two

| Task | Command (as deploy, in /opt/gate) |
|---|---|
| Logs | `docker compose logs -f api web` |
| Roll back | `GATE_API_IMAGE=ghcr.io/mlbwhf/gate-api:<old sha> GATE_WEB_IMAGE=ghcr.io/mlbwhf/gate-web:<old sha> ./deploy.sh` |
| Change a secret | edit `.env`, then `./deploy.sh` |
| Postgres shell | `docker compose exec postgres psql -U gate gate` |
| Disk | `docker system df`, `df -h /` |
| Uptime alerts | install Uptime Kuma from Hostinger's Docker Manager and monitor `https://api.enrollclass.com/health` |

Migrations run automatically when the API starts, inside a transaction per file, so a
deploy that fails a migration leaves the previous schema intact and the old container
keeps serving (Compose only replaces it after the new one is healthy).

## Leaving the VPS later

The same two images run unchanged on Fly.io, Render or ECS. Only `docker-compose.prod.yml`
is host-specific; `DATABASE_URL` is the one value that moves when Postgres becomes managed.
