"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { DUR, EASE, gsap, MOTION_OK, rise, useGSAP } from "@/lib/motion";
import type { Suggestion } from "@/lib/use-suggestions";
import { SuggestionText } from "@/components/learn/suggestion-text";
import { usePress } from "../motion/press";
import { fill, type SimStrings } from "./shared";

type Props = {
  status: "idle" | "loading" | "ready" | "unavailable";
  items: Suggestion[];
  currency: string;
  locale: Locale;
  t: SimStrings;
  canSave: boolean;
  /** Signed in: save straight to the account instead of linking to sign-up. */
  onSave?: () => void;
  saveError?: boolean;
};

export function Suggestions({ status, items, currency, locale, t, canSave, onSave, saveError }: Props) {
  const s = t.simulator;
  const press = usePress<HTMLButtonElement>();
  const texts = items.flatMap((it) => {
    const tpl = (t.suggestions as Record<string, string>)[it.id];
    if (!tpl) return [];
    const vars = Object.fromEntries(Object.entries(it.params).map(([k, v]) => [k, formatMoney(v, currency, locale)]));
    return [{ id: it.id, text: fill(tpl, vars) }];
  });
  const more = texts.length - 2;

  // Les conseils arrivent en cascade ; un conseil qui n'était pas là avant pulse une fois.
  const grid = useRef<HTMLDivElement>(null);
  const seen = useRef<string[] | null>(null);
  const key = texts.slice(0, 2).map((x) => x.id).join(",");
  useGSAP(
    () => {
      if (status !== "ready" || !grid.current) return;
      const before = seen.current;
      seen.current = key.split(",");
      gsap.matchMedia().add(MOTION_OK, () => {
        const els = [...grid.current!.children] as HTMLElement[];
        const fresh = before ? els.filter((el) => !before.includes(el.dataset.id!)) : [];
        const tl = gsap.timeline();
        tl.add(rise(els, { duration: DUR.state, distance: 16, stagger: 0.06 }));
        if (fresh.length)
          tl.to(fresh, { scale: 1.03, duration: DUR.feedback, ease: EASE.out, yoyo: true, repeat: 1, clearProps: "transform" });
      });
    },
    { dependencies: [status, key], revertOnUpdate: true },
  );

  return (
    <section aria-label={s.tips} className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">{s.tips}</h2>
      {status === "unavailable" && (
        <p role="status" className="rounded-[14px] bg-sunken p-5 text-muted">{s.tipsDown}</p>
      )}
      {status === "loading" && <p role="status" className="text-muted">{s.tipsLoading}</p>}
      {status === "ready" && texts.length > 0 && (
        <div ref={grid} className="grid gap-4 sm:grid-cols-2">
          {texts.slice(0, 2).map(({ id, text }, i) => (
            <article key={`${i}:${id}`} data-id={id} className="rounded-[14px] bg-tint p-5">
              <p>
                <SuggestionText id={id} text={text} locale={locale} />
              </p>
            </article>
          ))}
        </div>
      )}
      <div className="flex flex-col items-start gap-4 rounded-[14px] border border-line bg-surface p-5">
        {status === "ready" && more > 0 && (
          <div className="flex flex-col gap-1.5">
            <strong className="text-[17px]">{fill(s.more, { n: more })}</strong>
            <span className="text-[15px] text-muted">{s.moreText}</span>
          </div>
        )}
        {canSave && onSave ? (
          <button ref={press} type="button" onClick={onSave} className="flex min-h-14 items-center rounded-[10px] bg-brand px-7 text-[17px] font-semibold text-on-brand">
            {s.saveAccount}
          </button>
        ) : canSave ? (
          <Link href={`/${locale}/connexion`} className="flex min-h-14 items-center rounded-[10px] bg-brand px-7 text-[17px] font-semibold text-on-brand">
            {s.save}
          </Link>
        ) : (
          <button type="button" disabled className="min-h-14 rounded-[10px] border border-line bg-sunken px-6 font-semibold text-muted">
            {s.saveDisabled}
          </button>
        )}
        {saveError && <p role="status" className="text-danger">{s.saveError}</p>}
      </div>
    </section>
  );
}
