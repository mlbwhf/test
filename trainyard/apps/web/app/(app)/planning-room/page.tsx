"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlanningRoomPage } from "@/components/planning-pages";
import { CLASS_LANGUAGES, useClassLanguage } from "@/lib/translate";

// `?doc=<boardId>` opens a board's own planning room; `?mode=class` opens it as the class simulation
// (team PI objectives only), anything else as the full template board.
function Room() {
  const q = useSearchParams();
  const doc = q.get("doc");
  // A class's room shows in the class's language (`?lang=`).
  const lang = q.get("lang") ?? undefined;
  useClassLanguage(lang && CLASS_LANGUAGES.some((l) => l.id === lang) ? lang : undefined);
  return <PlanningRoomPage docKey={doc && /^b-[a-z0-9]+$/.test(doc) ? `planning-room:${doc}` : "planning-room"} mode={q.get("mode") === "class" ? "class" : "template"} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Room />
    </Suspense>
  );
}
