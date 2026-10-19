"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import type { Suggestion } from "@/lib/use-suggestions";
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
  const texts = items.flatMap((it) => {
    const tpl = (t.suggestions as Record<string, string>)[it.id];
    if (!tpl) return [];
    const vars = Object.fromEntries(Object.entries(it.params).map(([k, v]) => [k, formatMoney(v, currency, locale)]));
    return [fill(tpl, vars)];
  });
  const more = texts.length - 2;

  return (
    <section aria-label={s.tips} className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">{s.tips}</h2>
      {status === "unavailable" && (
        <p role="status" className="rounded-[14px] bg-sunken p-5 text-muted">{s.tipsDown}</p>
      )}
      {status === "loading" && <p role="status" className="text-muted">{s.tipsLoading}</p>}
      {status === "ready" && texts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {texts.slice(0, 2).map((text, i) => (
            <article key={i} className="rounded-[14px] bg-tint p-5"><p>{text}</p></article>
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
          <button type="button" onClick={onSave} className="flex min-h-14 items-center rounded-[10px] bg-brand px-7 text-[17px] font-semibold text-on-brand">
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
