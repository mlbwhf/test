# Gate for Training: hosting options (Oct 2026)

What has to run: Fastify API (Node 22), Next.js dashboard, Postgres 16, the in-process
scheduler, Stripe webhooks (needs a stable public HTTPS URL), outbound calls to Stripe,
Zoom/Teams, Resend, HubSpot and Anthropic.

## Comparison

| Option | Entry price | Postgres | Regions | Ops you own | Good for |
|---|---|---|---|---|---|
| Hostinger KVM VPS | KVM1 about $5–6.50/mo, KVM2 $8.99, KVM4 $12.99, KVM8 $25.99 on 24-month terms; renewals roughly double | None managed. You run Postgres in Docker and own backups, upgrades, failover | EU (Lithuania, NL, FR, UK), US, Brazil, India, Singapore | OS patching, TLS, firewall, backups, monitoring, zero-downtime deploys | Staging, pilot, lowest cash cost |
| Fly.io | Usage based, roughly $6–8/mo for a small API machine | Managed Postgres from about $38/mo | 30+ regions including Toronto, London, Amsterdam, Johannesburg, Dubai is not a region but Bahrain and Mumbai are close | Little. Deploy from a Dockerfile, built-in TLS, private networking | Multi-region production close to Toronto, UK, EU, South Africa, Gulf |
| Render | $7/mo web service, Postgres from $7/mo, free tier sleeps | Managed, with backups | Oregon, Ohio, Virginia, Frankfurt, Singapore | Almost none | Simplest managed path, one EU region |
| Railway | Metered, roughly $10–15/mo for API plus Postgres | Managed via templates, backups are yours to schedule | US West, US East, EU West, Singapore | Almost none | Fast prototyping |
| DigitalOcean App Platform | $5/mo app, managed Postgres from $7/mo (shared) | Managed, point-in-time recovery on paid tiers | Toronto, London, Amsterdam, Frankfurt, NYC, SFO, Bangalore, Singapore, Sydney | Low | Managed plus a Toronto region |
| AWS (ECS Fargate + RDS) | $40–80/mo minimum once RDS is on | RDS, Multi-AZ, PITR | Everywhere you sell | Highest, but also the easiest story for SOC 2, PCI SAQ-A, data residency | Later, when a bank or enterprise buyer asks |

Sources: websitebuilderexpert.com (Hostinger pricing 2026), findstack.com (Hostinger VPS review),
zoutons.com and desking.app (Hostinger VPS plan tables), ramnode.com (VPS comparison),
fly.io/learn/heroku-alternatives, blog.cloud66.com (Heroku alternatives 2026), pandastack.io
(Fly alternatives), infratally.com (Render vs Railway vs Fly), techsy.io, speedtesthq.com,
livemy.app (PaaS pricing 2026). Prices move; re-check the vendor page before buying.

## Recommendation

1. **Now (pilot, Agile Agilist as first tenant):** Hostinger KVM2 (2 vCPU, 8 GB) in the Netherlands
   or Lithuania with Docker Compose (api, web, postgres, caddy for TLS). Nightly `pg_dump` to
   object storage (Cloudflare R2 or Backblaze B2). Cheapest way to run real cohorts and Stripe test
   mode. Buy 12 months, not 24, so the renewal jump does not lock you in.
2. **Production (paying tenants, card money moving):** move the API and web to Fly.io with
   regions `yyz` (Toronto) and `lhr` or `ams`, and Postgres on Neon (serverless, EU or US region,
   branching for staging) or Fly Managed Postgres. Keep Hostinger as staging. Reason: Stripe
   webhooks and payouts need an always-on, patched, monitored host, and a single VPS with
   hand-managed Postgres is the first thing a payments auditor flags.
3. **Later (bank or enterprise procurement, SOC 2 Type II):** AWS in ca-central-1 and eu-central-1
   with RDS Multi-AZ. The Dockerfile and GitHub Actions pipeline do not change.

What never changes between options: the two Docker images (api, web), one Postgres URL, the
`.env.example` variables, and the migration runner. Keep secrets in GitHub repository secrets
and the host's secret store, never in the repo.
