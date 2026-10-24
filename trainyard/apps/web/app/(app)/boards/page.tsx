"use client";

// Every board in the workspace: created from a template, started as a class, or imported.
// Each shows its method's theme swatch, so a Kanban board looks like Kanban before you open it.

import Link from "next/link";
import { useState } from "react";
import { TEMPLATE_CATALOG } from "@trainyard/core";
import { Loading, PageHead } from "@/components/ui";
import { useApi } from "@/lib/api";
import { THEMES, methodTheme } from "@/lib/themes";

interface BoardSummary {
  id: string;
  name: string;
  isTemplate?: boolean;
  templateId?: string;
  origin: { system: string; importedAt: string };
  counts: { frames: number; nodes: number };
}

const CLASS_PREFIX = "tpl-builtin-class-";

export default function BoardsPage() {
  const q = useApi<{ boards: BoardSummary[] }>("/v1/boards");
  const [show, setShow] = useState<"all" | "classes" | "templates" | "imported">("all");
  if (!q.data) return <Loading error={q.error} />;
  const methodOf = (b: BoardSummary) => (b.templateId?.startsWith(CLASS_PREFIX) ? "classes" : TEMPLATE_CATALOG.find((t) => t.id === b.templateId)?.method);
  const kind = (b: BoardSummary) => (b.templateId?.startsWith(CLASS_PREFIX) ? "classes" : b.templateId ? "templates" : "imported");
  const boards = q.data.boards.filter((b) => !b.isTemplate && (show === "all" || kind(b) === show)).sort((a, b) => b.origin.importedAt.localeCompare(a.origin.importedAt));
  return (
    <>
      <PageHead
        title="Your boards"
        sub="Boards you created from a template, classes you are running and boards you brought from Miro, Mural, monday.com or Trello."
        actions={
          <div className="tabs" role="group" aria-label="Show">
            {(["all", "classes", "templates", "imported"] as const).map((k) => (
              <button key={k} aria-selected={show === k} onClick={() => setShow(k)}>
                {k === "all" ? "All" : k === "classes" ? "Classes" : k === "templates" ? "From templates" : "Imported"}
              </button>
            ))}
          </div>
        }
      />
      <div className="boards-grid">
        {boards.map((b) => {
          const m = methodOf(b);
          const th = THEMES[m === "classes" ? "classes" : methodTheme(m)];
          return (
            <Link key={b.id} href={`/boards/${encodeURIComponent(b.id)}`} className="tpl-item" style={{ textDecoration: "none" }}>
              <div aria-hidden="true" className="tpl-thumb" style={{ background: th.bg }}>
                {[0, 1, 2, 3, 4, 1].map((t, i) => (
                  <div key={i} style={{ borderRadius: 4, background: th.tones[t], border: `1px solid ${th.line}` }} />
                ))}
              </div>
              <strong>{b.name}</strong>
              <span className="faint">
                {th.name} theme · {b.counts.frames} frames · {b.counts.nodes} cards · {b.origin.importedAt.slice(0, 10)}
              </span>
            </Link>
          );
        })}
      </div>
      {boards.length === 0 ? (
        <p className="faint">
          No boards here yet. <Link href="/templates">Start from a template</Link>, <Link href="/classroom">start a class</Link> or <Link href="/imports">bring your own</Link>.
        </p>
      ) : null}
    </>
  );
}
