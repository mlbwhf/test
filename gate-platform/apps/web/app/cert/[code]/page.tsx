import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import { SeatMark } from "@/components/brand";
import { PrintCertificate } from "@/components/print-actions";
import { siteOrigin } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

async function load(params: Params) {
  const { code } = await params;
  const res = await publicApi.getCertificate(code);
  if (!res.ok || !res.data.valid) notFound();
  return { code, c: res.data };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { c } = await load(params);
  return { title: `${c.attendeeName} · ${c.courseName}`, description: `Certificate of ${c.kind ?? "completion"} issued by ${c.organization ?? "EnrollClass"}.`, robots: { index: false } };
}

const BADGE_LABEL: Record<string, string> = { credly: "Credly", accredible: "Accredible", badgr: "Badgr", certopus: "Certopus", other: "badge platform" };

export default async function CertificatePage({ params }: { params: Params }) {
  const { code, c } = await load(params);
  const vb = c.verifiedBadge ?? null;
  const tz = c.timezone ?? "UTC";
  const d = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
  const dates = c.startsAt ? (c.endsAt && d(c.endsAt) !== d(c.startsAt) ? `${d(c.startsAt)} – ${d(c.endsAt)}` : d(c.startsAt)) : null;
  const issued = new Date(c.issuedAt!);
  const kind = c.kind === "attendance" ? "Attendance" : "Completion";
  const self = `${await siteOrigin()}/cert/${encodeURIComponent(code)}`;
  const linkedIn = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: c.courseName ?? "",
    organizationName: c.organization ?? "",
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    certUrl: self,
    certId: code,
  })}`;

  return (
    <div className="cert-page">
      <div className="cert-tools">
        <PrintCertificate />
        <a className="cert-btn" href={linkedIn} target="_blank" rel="noreferrer noopener">
          Add to LinkedIn
        </a>
        {vb ? (
          <a className="cert-btn" href={vb.pngUrl} download>
            Download your verified badge
          </a>
        ) : (
          c.badge?.url && (
            <a className="cert-btn" href={c.badge.url} target="_blank" rel="noreferrer noopener">
              Claim your badge on {BADGE_LABEL[c.badge.platform] ?? "the badge platform"}
            </a>
          )
        )}
      </div>

      <article className="cert" aria-label={`Certificate of ${kind.toLowerCase()}`}>
        <header className="cert-head">
          <span className="cert-org">{c.organization}</span>
          <SeatMark size={12} />
        </header>
        <p className="cert-eyebrow">CERTIFICATE OF {kind.toUpperCase()}</p>
        <p className="cert-lead">This certifies that</p>
        <h1 className="cert-name">{c.attendeeName}</h1>
        <p className="cert-lead">{c.kind === "attendance" ? "attended" : "successfully completed"}</p>
        <h2 className="cert-course">{c.courseName}</h2>
        <p className="cert-meta">
          {[dates, c.hours ? `${c.hours} contact hours` : null, c.format === "in_person" ? "In person" : c.format === "hybrid" ? "Hybrid" : c.format ? "Live virtual" : null].filter(Boolean).join(" · ")}
        </p>
        <footer className="cert-foot">
          <div>
            <span>{c.instructors?.length ? (c.instructors.length > 1 ? "Instructors" : "Instructor") : "Issued by"}</span>
            <strong>{c.instructors?.length ? c.instructors.join(", ") : c.organization}</strong>
          </div>
          {(vb?.imageUrl ?? c.badge?.imageUrl) && <img className="cert-badge" src={vb?.imageUrl ?? c.badge!.imageUrl} alt={vb?.name ?? c.badge!.name} />}
          <div>
            <span>Issued</span>
            <strong>{new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(issued)}</strong>
          </div>
        </footer>
        <p className="cert-verify">
          Verify at {self.replace(/^https?:\/\//, "")} · ID {code}
        </p>
      </article>

      {vb && (
        <section className="cert-vb" aria-labelledby="vb-title">
          <img src={vb.imageUrl} alt="" width={96} height={96} />
          <div>
            <p className="eyebrow-mono">VERIFIED DIGITAL BADGE · OPEN BADGES 3.0</p>
            <h2 id="vb-title">{vb.name}</h2>
            <p>
              Issued by {c.organization} through EnrollClass. The badge image carries a signed credential that any Open Badges 3.0 wallet or backpack can import and anyone can check, even without this page.
            </p>
            <p className="cert-vb-links">
              <a href={vb.pngUrl} download>
                Badge image (PNG with credential)
              </a>
              <a href={vb.credentialUrl} target="_blank" rel="noopener">
                Credential (JSON)
              </a>
              <a href="/verify">Verify a badge</a>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
