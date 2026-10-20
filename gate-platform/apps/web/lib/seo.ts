// Canonical origins and structured-data helpers for search engines and AI crawlers.

const domain = () => (process.env.GATE_DOMAIN ?? "enrollclass.com").toLowerCase();

/** The marketing site (home, FAQ, help, legal): the canonical host for shared content. */
export const siteUrl = () => `https://${domain()}`;
/** The app host, where public course pages live. */
export const appUrl = () => `https://app.${domain()}`;
/** API host (docs, MCP endpoint, widget). */
export const apiUrl = () => (process.env.GATE_PUBLIC_API_URL ?? `https://api.${domain()}`).replace(/\/+$/, "");

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export const ORGANIZATION_LD = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl()}/#organization`,
  name: "EnrollClass",
  url: siteUrl(),
  logo: `${siteUrl()}/icon.svg`,
  email: "support@enrollclass.com",
});
