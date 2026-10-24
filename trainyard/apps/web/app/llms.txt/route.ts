import { llmsText } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** llms.txt: what Trainyard is and where everything lives, generated from the same data as the pages so it never goes stale. */
export function GET() {
  return new Response(llmsText(siteUrl()), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
