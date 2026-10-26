// Each class has its own icon: the certification badge where the class earns one (RTE), otherwise
// a shield with the class's short name in the class's own tint.

import { CLASSES } from "@trainyard/core";

const BADGES: Record<string, string> = { rte: "/courses/rte/badge.png" };
const TINTS: Record<string, string> = { "leading-safe": "#cfe8d4", spc: "#cde0f2", aspc: "#f6b9ae", popm: "#ffd37a", rte: "#ffd37a" };

export const classSpec = (classId: unknown) => CLASSES.find((c) => c.id === classId);
export const classShort = (classId: unknown, name: string) => classSpec(classId)?.short ?? name.replace(/[^A-Z0-9]/g, "").slice(0, 4) ?? "CL";

export function ClassIcon({ classId, name, size = 64, locked = false }: { classId: unknown; name: string; size?: number; locked?: boolean }) {
  const badge = typeof classId === "string" ? BADGES[classId] : undefined;
  if (badge) return <img src={badge} alt={`${name} badge`} width={size} height={size} className={`class-badge${locked ? " locked" : ""}`} />;
  const short = classShort(classId, name);
  return (
    <span className="class-shield" aria-hidden style={{ width: size, height: size * 1.1, ["--tint" as string]: (typeof classId === "string" && TINTS[classId]) || "#cde0f2", fontSize: Math.min(size / 3, (size * 0.8) / (short.length * 0.72 + 0.6)) }}>
      {short}
    </span>
  );
}

/** A progress ring around the class icon: greyscale and locked until every exercise is done. */
export function BadgeRing({ classId, name, done, total, size = 200 }: { classId: unknown; name: string; done: number; total: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const share = total ? done / total : 0;
  const earned = total > 0 && done >= total;
  return (
    <div className="badge-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(243,234,211,0.15)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffb627" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${c * share} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="badge-ring-icon">
        <ClassIcon classId={classId} name={name} size={size * 0.68} locked={!earned} />
      </span>
      <span className={`badge-ring-cap${earned ? " earned" : ""}`}>{earned ? "BADGE EARNED" : `LOCKED · ${total - done} TO GO`}</span>
    </div>
  );
}
