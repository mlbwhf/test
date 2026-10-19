import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * EnrollClass seat-grid mark: three ink squares and one seat-green circle, a cohort
 * with three seats taken and one being filled. Pure CSS so it scales with --seat.
 */
export function SeatMark({ size = 10, ink, green, className = "" }: { size?: number; ink?: string; green?: string; className?: string }) {
  const style = { "--seat": `${size}px`, ...(ink ? { "--seat-ink": ink } : {}), ...(green ? { "--seat-green": green } : {}) } as CSSProperties;
  return (
    <span className={`seatmark ${className}`.trim()} style={style} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/** Mark + lowercase wordmark. Links to `href` when given. */
export function Logo({ href, size = 10, context }: { href?: string; size?: number; context?: string }) {
  const inner = (
    <>
      <SeatMark size={size} />
      <span className="wordmark">enrollclass</span>
      {context ? <span className="brand-context">{context}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="brand" aria-label="EnrollClass">
        {inner}
      </Link>
    );
  }
  return <span className="brand">{inner}</span>;
}
