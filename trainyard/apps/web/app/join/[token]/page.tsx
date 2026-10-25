"use client";

// A student's personal class link: the token becomes this browser's key, and the class board
// opens. No account, no password; the trainer can replace or remove the link at any time.

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { api, setApiKey, setSupportWorkspace, type ApiFailure, type Me } from "@/lib/api";

export default function JoinClass({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!token.startsWith("gst_")) {
      setErr("This is not a class link. Check the link your trainer sent.");
      return;
    }
    setSupportWorkspace(null);
    setApiKey(token);
    api<Me>("GET", "/v1/me")
      .then((me) => {
        if (!me.principal.guestBoardId) throw new Error("This link does not open a class.");
        router.replace(`/boards/${encodeURIComponent(me.principal.guestBoardId)}`);
      })
      .catch((e: ApiFailure | Error) => {
        setApiKey(null);
        setErr(e.message);
      });
  }, [token, router]);
  return (
    <main id="main" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="panel panel-body stack" style={{ maxWidth: 460, textAlign: "center" }} role="status">
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{err ? "This link did not open the class" : "Opening your class…"}</h1>
        <p className="muted" style={{ margin: 0 }}>{err ?? "One moment: your trainer's class board is loading."}</p>
        {err ? <p className="faint" style={{ margin: 0 }}>Ask your trainer for a new link.</p> : null}
      </div>
    </main>
  );
}
