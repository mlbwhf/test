import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo, SeatMark } from "@/components/brand";

export const metadata: Metadata = {
  title: "Your registration",
  description: "Manage your training registration",
};

// Learner-facing shell: no organizer navigation. The organization's name is shown
// by the seat page itself once it has loaded; EnrollClass appears as the processor.
export default function LearnerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Logo context="Your registration" />
      </header>
      <main>{children}</main>
      <footer className="learner-footer">
        <SeatMark size={8} />
        <span>
          Registration and payments handled by <a href="https://enrollclass.com">EnrollClass</a> on behalf of your training provider.
        </span>
      </footer>
    </>
  );
}
