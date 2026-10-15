// GET /events/:id/roster.csv?format=default|safe_studio|scrum_org — proxies the
// API's roster export (GET /v1/events/:id/roster.csv) so the organizer's api
// key never reaches the browser. The format decides the column layout
// (SAFe Studio / Scrum.org imports); unknown formats fall back to "default".

import { api, describeFailure, ROSTER_FORMATS, type RosterFormat } from "@/lib/api";

export const dynamic = "force-dynamic";

function rosterFormat(raw: string | null): RosterFormat {
  return ROSTER_FORMATS.includes(raw as RosterFormat) ? (raw as RosterFormat) : "default";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const format = rosterFormat(new URL(request.url).searchParams.get("format"));
  const res = await api.getRosterCsv(id, format);

  if (!res.ok) {
    const status = res.error.kind === "api" ? res.error.status : 502;
    return new Response(`Roster unavailable: ${describeFailure(res.error)}\n`, {
      status,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const safeId = id.replace(/[^A-Za-z0-9_-]/g, "_");
  const suffix = format === "default" ? "" : `-${format}`;

  return new Response(res.data.csv, {
    status: 200,
    headers: {
      "content-type": res.data.contentType.startsWith("text/csv") ? res.data.contentType : "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="roster-${safeId}${suffix}.csv"`,
      "cache-control": "no-store",
    },
  });
}
