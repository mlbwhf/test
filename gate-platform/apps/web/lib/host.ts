/** Whether a request came to the marketing host (enrollclass.com / www) rather than app. */
export function isMarketingHost(request: Request): boolean {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
  const domain = (process.env.GATE_DOMAIN ?? "enrollclass.com").toLowerCase();
  return host === domain || host === `www.${domain}`;
}
