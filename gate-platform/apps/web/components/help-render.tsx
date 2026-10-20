import Link from "next/link";
import type { ReactNode } from "react";
import type { HelpBlock } from "@/lib/help";

/** **bold**, `code` and [label](href) inside help text. */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[2]) out.push(<code key={i++}>{m[2]}</code>);
    else if (m[3] && m[4]) {
      const href = m[4];
      out.push(
        href.startsWith("/") ? (
          <Link key={i++} href={href}>
            {m[3]}
          </Link>
        ) : (
          <a key={i++} href={href} target="_blank" rel="noreferrer noopener">
            {m[3]}
          </a>
        ),
      );
    } else if (m[5]) out.push(<em key={i++}>{m[5]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function HelpBody({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("h" in b) return <h2 key={i}>{b.h}</h2>;
        if ("p" in b) return <p key={i}><Inline text={b.p} /></p>;
        if ("tip" in b)
          return (
            <p key={i} className="help-tip">
              <span>TIP</span> <Inline text={b.tip} />
            </p>
          );
        if ("steps" in b)
          return (
            <ol key={i} className="help-steps">
              {b.steps.map((x, j) => (
                <li key={j}>
                  <Inline text={x} />
                </li>
              ))}
            </ol>
          );
        if ("list" in b)
          return (
            <ul key={i} className="help-list">
              {b.list.map((x, j) => (
                <li key={j}>
                  <Inline text={x} />
                </li>
              ))}
            </ul>
          );
        if ("code" in b) return <pre key={i} className="help-code">{b.code}</pre>;
        return (
          <div key={i} className="help-table">
            <table>
              <thead>
                <tr>
                  {b.table.head.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.table.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>
                        <Inline text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
