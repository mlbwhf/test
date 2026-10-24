# Client addresses behind Traefik and Cloudflare

Sign-in lockouts and rate limits work per client address. In production a request reaches
the API through two proxies:

```
visitor ──▶ Cloudflare edge ──▶ Traefik (shared, on the VPS) ──▶ trainyard-api
```

## What the API does (no setting needed)

The API reads the address chain from the socket outwards (`apps/api/src/proxies.ts`):

- The socket must be a private address. That is Traefik on the Docker network.
- The next hop is trusted only if it is in Cloudflare's published ranges.
- The first address that is neither is the client.
- If the chain ends at a Cloudflare edge, Cloudflare's `CF-Connecting-IP` header names the client. This happens when Traefik dropped the earlier hops.

Nothing a visitor writes into `X-Forwarded-For` can change the result. This holds for every
Traefik setting: trusted, untrusted or `insecure`. So the steps below are about accuracy and
defence in depth, not about closing a hole.

To use another CDN, set `TRAINYARD_TRUSTED_PROXIES` to its ranges (comma-separated CIDRs).
`TRAINYARD_TRUST_PROXY=1` trusts every hop. Use it only for local development.

## 1. Check what the API sees (2 minutes)

Sign in to https://trainyard.app as a platform admin. Copy your key from Users, then run:

```bash
curl -s https://api.trainyard.app/v1/admin/client-ip -H "Authorization: Bearer <your key>"
```

Compare `clientIp` with your own address (https://ifconfig.me):

| What you see | Meaning | Action |
| --- | --- | --- |
| `clientIp` is your address | All good | Optionally do step 3 |
| `clientIp` is a `172.x`/`10.x` address | Requests reach the API without Cloudflare or Traefik in front, or production mode is off | Check that `TRAINYARD_ENV=production` is set for the API (the image sets it), and that no port is published (step 2) |
| `clientIp` is a Cloudflare address (`104.x`, `172.64–71.x`, `162.158.x`…) and `cfConnectingIp` is empty | Cloudflare is not proxying the API host | Turn the orange cloud on for `api.trainyard.app` in Cloudflare DNS |

## 2. Make sure Traefik is the only way in

The API container must not publish a port to the internet.

```bash
docker ps --format '{{.Names}}\t{{.Ports}}' | grep trainyard
```

`trainyard-api` should show `4100/tcp` with no `0.0.0.0:` in front of it. The compose file
publishes no ports, so this only changes if someone adds a `ports:` entry.

## 3. Tell Traefik to trust Cloudflare (recommended)

With this, Traefik keeps Cloudflare's `X-Forwarded-For` instead of replacing it. Its access
logs and every app behind it, EnrollClass included, then see real visitor addresses.

**Change nothing on the shared Traefik without planning the restart:** it also serves
EnrollClass. Do it in a quiet window. The change only adds trust for Cloudflare's addresses,
so it does not change routing for EnrollClass.

1. Find how the Traefik container is configured:

   ```bash
   cid=$(docker ps --format '{{.ID}} {{.Image}}' | awk 'tolower($2) ~ /traefik/ {print $1; exit}')
   docker inspect "$cid" --format '{{json .Config.Cmd}}' | tr ',' '\n' | grep -i entrypoints
   docker inspect "$cid" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
   ```

   You will see either CLI flags (`--entrypoints.websecure.address=:443`) or a mounted
   `traefik.yml`. Hostinger's template uses the Traefik project folder; look for
   `docker-compose.yml` or `traefik.yml` in it.

2. Add Cloudflare's ranges to the HTTPS entrypoint. Keep the entrypoint name you found
   (usually `websecure`). Take the current ranges from https://www.cloudflare.com/ips-v4 and
   https://www.cloudflare.com/ips-v6.

   **If the config uses CLI flags**, add one flag to the Traefik service's `command:` list.
   Put it on one line, comma-separated:

   ```yaml
   - --entrypoints.websecure.forwardedHeaders.trustedIPs=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32
   ```

   **If the config is a `traefik.yml`**:

   ```yaml
   entryPoints:
     websecure:
       address: ":443"
       forwardedHeaders:
         trustedIPs:
           - "173.245.48.0/20"
           - "103.21.244.0/22"
           # … every range from the two Cloudflare lists
   ```

   If you see `forwardedHeaders.insecure=true`, remove it. It makes Traefik trust headers
   from anyone.

3. Restart Traefik only. From the Traefik project folder:

   ```bash
   docker compose up -d
   ```

   This recreates the Traefik container only if its config changed. Then check that both
   sites answer:

   ```bash
   curl -sI https://trainyard.app | head -1
   curl -sI https://api.trainyard.app/health | head -1
   curl -sI https://<enrollclass host> | head -1
   ```

4. Run step 1 again. `clientIp` should still be your address, and `chain` should now show
   your address before the Cloudflare edge.

## 4. Optional: lock the origin to Cloudflare

Anyone who learns the VPS address can bypass Cloudflare and its DDoS and WAF protection.
To stop that, allow ports 80 and 443 only from Cloudflare's ranges in the VPS firewall
(Hostinger panel → VPS → Firewall), or use a Cloudflare Tunnel. Do this only after checking
EnrollClass is also served through Cloudflare, or it becomes unreachable directly.

Cloudflare changes its ranges rarely. Check the two lists once or twice a year and update
`CLOUDFLARE_RANGES` in `apps/api/src/proxies.ts` and the Traefik setting together.
