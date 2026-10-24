// Which client address a request comes from, behind Traefik and (optionally) Cloudflare.
//
// The address chain is read from the socket outwards: the socket is Traefik on the Docker
// network (a private address), the next hop may be a Cloudflare edge, and the first address
// that is neither is the client. Nothing a client writes into X-Forwarded-For can move that
// point, because only private sockets and Cloudflare ranges are trusted. When the chain ends
// at a Cloudflare edge (Traefik dropped the earlier hops), Cloudflare's own CF-Connecting-IP
// names the client: that edge really sent the request, so the header is Cloudflare's.

import { BlockList, isIP } from "node:net";

/** Cloudflare's published ranges (cloudflare.com/ips). TRAINYARD_TRUSTED_PROXIES replaces them. */
export const CLOUDFLARE_RANGES = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];
const PRIVATE_RANGES = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "100.64.0.0/10", "::1/128", "fc00::/7", "fe80::/10"];

const blockOf = (ranges: string[]) => {
  const list = new BlockList();
  for (const r of ranges) {
    const [net, bits] = r.trim().split("/");
    const family = isIP(net ?? "");
    if (!family || !bits) continue;
    list.addSubnet(net!, Number(bits), family === 6 ? "ipv6" : "ipv4");
  }
  return list;
};
const plain = (addr: string) => addr.replace(/^::ffff:/, "");
const has = (list: BlockList, addr: string) => {
  const a = plain(addr);
  const family = isIP(a);
  return family ? list.check(a, family === 6 ? "ipv6" : "ipv4") : false;
};

export interface ProxyTrust {
  /** For Fastify's trustProxy: hop 0 is the socket, 1 the next address out, and so on. */
  trust: (addr: string, hop: number) => boolean;
  /** True when the address is one of the edge proxies (Cloudflare by default). */
  isEdge: (addr: string) => boolean;
}

export function proxyTrust(edges: string[] = CLOUDFLARE_RANGES): ProxyTrust {
  const priv = blockOf(PRIVATE_RANGES);
  const edge = blockOf(edges);
  return {
    trust: (addr, hop) => (hop === 0 ? has(priv, addr) || has(edge, addr) : has(edge, addr)),
    isEdge: (addr) => has(edge, addr),
  };
}

/** The client address: req.ip, or Cloudflare's header when req.ip is itself a Cloudflare edge. */
export function clientIp(req: { ip: string; headers: Record<string, string | string[] | undefined> }, t: ProxyTrust | null): string {
  if (!t || !t.isEdge(req.ip)) return plain(req.ip);
  const cf = req.headers["cf-connecting-ip"];
  const v = (Array.isArray(cf) ? cf[0] : cf)?.trim();
  return v && isIP(v) ? plain(v) : plain(req.ip);
}
