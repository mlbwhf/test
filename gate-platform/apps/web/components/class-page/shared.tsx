// Pieces shared by the class page, checkout and confirmation.


/** Space Grotesk and Inter for the learner pages (React hoists the stylesheet into <head>). */
/** Brand fonts are self-hosted for the whole app (app/fonts.css); nothing extra to load. */
export function RxFonts() {
  return null;
}

/** YouTube or Vimeo link -> privacy-friendly embed URL (same rules as the API's check). */
export function videoEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[A-Za-z0-9_-]{6,20}$/.test(s) ? s : null);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = id(u.searchParams.get("v")) ?? id(u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const v = id(u.pathname.slice(1).split("/")[0]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const v = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1];
    return v ? `https://player.vimeo.com/video/${v}?dnt=1` : null;
  }
  return null;
}

/** Money for learner pages: "$2,200", "€1,295.50". */
export function rxMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(minor / 100).replace(/[.,]00(?=\D*$)/, "");
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}
