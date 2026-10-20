import { HELP, HELP_SECTIONS } from "@/lib/help";
import { publicCatalog } from "@/lib/catalog";
import { apiUrl, appUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// llms.txt (https://llmstxt.org): a plain-Markdown map of EnrollClass for AI assistants.
export async function GET() {
  const s = siteUrl();
  const catalog = (await publicCatalog()).slice(0, 200);
  const lines = [
    "# EnrollClass",
    "",
    "> Registration and payments for professional training providers and independent instructors. Organizers publish classes (cohorts) of their courses; learners register and pay by card or invoice; payments are held until the class is delivered and then released to the organizer's Stripe account.",
    "",
    "Key facts:",
    "- Each course has a public page with upcoming dates, seats left and prices, at " + `${appUrl()}/c/<organization>/<course>` + ", with schema.org EducationEvent data per date.",
    "- Learners get a QR ticket, calendar invitations, reminders and a self-service link to change attendee, move dates or cancel (default: full refund until 14 days before, 50% until 7 days before).",
    "- Organizers have roles (owner, admin, instructor, finance), check-in, attendance/completion certificates, digital badges, duplicate/series scheduling, webhooks, a REST API and an MCP server.",
    "",
    "## Docs",
    "",
    `- [Help center](${s}/help): step-by-step guides for organizers, instructors, finance and learners`,
    `- [FAQ](${s}/faq): short answers about payments, refunds, instructors, integrations and AI`,
    `- [API reference](${apiUrl()}/docs): REST API (OpenAPI)`,
    `- [MCP server](${apiUrl()}/mcp): Streamable HTTP MCP endpoint; authenticate with an organizer API key (Authorization: Bearer eck_...)`,
    "",
  ];
  for (const sec of HELP_SECTIONS) {
    lines.push(`## ${sec.title}`, "");
    for (const a of HELP.filter((x) => x.section === sec.key)) lines.push(`- [${a.title}](${s}/help/${a.slug}): ${a.summary}`);
    lines.push("");
  }
  if (catalog.length) {
    lines.push("## Upcoming classes", "");
    for (const c of catalog) {
      lines.push(`- [${c.name} — ${c.organizationName}](${appUrl()}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}): next class starts ${c.nextStartsAt.slice(0, 10)}, ${c.classes} upcoming date${c.classes === 1 ? "" : "s"}`);
    }
    lines.push("");
  }
  lines.push("## Optional", "", `- [Full text of the help center and FAQ](${s}/llms-full.txt)`, "");
  return new Response(lines.join("\n"), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=900" } });
}
