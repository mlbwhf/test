"use client";

// Shows a class in its language. The screens are written in English; when a class is set to
// another language, every text on the page that the catalogue knows (i18n/<lang>.json, built to
// /i18n/<lang>.json) is shown in that language, as it appears and as it changes. Only what is
// displayed changes: what people type and what is saved stay exactly as they are, so a class can
// switch language at any time, and a corrected translation shows everywhere on the next load.

import { useEffect } from "react";

export const CLASS_LANGUAGES: { id: string; name: string }[] = [
  { id: "en", name: "English" },
  { id: "fr-CA", name: "Français (Québec)" },
  { id: "fr-FR", name: "Français (France)" },
];

type Catalogue = { exact: Map<string, string>; patterns: { re: RegExp; fr: string }[]; /** Course wording: kept in English, with the translation beneath. */ both: Map<string, string> };
const loaded = new Map<string, Promise<Catalogue>>();
const ATTRS = ["placeholder", "title", "aria-label"];
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function load(lang: string): Promise<Catalogue> {
  let p = loaded.get(lang);
  if (!p) {
    p = fetch(`/i18n/${encodeURIComponent(lang)}.json`, { cache: "no-cache" })
      .then((r): Promise<{ t?: Record<string, string>; b?: Record<string, string> }> => (r.ok ? r.json() : Promise.resolve({})))
      .then((d) => {
        const exact = new Map<string, string>(), patterns: Catalogue["patterns"] = [];
        const both = new Map(Object.entries(d.b ?? {}).map(([en, fr]) => [norm(en), fr]));
        // An exercise's steps are written "Step 2: …" and shown without the prefix: both forms match.
        for (const [en, fr] of [...both]) {
          const m = /^Step\s*\d+\s*:\s*(.+)$/s.exec(en);
          if (m && !both.has(m[1]!)) both.set(m[1]!, fr.replace(/^[ÉE]tape\s*\d+\s*[\u00a0\u202f ]?:\s*/i, ""));
        }
        for (const [en, fr] of Object.entries(d.t ?? {})) {
          if (/\{\d+\}/.test(en)) {
            // "Remove {0} students?" matches the text with anything in the holes.
            const src = norm(en).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{(\d+)\\\}/g, "(?<p$1>.+?)");
            try {
              patterns.push({ re: new RegExp(`^${src}$`, "s"), fr });
            } catch {
              /* a hole used twice: skipped */
            }
          } else exact.set(norm(en), fr);
        }
        return { exact, patterns, both };
      })
      .catch(() => ({ exact: new Map(), patterns: [], both: new Map() }));
    loaded.set(lang, p);
  }
  return p;
}

function translator(cat: Catalogue) {
  const memo = new Map<string, string | null>();
  return (text: string): string | null => {
    const key = norm(text);
    if (key.length < 2 || !/[A-Za-z]{2}/.test(key)) return null;
    let out = memo.get(key);
    if (out === undefined) {
      out = cat.exact.get(key) ?? null;
      if (out === null && key.length > 8 && key.length < 400) {
        for (const p of cat.patterns) {
          const m = p.re.exec(key);
          if (m) {
            out = p.fr.replace(/\{(\d+)\}/g, (_, n: string) => m.groups?.[`p${n}`] ?? "");
            break;
          }
        }
      }
      if (memo.size > 5000) memo.clear();
      memo.set(key, out);
    }
    if (out === null) return null;
    // Keep the spaces the text had around it: neighbouring pieces rely on them.
    return (/^\s/.test(text) ? " " : "") + out + (/\s$/.test(text) ? " " : "");
  };
}

/** Shows the page in `lang` while mounted ("en" or nothing: as written). */
export function useClassLanguage(lang: string | undefined) {
  useEffect(() => {
    if (!lang || lang === "en") return;
    let stopped = false, observer: MutationObserver | undefined;
    const prev = document.documentElement.lang;
    void load(lang).then((cat) => {
      if (stopped || !cat.exact.size) return;
      document.documentElement.lang = lang;
      const tr = translator(cat);
      const done = new WeakMap<Node, string>();
      const doneAttr = new WeakMap<Element, Record<string, string>>();
      const skip = (el: Element | null) => !el || !!el.closest("script,style,textarea,[contenteditable='true'],[data-no-i18n]");
      // Course wording stays in English with the translation beneath it (a line added by CSS from an
      // attribute, so the page's own elements are never changed). In tight places (buttons, links,
      // menus, drawings) there is no room for two lines: the translation alone is shown.
      if (!document.getElementById("i18n-alt-style")) {
        const st = document.createElement("style");
        st.id = "i18n-alt-style";
        st.textContent = "[data-i18n-alt]::after{content:attr(data-i18n-alt);display:block;font-style:italic;font-weight:500;font-size:.88em;line-height:1.3;opacity:.8;margin-top:.15em;text-transform:none;letter-spacing:0}";
        document.head.appendChild(st);
      }
      const alts = new WeakMap<Element, Map<Text, string>>();
      const setAlt = (el: Element, n: Text, fr: string | null) => {
        const m = alts.get(el) ?? new Map<Text, string>();
        if (fr === null) m.delete(n);
        else m.set(n, fr);
        alts.set(el, m);
        for (const k of [...m.keys()]) if (k.parentElement !== el) m.delete(k);
        const v = [...m.values()].join(" ");
        if (v) el.setAttribute("data-i18n-alt", v);
        else el.removeAttribute("data-i18n-alt");
      };
      const text = (n: Text) => {
        const v = n.nodeValue ?? "";
        if (done.get(n) === v || skip(n.parentElement)) return;
        const par = n.parentElement!;
        const two = cat.both.get(norm(v));
        if (two !== undefined) {
          if (par instanceof HTMLElement && !par.closest("button,a,option,select,summary,nav,svg,[role='tab']")) {
            done.set(n, v);
            setAlt(par, n, two);
            return;
          }
          const o = (/^\s/.test(v) ? " " : "") + two + (/\s$/.test(v) ? " " : "");
          done.set(n, o);
          n.nodeValue = o;
          return;
        }
        if (alts.get(par)?.has(n)) setAlt(par, n, null);
        const out = tr(v);
        if (out === null || out === v) return;
        // An <option> without a value uses its text as the value: keep the value as written.
        const opt = n.parentElement;
        if (opt instanceof HTMLOptionElement && !opt.hasAttribute("value")) opt.setAttribute("value", opt.value);
        done.set(n, out);
        n.nodeValue = out;
      };
      const attrs = (el: Element) => {
        if (skip(el)) return;
        for (const a of ATTRS) {
          const v = el.getAttribute(a);
          if (!v || doneAttr.get(el)?.[a] === v) continue;
          const out = cat.both.get(norm(v)) ?? tr(v);
          if (out === null || out === v) continue;
          doneAttr.set(el, { ...(doneAttr.get(el) ?? {}), [a]: out });
          el.setAttribute(a, out);
        }
      };
      const walk = (root: Node) => {
        if (root.nodeType === Node.TEXT_NODE) return text(root as Text);
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        attrs(root as Element);
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        for (let n = w.nextNode(); n; n = w.nextNode()) (n.nodeType === Node.TEXT_NODE ? text(n as Text) : attrs(n as Element));
      };
      walk(document.body);
      observer = new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === "characterData") text(m.target as Text);
          else if (m.type === "attributes") attrs(m.target as Element);
          else m.addedNodes.forEach(walk);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    });
    return () => {
      stopped = true;
      observer?.disconnect();
      document.documentElement.lang = prev || "en";
    };
  }, [lang]);
}
