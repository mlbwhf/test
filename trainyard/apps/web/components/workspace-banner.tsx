"use client";

import Link from "next/link";
import { setSupportWorkspace, useMe } from "@/lib/api";

/** Two states worth a banner: a platform admin inside a customer's workspace, and a frozen workspace. */
export function WorkspaceBanner() {
  const me = useMe();
  if (!me.data) return null;
  const { principal, workspace } = me.data;
  return (
    <>
      {principal.support ? (
        <div className="notice warn row" style={{ justifyContent: "space-between", margin: "0 0 12px" }} role="status">
          <span>
            <b>Support view.</b> You are inside <b>{workspace.name}</b> ({workspace.plan}, {workspace.status}). Changes are written to this customer&apos;s audit log under your name.
          </span>
          <button className="btn small" onClick={() => (setSupportWorkspace(null), window.location.assign("/admin"))}>
            Leave
          </button>
        </div>
      ) : null}
      {workspace.status === "frozen" ? (
        <div className="notice crit" style={{ margin: "0 0 12px" }} role="alert">
          <b>This workspace is read-only.</b> {workspace.frozenReason ?? "The subscription is not active."} Everything is kept.{" "}
          {principal.role === "admin" ? (
            <>
              <Link href="/billing">Reactivate it under Plan &amp; billing</Link>, or export your data there.
            </>
          ) : (
            "Ask the workspace owner to reactivate it."
          )}
        </div>
      ) : null}
    </>
  );
}
