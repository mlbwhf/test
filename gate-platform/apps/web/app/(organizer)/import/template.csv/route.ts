// Canonical CSV header row with one example line, for the "Import" page.
const TEMPLATE =
  "name,course,start,end,timezone,currency,price,seats,format,location,description,image\n" +
  '"PMP Exam Prep - Nov 2026","PMP Exam Prep",2026-11-12 09:00,2026-11-14 17:00,America/Toronto,USD,1495.00,20,live_virtual,,"Three-day live online bootcamp.",https://example.com/pmp-banner.jpg\n';

export function GET() {
  return new Response(TEMPLATE, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="enrollclass-import-template.csv"' } });
}
