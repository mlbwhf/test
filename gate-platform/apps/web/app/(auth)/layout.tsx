import type { ReactNode } from "react";
import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-top">
        <Logo href="/" size={11} />
      </header>
      <main className="auth-main">{children}</main>
      <footer className="auth-foot">
        <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="mailto:support@enrollclass.com">support@enrollclass.com</a>
      </footer>
    </div>
  );
}
