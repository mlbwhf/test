"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Cloudflare Turnstile inside an ActionForm. The token goes into a hidden `turnstileToken`
// field; a token works once, so after every submit the widget fetches a fresh one.

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(el: HTMLElement, options: { sitekey: string; action?: string; theme?: "auto" | "light" | "dark"; callback: (token: string) => void; "expired-callback"?: () => void; "error-callback"?: () => void }): string;
  reset(id?: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) {
    loader = new Promise<TurnstileApi>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not initialise")));
      s.onerror = () => {
        loader = undefined;
        reject(new Error("Turnstile failed to load"));
      };
      document.head.append(s);
    });
  }
  return loader;
}

export function TurnstileField({ siteKey, action }: { siteKey: string; action: string }) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    let gone = false;
    loadTurnstile()
      .then((turnstile) => {
        if (gone || !box.current) return;
        widgetId.current = turnstile.render(box.current, {
          sitekey: siteKey,
          action,
          theme: "auto",
          callback: (t) => setToken(t),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      gone = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, action]);

  // The form just finished submitting: that token is spent.
  useEffect(() => {
    if (wasPending.current && !pending && widgetId.current) {
      setToken("");
      window.turnstile?.reset(widgetId.current);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <div className="turnstile-field">
      <div ref={box} />
      {failed && <p className="muted small">The browser check didn&apos;t load. If sending is refused, reload the page and try again.</p>}
      <input type="hidden" name="turnstileToken" value={token} readOnly />
    </div>
  );
}
