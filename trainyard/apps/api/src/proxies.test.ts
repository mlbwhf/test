import { describe, expect, it } from "vitest";
import { clientIp, proxyTrust } from "./proxies.js";

// Chains as Fastify walks them: the socket first, then X-Forwarded-For right to left.
const walk = (chain: string[], t = proxyTrust()) => {
  let i = 0;
  while (i < chain.length - 1 && t.trust(chain[i]!, i)) i++;
  return chain[i]!;
};

describe("client address behind Traefik and Cloudflare", () => {
  const t = proxyTrust();
  it("finds the client through Traefik and a Cloudflare edge", () => {
    expect(walk(["172.18.0.2", "162.158.10.1", "203.0.113.9"])).toBe("203.0.113.9");
  });
  it("ignores addresses a client wrote into X-Forwarded-For", () => {
    // Direct to the origin, spoofing a Cloudflare hop and a victim address.
    expect(walk(["172.18.0.2", "198.51.100.7", "162.158.10.1", "1.2.3.4"])).toBe("198.51.100.7");
    // Through Cloudflare with a forged header: Cloudflare appends the real client.
    expect(walk(["172.18.0.2", "162.158.10.1", "203.0.113.9", "1.2.3.4"])).toBe("203.0.113.9");
  });
  it("never trusts a public socket", () => {
    expect(walk(["198.51.100.7", "1.2.3.4"])).toBe("198.51.100.7");
  });
  it("uses CF-Connecting-IP only when the request really came from a Cloudflare edge", () => {
    expect(clientIp({ ip: "162.158.10.1", headers: { "cf-connecting-ip": "203.0.113.9" } }, t)).toBe("203.0.113.9");
    expect(clientIp({ ip: "198.51.100.7", headers: { "cf-connecting-ip": "1.2.3.4" } }, t)).toBe("198.51.100.7");
    expect(clientIp({ ip: "::ffff:162.158.10.1", headers: { "cf-connecting-ip": "not an ip" } }, t)).toBe("162.158.10.1");
    expect(clientIp({ ip: "10.0.0.5", headers: { "cf-connecting-ip": "1.2.3.4" } }, null)).toBe("10.0.0.5");
  });
});
