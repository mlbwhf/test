import { llmsFullText } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** The whole public site as one text file, for language models and their crawlers. */
export function GET() {
  return new Response(llmsFullText(siteUrl()), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
