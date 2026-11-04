"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlanningRoomPage } from "@/components/planning-pages";

// `?doc=<boardId>` opens a board's own planning room; `?mode=class` opens it as the class simulation
// (team PI objectives only), anything else as the full template board.
function Room() {
  const q = useSearchParams();
  const doc = q.get("doc");
  return <PlanningRoomPage docKey={doc && /^b-[a-z0-9]+$/.test(doc) ? `planning-room:${doc}` : "planning-room"} mode={q.get("mode") === "class" ? "class" : "template"} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Room />
    </Suspense>
  );
}
