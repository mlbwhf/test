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
  const [mode, setMode] = useState<"password" | "key" | "forgot">("password");
  // Forgotten password: ask with the email, then the emailed code and a new password.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
        <button role="tab" aria-selected={mode !== "key"} onClick={() => setMode("password")}>
          Email and password
        </button>
        <button role="tab" aria-selected={mode === "key"} onClick={() => setMode("key")}>
          API key
        </button>
      </div>
      {mode === "forgot" ? (
        <form
          className="panel panel-body stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              if (!codeSent) {
                await api("POST", "/v1/auth/forgot", { email: email.trim() });
                setCodeSent(true);
              } else {
                const r = await api<{ token: string }>("POST", "/v1/auth/reset", { email: email.trim(), code: code.trim(), password: newPassword });
                await finish(r.token);
              }
            } catch (err) {
              setError((err as ApiFailure).status === 429 ? "A code was sent a moment ago; wait a minute before asking again." : (err as ApiFailure).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Choose a new password</h2>
          <label className="field">
            Email
            <input id="forgot-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={codeSent} />
          </label>
          {codeSent ? (
            <>
              <p className="muted" style={{ margin: 0 }}>
                If there is a sign-in for this email, a six-digit code is on its way. It works for 15 minutes; check your junk folder too.
              </p>
              <label className="field">
                Code from the email
                <input id="forgot-code" className="input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required autoFocus />
              </label>
              <label className="field">
                New password
                <input id="forgot-password" className="input" type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </label>
            </>
          ) : null}
          {error ? <div className="notice crit">{error}</div> : null}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn primary" type="submit" disabled={busy || (codeSent && (code.length !== 6 || newPassword.length < 10))}>
              {busy ? "One moment…" : codeSent ? "Set password and sign in" : "Email me a code"}
            </button>
            {codeSent ? (
              <button type="button" className="btn" disabled={busy} onClick={() => { setCodeSent(false); setCode(""); setError(null); }}>
                Send a new code
              </button>
            ) : null}
            <button type="button" className="btn ghost" onClick={() => { setMode("password"); setCodeSent(false); setError(null); }}>
              Back to sign in
            </button>
          </div>
          <p className="faint" style={{ fontSize: "0.8rem", margin: 0 }}>
            At least 10 characters. Setting it signs you out everywhere else.
          </p>
        </form>
      ) : mode === "password" ? (
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
            <button type="button" className="linklike" onClick={() => { setMode("forgot"); setError(null); }} style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }}>
              Forgot your password?
            </button>{" "}
            No account? <a href="/#join">Sign up free</a>. Still stuck? <a href="/support">Contact support</a>.
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
