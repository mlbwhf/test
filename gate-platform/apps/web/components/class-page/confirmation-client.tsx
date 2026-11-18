"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** While a card payment is still being confirmed, look again every few seconds (for up to two minutes). */
export function ConfirmPoller() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= 40) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [tries, router]);
  return tries >= 40 ? (
    <p style={{ margin: 0 }}>
      This is taking longer than usual. Your confirmation email will arrive as soon as the payment clears; you can close this page.
    </p>
  ) : null;
}
