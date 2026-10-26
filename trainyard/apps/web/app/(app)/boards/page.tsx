"use client";

// Every board in the workspace: created from a template, started as a class, or imported.
// Each shows its method's theme swatch, so a Kanban board looks like Kanban before you open it.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TEMPLATE_CATALOG } from "@trainyard/core";
import { Loading, PageHead } from "@/components/ui";
import { BoardList } from "@/components/board-list";
import { api, useApi, type ApiFailure } from "@/lib/api";
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
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const blank = async () => {
    try {
      const r = await api<{ board: { id: string } }>("POST", "/v1/boards/blank", { name: `Whiteboard ${new Date().toISOString().slice(0, 10)}` });
      router.push(`/boards/${encodeURIComponent(r.board.id)}`);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  if (!q.data) return <Loading error={q.error} />;
  const methodOf = (b: BoardSummary) => (b.templateId?.startsWith(CLASS_PREFIX) ? "classes" : TEMPLATE_CATALOG.find((t) => t.id === b.templateId)?.method);
  const kind = (b: BoardSummary) => (b.templateId?.startsWith(CLASS_PREFIX) ? "classes" : b.templateId || b.origin.system === "trainyard" ? "templates" : "imported");
  const boards = q.data.boards.filter((b) => !b.isTemplate && (show === "all" || kind(b) === show)).sort((a, b) => b.origin.importedAt.localeCompare(a.origin.importedAt));
  return (
    <>
      <PageHead
        title="Your boards"
        sub="Boards you created from a template, blank whiteboards, classes you are running and boards you brought from Miro, Lucid, Mural, Trello, monday.com or iObeya. Any board can take more templates: open it and add one beside what is there."
        actions={
          <>
          <button className="btn primary" onClick={() => void blank()}>
            New blank whiteboard
          </button>
          <div className="tabs" role="group" aria-label="Show">
            {(["all", "classes", "templates", "imported"] as const).map((k) => (
              <button key={k} aria-pressed={show === k} onClick={() => setShow(k)}>
                {k === "all" ? "All" : k === "classes" ? "Classes" : k === "templates" ? "Whiteboards and templates" : "Imported"}
              </button>
            ))}
          </div>
          </>
        }
      />
      {err ? <div className="notice crit">{err}</div> : null}
      <BoardList
        boards={boards.map((b) => ({ id: b.id, name: b.name, templateId: b.templateId, importedAt: b.origin.importedAt }))}
        onChanged={() => void q.reload()}
        empty={null}
        icon={(lb) => {
          const m = methodOf(boards.find((b) => b.id === lb.id)!);
          const th = THEMES[m === "classes" ? "classes" : methodTheme(m)];
          return (
            <span aria-hidden="true" className="blist-swatch" title={`${th.name} theme`} style={{ background: th.bg }}>
              {[0, 1, 2, 3].map((t) => (
                <i key={t} style={{ background: th.tones[t], borderColor: th.line }} />
              ))}
            </span>
          );
        }}
      />
      {boards.length === 0 ? (
        <p className="faint">
          No boards here yet. <Link href="/templates">Start from a template</Link>, <Link href="/classroom">start a class</Link> or <Link href="/imports">bring your own</Link>.
        </p>
      ) : null}
    </>
  );
}
