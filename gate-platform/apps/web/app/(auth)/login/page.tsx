import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { sessionToken } from "@/lib/session";
import { publicApiUrl, safePath } from "@/lib/urls";
import { ActionForm } from "@/components/action-form";
import { emailSignInAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const returnTo = safePath(one(sp.returnTo), "");
  const mode = one(sp.mode);
  if (await sessionToken()) {
    const me = await api.me();
    if (me.ok) redirect(me.data.organization ? returnTo || "/dashboard" : "/onboarding");
  }
  const providers = await api.providers();
  const list = providers.ok ? providers.data.providers : [];
  const emailOn = providers.ok ? providers.data.email : false;
  const base = publicApiUrl();
  const signup = mode === "signup";
  const invite = mode === "invite" || returnTo.startsWith("/invite/");
  const notice = one(sp.error) || (one(sp.expired) ? "Your session ended. Please sign in again." : one(sp.signedOut) ? "You're signed out." : "");

  return (
    <section className="auth-card">
      <p className="eyebrow-mono">{invite ? "YOU'RE INVITED" : signup ? "START PUBLISHING" : "WELCOME BACK"}</p>
      <h1>{invite ? "Sign in to accept your invitation" : signup ? "Create your EnrollClass account" : "Sign in to EnrollClass"}</h1>
      <p className="muted">
        {signup
          ? "For training companies and independent instructors. Free to start; you pay a small fee only on paid registrations."
          : "Use the account you signed up with. New here? The same buttons create an account."}
      </p>
      {notice && (
        <div className={`notice ${one(sp.error) ? "notice-error" : "notice-info"}`} role={one(sp.error) ? "alert" : "status"}>
          {notice}
        </div>
      )}
      {!providers.ok && <div className="notice notice-warn">The sign-in service is not reachable right now. Try again in a minute.</div>}

      {list.length > 0 && (
        <div className="auth-providers">
          {list.map((p) => (
            <a key={p.id} className={`auth-provider auth-${p.id}`} href={`${base}/auth/${p.id}/start${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}>
              <span className="auth-provider-mark" aria-hidden="true">{p.label[0]}</span>
              Continue with {p.label}
            </a>
          ))}
        </div>
      )}

      {emailOn && (
        <>
          {list.length > 0 && <div className="auth-or">or</div>}
          <ActionForm action={emailSignInAction} submitLabel="Email me a sign-in link" pendingLabel="Sending…">
            <input type="hidden" name="returnTo" value={returnTo} />
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </label>
          </ActionForm>
        </>
      )}
      {providers.ok && list.length === 0 && !emailOn && <div className="notice notice-warn">No sign-in method is configured yet.</div>}

      <p className="auth-small">
        By continuing you agree to the <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.
        {signup ? (
          <>
            {" "}
            Already have an account? <a href="/login">Sign in</a>.
          </>
        ) : (
          <>
            {" "}
            New to EnrollClass? <a href="/login?mode=signup">Start publishing</a>.
          </>
        )}
      </p>
    </section>
  );
}
