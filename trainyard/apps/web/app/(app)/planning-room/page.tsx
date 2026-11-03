"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlanningRoomPage } from "@/components/planning-pages";

// `?doc=<boardId>` opens a class board's own planning room (the PI Planning simulation exercises).
function Room() {
  const doc = useSearchParams().get("doc");
  return <PlanningRoomPage docKey={doc && /^b-[a-z0-9]+$/.test(doc) ? `planning-room:${doc}` : "planning-room"} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Room />
    </Suspense>
  );
}
