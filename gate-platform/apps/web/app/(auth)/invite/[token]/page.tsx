import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { sessionToken } from "@/lib/session";
import { ActionForm } from "@/components/action-form";
import { acceptInvitationAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitation", robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const here = `/invite/${encodeURIComponent(token)}`;
  if (!(await sessionToken())) redirect(`/login?mode=invite&returnTo=${encodeURIComponent(here)}`);
  const me = await api.me();
  if (!me.ok) redirect(`/login?mode=invite&returnTo=${encodeURIComponent(here)}`);
  return (
    <section className="auth-card">
      <p className="eyebrow-mono">INVITATION</p>
      <h1>Join your team on EnrollClass</h1>
      <p className="muted">
        You're signed in as <strong>{me.data.user.email}</strong>. Accepting adds this account to the organization that invited you.
      </p>
      <ActionForm action={acceptInvitationAction} submitLabel="Accept invitation" pendingLabel="Joining…">
        <input type="hidden" name="token" value={token} />
      </ActionForm>
      <p className="auth-small">
        Wrong account?{" "}
        <a href={`/auth/signout`}>Sign out</a> and open the invitation link again.
      </p>
    </section>
  );
}
