// GET /events/:id/roster.csv — the attendee roster as CSV, in the column
// order the organizer imports into SAFe Studio: name,email,company,status,orderId.

import { api, describeFailure } from "@/lib/api";

export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const seatsRes = await api.listSeats(id);

  if (!seatsRes.ok) {
    const status = seatsRes.error.kind === "api" ? seatsRes.error.status : 502;
    return new Response(`Roster unavailable: ${describeFailure(seatsRes.error)}\n`, {
      status,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const header = ["name", "email", "company", "status", "orderId"];
  const rows = seatsRes.data.items.map((seat) =>
    [seat.attendee.name ?? "", seat.attendee.email, seat.attendee.company ?? "", seat.status, seat.orderId]
      .map(csvCell)
      .join(","),
  );
  const body = [header.join(","), ...rows].join("\r\n") + "\r\n";
  const safeId = id.replace(/[^A-Za-z0-9_-]/g, "_");

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="roster-${safeId}.csv"`,
      "cache-control": "no-store",
    },
  });
}
