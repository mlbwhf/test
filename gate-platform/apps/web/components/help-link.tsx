import Link from "next/link";

/** Small "?" next to a page title that opens the matching help article in a new tab. */
export function HelpLink({ slug, label = "Help" }: { slug: string; label?: string }) {
  return (
    <Link className="help-link" href={`/help/${slug}`} target="_blank" rel="noopener" aria-label={`${label} (opens in a new tab)`} title={label}>
      ?
    </Link>
  );
}
