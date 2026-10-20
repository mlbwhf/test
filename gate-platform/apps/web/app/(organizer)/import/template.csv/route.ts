// Canonical CSV header row with example lines (a paid class with a Credly badge, a free one with
// its own badge image), for the "Import" page. Mirrors CSV_TEMPLATE in packages/importers.
const TEMPLATE =
  "name,course,start,end,timezone,currency,price,seats,minimum,format,location,instructors,meeting link,description,image,badge,badge image,certification body\n" +
  '"PMP Exam Prep - Nov 2026","PMP Exam Prep",2026-11-12 09:00,2026-11-14 17:00,America/Toronto,USD,1495.00,20,6,live_virtual,,"Jane Doe; Ali Khan",https://zoom.us/j/123456789,"Three-day live online bootcamp.",https://example.com/pmp-banner.jpg,https://www.credly.com/org/acme/badge/pmp-prep,,PMI\n' +
  '"Intro to Agile - Dec 2026","Intro to Agile",2026-12-03 13:00,2026-12-03 16:00,America/Toronto,USD,0,40,,live_virtual,,"Ali Khan",,"Free taster session.",,,https://example.com/agile-badge.png,\n';

export function GET() {
  return new Response(TEMPLATE, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="enrollclass-import-template.csv"' } });
}
