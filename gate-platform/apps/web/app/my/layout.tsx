import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your registration",
  description: "Manage your training registration",
};

// Learner-facing shell: no organizer navigation, just a neutral title. The
// organization's name is shown by the seat page itself once it has loaded.
export default function LearnerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <span className="brand">Your registration</span>
      </header>
      <main>{children}</main>
    </>
  );
}
