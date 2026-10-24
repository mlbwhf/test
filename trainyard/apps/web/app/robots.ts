import type { MetadataRoute } from "next";
import { INDEXNOW_KEY, siteUrl } from "@/lib/site";

const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot", "meta-externalagent", "Amazonbot", "DuckAssistBot", "MistralAI-User"];

// Search engines and AI assistants may read every public page and the text files written for
// them; the app itself, which needs a sign-in, is kept out. AI crawlers are named so a site
// owner can see at a glance they are welcome on the public pages.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  const allow = ["/", "/pricing", "/compare", "/compare/", "/classes", "/classes/", "/guides", "/guides/", "/examples/", "/methods", "/insights", "/support", "/llms.txt", "/llms-full.txt", "/og.png", "/icon.svg", `/${INDEXNOW_KEY}.txt`];
  const disallow = ["/dashboards", "/outcomes", "/value-streams", "/canvases", "/outcome-planning", "/embed/", "/board", "/boards/", "/portfolio", "/templates", "/imports", "/ai", "/agents", "/model", "/sync", "/users", "/billing", "/card-types", "/admin", "/okrs", "/classroom", "/readiness", "/help", "/welcome", "/login", "/api/"];
  return {
    rules: [
      { userAgent: "*", allow, disallow },
      { userAgent: AI_CRAWLERS, allow, disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
export const dynamic = "force-dynamic";
