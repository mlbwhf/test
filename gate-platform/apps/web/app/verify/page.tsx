import type { Metadata } from "next";
import Link from "next/link";
import { VerifyBadgeForm } from "@/components/verify-badge";

export const metadata: Metadata = {
  title: "Verify a badge",
  description: "Check an EnrollClass verified digital badge (Open Badges 3.0): upload the badge image or paste its credential.",
  alternates: { canonical: "/verify" },
};

/** Public: anyone (an employer, a certification body) can check a verified badge. */
export default function VerifyPage() {
  return (
    <main className="verify-page">
      <p className="eyebrow-mono">VERIFIED DIGITAL BADGES</p>
      <h1>Verify a badge</h1>
      <p className="muted">
        Upload the badge image a learner shared (the PNG downloaded from their certificate page) or paste its credential. We check the signature against the issuer&apos;s published key and that the badge hasn&apos;t been revoked.
      </p>
      <VerifyBadgeForm />
      <p className="auth-small" style={{ marginTop: 24 }}>
        EnrollClass badges follow the Open Badges 3.0 standard, so any compatible verifier can check them too. Organizers: <Link href="/help/badges">how verified badges work</Link>.
      </p>
    </main>
  );
}
