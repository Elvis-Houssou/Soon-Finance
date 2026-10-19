"use client";

import Link from "next/link";
import { suggestionTexts } from "@/components/dashboard/dashboard";
import { monthName } from "@/components/dashboard/format";
import type { DashboardData, MonthData, MonthStrings } from "@/components/dashboard/types";
import { SunHorizon } from "@/components/horizon/sun-horizon";
import { fill } from "@/components/simulator/shared";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { EASE, gsap, MOTION_OK, rise, useGSAP } from "@/lib/motion";
import { useApi } from "@/lib/use-api";
import { useRef, type ReactNode } from "react";
import { CountUp } from "@/components/motion/count-up";

/**
 * La célébration « Un pas de plus » : éclat de lumière derrière le soleil, titre qui se lève, chiffres qui
 * défilent, tampon « Mois tenu ! ». Un clic ou une touche passe directement à l'état final.
 */
function Celebrate({ up, children }: { up: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ defaults: { ease: EASE.expo } });
        if (up) tl.fromTo(q("[data-burst]"), { scale: 0.2, opacity: 0 }, { scale: 1.6, opacity: 0.9, duration: 1.1 }, 0.5)
          .to(q("[data-burst]"), { opacity: 0, duration: 1.2, ease: EASE.out }, 1.4);
        tl.add(rise(q("[data-step]"), { stagger: 0.15, distance: 30, duration: 0.8 }), 0.35);
        tl.fromTo(q("[data-stamp]"), { scale: 1.8, rotate: -10, opacity: 0 }, { scale: 1, rotate: -3, opacity: 1, duration: 0.5, ease: "back.out(2.2)" }, 1.6);
        const skip = () => tl.progress(1);
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        return () => {
          window.removeEventListener("pointerdown", skip);
          window.removeEventListener("keydown", skip);
        };
      });
    },
    { scope: root },
  );
  return <div ref={root} className="flex flex-col">{children}</div>;
}

type Month = MonthData & { savings_rate_bp: number | null; kept: boolean | null };
const SAVE = ["save", "save2"];
const nextYm = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export function MonthDone({ ym, locale, t }: { ym: string; locale: Locale; t: MonthStrings }) {
  const dash = useApi<DashboardData>("/api/dashboard");
  const mon = useApi<Month>(`/api/months/${ym}`);
  const m = t.month;
  const dashLink = `/${locale}/tableau-de-bord`;
  const data = dash.data, month = mon.data;

  if (dash.error || mon.error || !data || !month || month.savings_rate_bp === null) {
    const failed = dash.error || mon.error || (month && month.savings_rate_bp === null);
    return (
      <div className="container-site max-w-2xl py-8">
        <p role="status" aria-busy={!failed} className="text-muted">{failed ? m.error : m.loading}</p>
        {failed && <Link href={dashLink} className="flex min-h-11 w-fit items-center underline">{m.toDashboard}</Link>}
      </div>
    );
  }

  const pct = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 });
  const rateText = (bp: number) => `${pct.format(bp / 100)} %`;
  const prev = data.rates.filter((r) => r.year_month < ym).at(-1);
  // Premier mois bouclé : le soleil se lève de 0 à 1, c'est un pas de plus par définition.
  const up = !prev || month.savings_rate_bp > prev.savings_rate_bp;
  const steps = data.steps;
  const previousSteps = up ? Math.max(0, steps - 1) : steps;
  const name = monthName(ym, locale);
  const cur = month.currency;
  const sum = (f: "actual" | "planned") => month.envelopes.filter((e) => SAVE.includes(e.kind)).reduce((a, e) => a + (e[f] ?? 0), 0);
  const savedNow = sum("actual"), plannedSave = sum("planned");
  const tip = suggestionTexts(data, { locale, t })[0];
  const since = data.rates[0] ? monthName(data.rates[0].year_month, locale) : name;
  const to = rateText(month.savings_rate_bp);
  const next = fill(m.forNext, { month: monthName(nextYm(ym), locale) });

  return (
    <Celebrate up={up}>
      <section className="relative isolate flex flex-col overflow-hidden bg-brand py-6 text-on-brand">
        <div aria-hidden="true" data-burst className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[560px] -translate-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold)_75%,transparent),transparent_65%)] opacity-0" />
        <div className="container-site flex max-w-2xl flex-col gap-3.5">
          <SunHorizon
            steps={steps} previousSteps={previousSteps} size="lg"
            label={fill(up ? m.sunLabel : m.sunLabelNo, { n: steps })}
          />
          <h1 data-step className="font-display text-4xl font-bold leading-none">{up ? m.doneUp : m.doneSame}</h1>
          <p data-step className="text-[17px]">
            {prev
              ? fill(m.doneText, { month: name, from: rateText(prev.savings_rate_bp), to })
              : fill(m.doneFirst, { month: name, to })}
          </p>
        </div>
      </section>
      <div className="container-site flex max-w-2xl flex-col gap-5 py-6">
        <dl className="grid grid-cols-2 gap-3 tabular-nums">
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <dt className="text-[13px] text-muted">{fill(m.savedIn, { month: name })}</dt>
            <dd className="mt-1 font-display text-[22px] font-semibold text-brand-ink"><CountUp value={savedNow} format={(n) => formatMoney(n, cur, locale)} duration={1.4} /></dd>
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-4">
            <dt className="text-[13px] text-muted">{fill(m.savedSince, { month: since })}</dt>
            <dd className="mt-1 font-display text-[22px] font-semibold"><CountUp value={data.saved_total} format={(n) => formatMoney(n, cur, locale)} duration={1.6} /></dd>
          </div>
        </dl>
        {month.kept ? (
          <p data-stamp className="w-fit rounded-[10px] border-2 border-brand-ink px-4 py-2 font-display text-xl font-bold text-brand-ink">{m.kept}</p>
        ) : (
          <p className="text-muted">
            {fill(m.notKept, { amount: formatMoney(plannedSave - savedNow, cur, locale), planned: formatMoney(plannedSave, cur, locale) })}
          </p>
        )}
        {tip && (
          <section aria-label={next} className="flex flex-col gap-3 rounded-[14px] bg-tint p-5">
            <h2 className="font-display text-xl font-semibold">{next}</h2>
            <p>{tip}</p>
          </section>
        )}
        <Link href={dashLink} className="flex min-h-11 items-center justify-center font-semibold underline">{m.toDashboard}</Link>
      </div>
    </Celebrate>
  );
}
