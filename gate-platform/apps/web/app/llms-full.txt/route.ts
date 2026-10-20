import { HELP, HELP_SECTIONS, helpMarkdown } from "@/lib/help";
import { FAQ_GROUPS } from "@/lib/faq";
import { siteUrl } from "@/lib/seo";

// Everything an assistant needs in one file: the FAQ and every help article in Markdown.
export function GET() {
  const s = siteUrl();
  const parts: string[] = ["# EnrollClass: FAQ and help center", "", `Source: ${s}/help and ${s}/faq`, "", "# Frequently asked questions", ""];
  for (const g of FAQ_GROUPS) {
    parts.push(`## ${g.title}`, "");
    for (const f of g.items) parts.push(`### ${f.q}`, "", f.a + (f.link ? ` (More: ${f.link.startsWith("/") ? s + f.link : f.link})` : ""), "");
  }
  for (const sec of HELP_SECTIONS) {
    parts.push(`# ${sec.title}`, "", sec.blurb, "");
    for (const a of HELP.filter((x) => x.section === sec.key)) parts.push(helpMarkdown(a, s));
  }
  return new Response(parts.join("\n"), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
