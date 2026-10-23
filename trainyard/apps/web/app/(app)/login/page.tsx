"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setApiKey, type ApiFailure, type Me } from "@/lib/api";

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
  const [mode, setMode] = useState<"password" | "key">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = params.get("next") || "/dashboards";

  const finish = async (token: string) => {
    setApiKey(token);
    try {
      await api<Me>("GET", "/v1/me");
      setError(null);
      router.push(next);
    } catch (err) {
      setApiKey(null);
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "60px auto" }} className="stack">
      <h1>Sign in</h1>
      <div className="tabs" role="tablist" aria-label="Sign-in method">
        <button role="tab" aria-selected={mode === "password"} onClick={() => setMode("password")}>
          Email and password
        </button>
        <button role="tab" aria-selected={mode === "key"} onClick={() => setMode("key")}>
          API key
        </button>
      </div>
      {mode === "password" ? (
        <form
          className="panel panel-body stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const r = await api<{ token: string }>("POST", "/v1/auth/login", { email: email.trim(), password });
              await finish(r.token);
            } catch (err) {
              setError((err as ApiFailure).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            Email
            <input id="login-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password
            <input id="login-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <div className="notice crit">{error}</div> : null}
          <div>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
          <p className="faint" style={{ fontSize: "0.8rem", margin: 0 }}>
            No account? <a href="/#join">Sign up free</a>. Forgot your password? Your workspace admin can set a new one under Users; if you are the admin, sign in with your API key and set it there.
          </p>
        </form>
      ) : (
        <form
          className="panel panel-body stack"
          onSubmit={async (e) => {
            e.preventDefault();
            await finish(key.trim());
          }}
        >
          <p className="muted" style={{ margin: 0 }}>
            The key shown at sign-up or issued by your admin. It stays in this browser and is only sent to the Trainyard API. Once in, set a password under Users to sign in with email and password next time.
          </p>
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
          <p className="faint" style={{ fontSize: "0.8rem", margin: 0 }}>
            No users yet? The API runs open until the first user is created under Users, or until <span className="mono">TRAINYARD_ADMIN_KEY</span> is set.
          </p>
        </form>
      )}
    </div>
  );
}
