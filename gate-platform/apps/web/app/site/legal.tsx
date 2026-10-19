import type { ReactNode } from "react";

export const LEGAL_UPDATED = "October 19, 2026";
export const OPERATOR = "EnrollClass, operated by Agile Agilist";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <article className="legal">
      <p className="eyebrow">Legal</p>
      <h1 className="site-h1 legal-title">{title}</h1>
      <p className="mono dim">Last updated {LEGAL_UPDATED}</p>
      <p className="site-lede">{intro}</p>
      {children}
    </article>
  );
}
