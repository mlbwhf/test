/** Illustration of an EnrollClass verified badge and the check anyone can run on it (marketing pages). */
export function SampleBadge({ title = "SAFe Agilist", issuer = "Agile Agilist" }: { title?: string; issuer?: string }) {
  return (
    <div className="sb" aria-label={`Example verified badge: ${title}, issued by ${issuer}`} role="img">
      <svg className="sb-art" viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          <linearGradient id="sb-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#253252" />
            <stop offset="1" stopColor="#14213d" />
          </linearGradient>
        </defs>
        <polygon points="120,10 215,65 215,175 120,230 25,175 25,65" fill="#3fcb7e" />
        <polygon points="120,24 203,72 203,168 120,216 37,168 37,72" fill="url(#sb-g)" />
        <polygon points="120,34 194,77 194,163 120,206 46,163 46,77" fill="none" stroke="#3fcb7e" strokeWidth="2" opacity="0.6" />
        <path className="sb-star" d="M120 62 l11 22 24 3 -18 17 5 24 -22 -12 -22 12 5 -24 -18 -17 24 -3z" fill="#3fcb7e" />
        <text x="120" y="152" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="2" fill="#3fcb7e">
          VERIFIED
        </text>
        <text x="120" y="172" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="15" fill="#f7f6f2">
          {title}
        </text>
      </svg>
      <div className="sb-card">
        <p className="sb-ok">
          <span className="sb-check" aria-hidden="true">
            ✓
          </span>
          Valid credential
        </p>
        <dl>
          <dt>Awarded to</dt>
          <dd>Maria Okafor</dd>
          <dt>Issued by</dt>
          <dd>{issuer}</dd>
          <dt>Standard</dt>
          <dd>Open Badges 3.0 · signed</dd>
        </dl>
      </div>
    </div>
  );
}
