import type { Metadata } from "next";
import Link from "next/link";
import { publicCatalogWithCategories } from "@/lib/catalog";
import { appUrl } from "@/lib/seo";
import { RxFonts } from "@/components/class-page/shared";
import { formatLabel, fromPrice, groupCertifications, langName, languagesOf, lengthOf, money, nextOpen, registerUrl, seatsShort, shortRange, type Cert } from "@/lib/finder";
import "../../../c/registration.css";
import "../finder.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare certifications",
  description: "Compare up to three certification classes side by side: badge, length, format, languages, next class and price.",
  robots: { index: false, follow: true },
};

type Params = Record<string, string | string[] | undefined>;

const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n).trimEnd()}…` : t);

/** Side by side, one column per certification; the table scrolls sideways on phones. */
export default async function ComparePage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const raw = (Array.isArray(sp.ids) ? sp.ids[0] : sp.ids) ?? "";
  const wanted = raw.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 3);
  const { items } = await publicCatalogWithCategories();
  const certs = groupCertifications(items.filter((c) => c.listed !== false));
  const cols = wanted.map((id) => certs.find((c) => c.id === id)).filter((c): c is Cert => Boolean(c));
  const app = appUrl();
  const back = `/classes${cols.length ? `?compare=${cols.map((c) => encodeURIComponent(c.id)).join(",")}` : ""}`;

  const rows: [string, (c: Cert) => string][] = [
    ["In short", (c) => (c.tagline ? c.tagline : c.blurb ? clip(c.blurb, 140) : "—")],
    ["You earn", (c) => c.badgeName ?? (c.certificationBody ? `${c.certificationBody} certification` : "Certificate of completion")],
    ["Provider", (c) => c.orgName],
    ["Length", (c) => [lengthOf(c), c.hours && !lengthOf(c).endsWith(" h") ? `${c.hours} h live` : null].filter(Boolean).join(" · ")],
    ["Format", (c) => formatLabel(c.cohorts)],
    ["Languages", (c) => languagesOf(c.cohorts).map(langName).join(" · ") || "—"],
    [
      "Next class",
      (c) => {
        const n = nextOpen(c.cohorts);
        return n ? `${shortRange(n)}${languagesOf(c.cohorts).length > 1 && n.lang ? ` (${n.lang})` : ""} · ${seatsShort(n)}` : "—";
      },
    ],
    ["Upcoming classes", (c) => String(c.cohorts.length)],
    ["Payment", (c) => (c.heldUntilDelivery ? "Held until the class is delivered" : "Paid to the provider at booking")],
  ];

  return (
    <main className="rx cf-page">
      <RxFonts />
      <div className="cf-cmp-top">
        <div className="cf-cmp-in">
          <Link href={back} className="cf-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to results
          </Link>
        </div>
      </div>
      <div className="cf-cmp-in cf-cmp-main">
        <h1>Which certification fits you?</h1>
        {cols.length < 2 ? (
          <div className="cf-empty">
            <strong>Pick two or three certifications to compare.</strong>
            <span className="rx-muted">Tick Compare on the cards in Find a class.</span>
            <Link href="/classes" className="cf-reg">
              Find a class
            </Link>
          </div>
        ) : (
          <>
            <div className="cf-table-wrap">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="cf-sr">Attribute</span>
                    </th>
                    {cols.map((c) => (
                      <th key={c.id} scope="col">
                        <span className={`cf-ring is-on${c.badgeImage ? " has-img" : ""}`} style={{ width: 64, height: 64, fontSize: 14 }} aria-hidden="true">
                          {c.badgeImage ? <img src={c.badgeImage} alt="" /> : c.code}
                        </span>
                        <span className="cf-table-title">{c.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {cols.map((c) => (
                        <td key={c.id}>{value(c)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">
                      <span className="cf-sr">Register</span>
                    </th>
                    {cols.map((c) => {
                      const n = nextOpen(c.cohorts);
                      const price = fromPrice(c.cohorts);
                      return (
                        <td key={c.id}>
                          {n && (
                            <a className="cf-reg cf-reg-lg" href={registerUrl(app, c, n)}>
                              {n.capacity && !n.seatsLeft ? "Join the waitlist" : `Register — ${money(price, c.currency)}`}
                            </a>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="rx-muted cf-cmp-note">Not sure? Each class page has the full agenda, the instructor and a preview video.</p>
          </>
        )}
      </div>
    </main>
  );
}
