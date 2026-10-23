"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setApiKey, type Me } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ maxWidth: 440, margin: "60px auto" }} className="stack">
      <h1>Sign in</h1>
      <p className="muted">Paste the key you were shown at sign-up, or the one your workspace admin gave you. It stays in this browser and is only sent to the Trainyard API.</p>
      <p className="muted">
        No key yet? <a href="/#join">Sign up free</a>: Practice gets a workspace and a key at once. Lost yours? Ask your workspace admin for a new one.
      </p>
      <form
        className="panel panel-body stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setApiKey(key.trim());
          try {
            const me = await api<Me>("GET", "/v1/me");
            setError(null);
            router.push(params.get("next") || "/dashboards");
            void me;
          } catch (err) {
            setApiKey(null);
            setError((err as Error).message);
          }
        }}
      >
        <label className="field">
          API key
          <input id="login-key" className="input" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ty_…" required />
        </label>
        {error ? <div className="notice crit">{error}</div> : null}
        <div>
          <button className="btn primary" type="submit">
            Sign in
          </button>
        </div>
      </form>
      <p className="faint" style={{ fontSize: "0.8rem" }}>
        No users yet? The API runs open until the first user is created under Users, or until <span className="mono">TRAINYARD_ADMIN_KEY</span> is set.
      </p>
    </div>
  );
}
