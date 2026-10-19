"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { apiUrl } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { belowFold, DUR, EASE, gsap, MOTION_OK, rise, useGSAP } from "@/lib/motion";
import type { Horizon, Plan } from "@/lib/plan";
import { CountUp } from "../motion/count-up";
import { usePress } from "../motion/press";
import { smoothScrollTo } from "../motion/smooth-scroll";
import { fill, type PlanStrings } from "../simulator/shared";
import type { PdfData } from "./plan-pdf";

type P = PlanStrings["plan"];

const LEARN: Record<Horizon, string> = { short: "epargner-ou-investir", medium: "types-de-placements", long: "risques-frais-duree" };
const RISK: Record<Horizon, number> = { short: 1, medium: 2, long: 3 };

export const duration = (p: P, months: number) =>
  months < 12 ? fill(p.months, { n: months }) : months === 12 ? p.year : fill(p.years, { n: months / 12 });

/**
 * Le plan calculé, révélé comme un lever de soleil : le résumé monte, le soleil passe l'horizon,
 * puis chaque section se lève à son tour (au défilement si elle est plus bas). Rejoué à chaque calcul (`key`).
 */
export function PlanReport({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const sections = q("[data-reveal]") as HTMLElement[];
        const now = sections.filter((el) => !belowFold(el));
        rise(now, { stagger: 0.12, distance: 40, duration: DUR.signature, ease: EASE.expo });
        sections.filter((el) => belowFold(el)).forEach((el) => rise(el, { trigger: "scroll", distance: 40, duration: DUR.signature }));

        gsap.from(q("[data-sun]"), { yPercent: 70, duration: 1.4, ease: EASE.expo, delay: 0.15 });
        gsap.from(q("[data-glow]"), { scale: 0.4, opacity: 0, duration: 1.6, ease: EASE.out, delay: 0.1 });
        gsap.from(q("[data-horizon]"), { scaleX: 0, duration: 1.1, ease: EASE.inOut });

        const onView = (sel: string, vars: gsap.TweenVars) =>
          (q(sel) as HTMLElement[]).forEach((el) =>
            gsap.from(el, { ...vars, scrollTrigger: { trigger: el, start: "top 92%", once: true } }),
          );
        onView("[data-gauge]", { scaleX: 0, duration: 1.2, ease: EASE.expo });
        (q("[data-bars]") as HTMLElement[]).forEach((box) =>
          gsap.from(box.querySelectorAll("[data-bar]"), {
            scaleY: 0, duration: 1.1, ease: EASE.expo, stagger: 0.12,
            scrollTrigger: { trigger: box, start: "top 92%", once: true },
          }),
        );
        (q("[data-dots]") as HTMLElement[]).forEach((box) =>
          gsap.from(box.children, {
            scale: 0, duration: 0.5, ease: "back.out(2.5)", stagger: 0.08,
            scrollTrigger: { trigger: box, start: "top 95%", once: true },
          }),
        );
      });
    },
    { scope: root },
  );
  return <div ref={root} className="flex flex-col gap-6">{children}</div>;
}

/** Le chiffre clé : l'épargne du mois, avec un soleil qui se lève derrière. */
export function PlanSummary({ plan, methodName, currency, locale, p }: { plan: Plan; methodName: string; currency: string; locale: Locale; p: P }) {
  const money = (n: number) => formatMoney(n, currency, locale);
  const step = { debt: p.stepDebt, emergency: p.stepEmergency, invest: p.stepInvest }[plan.step];
  return (
    <section data-reveal aria-label={p.ready} className="relative isolate overflow-hidden rounded-[20px] border border-line bg-surface px-6 pt-7 pb-16 sm:px-9 sm:pt-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-full">
        <div data-glow className="absolute -bottom-24 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold)_45%,transparent),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-14 overflow-hidden">
          <div data-sun className="absolute top-2 right-[12%] size-28 rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--gold),color-mix(in_srgb,var(--gold)_70%,var(--tint)))]" />
        </div>
        <div data-horizon className="absolute inset-x-0 bottom-14 h-px origin-left bg-ink/70" />
      </div>
      <p role="status" className="text-[15px] font-semibold text-brand-ink">{p.ready}</p>
      <p className="mt-1 text-muted">{fill(p.kicker, { method: methodName })}</p>
      <p className="mt-4 font-display text-5xl leading-none font-semibold tabular-nums sm:text-6xl">
        <CountUp value={plan.saving} format={money} duration={1.6} />
      </p>
      <p className="mt-2 text-lg">{p.perMonth}</p>
      <p className="text-muted tabular-nums">{fill(p.perYear, { amount: money(plan.yearly) })}</p>
      <p className="mt-5 max-w-prose rounded-[10px] bg-tint px-4 py-3 text-[15px]">{step}</p>
    </section>
  );
}

export function SavingsProposals({ plan, currency, locale, p }: { plan: Plan; currency: string; locale: Locale; p: P }) {
  const money = (n: number) => formatMoney(n, currency, locale);
  const e = plan.emergency;
  const ratio = e.min > 0 ? Math.min(1, e.have / e.min) : 1;
  const top = Math.max(...plan.projection.map((x) => x.total), 1);
  const status = e.months === 0 ? p.emergencyDone : e.months === null ? p.emergencyNever : fill(p.emergencyMonths, { n: e.months });
  return (
    <section data-reveal aria-labelledby="plan-saving" className="flex flex-col gap-4">
      <h2 id="plan-saving" className="font-display text-2xl font-semibold">{p.savingTitle}</h2>
      <div className="grid gap-4">
        <article className="flex flex-col gap-3 rounded-[16px] border border-line bg-surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold">{p.emergencyTitle}</h3>
          <p>{fill(p.emergencyText, { min: money(e.min), max: money(e.max) })}</p>
          <div className="h-3 overflow-hidden rounded-full bg-sunken" role="img" aria-label={fill(p.emergencyHave, { amount: money(e.have) })}>
            <div data-gauge className="h-full origin-left rounded-full bg-brand" style={{ transform: `scaleX(${ratio})` }} />
          </div>
          <p className="text-[15px] text-muted tabular-nums">{fill(p.emergencyHave, { amount: money(e.have) })}</p>
          <p className="font-semibold">{status}</p>
          {e.estimated && <p className="text-sm text-muted">{p.emergencyEstimated}</p>}
        </article>
        <article className="flex flex-col gap-3 rounded-[16px] border border-line bg-surface p-5 sm:p-6">
          <h3 className="text-lg font-semibold">{p.projectionTitle}</h3>
          <ul data-bars className="grid h-48 grid-cols-4 items-end gap-3">
            {plan.projection.map((x) => (
              <li key={x.months} className="flex h-full flex-col justify-end gap-2 text-center">
                <span className="text-[13px] leading-tight font-semibold tabular-nums">{money(x.total)}</span>
                <span className="relative block flex-1">
                  <span
                    data-bar
                    className="absolute inset-x-0 bottom-0 origin-bottom rounded-t-[8px] bg-[linear-gradient(to_top,var(--brand),color-mix(in_srgb,var(--brand)_55%,var(--gold)))]"
                    style={{ height: `${Math.max(4, (x.total / top) * 100)}%` }}
                  />
                </span>
                <span className="font-mono text-xs text-muted">{duration(p, x.months)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">{p.projectionNote}</p>
        </article>
      </div>
    </section>
  );
}

export function InvestDirections({ plan, locale, p }: { plan: Plan; locale: Locale; p: P }) {
  return (
    <section data-reveal aria-labelledby="plan-invest" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 id="plan-invest" className="font-display text-2xl font-semibold">{p.investTitle}</h2>
        <p className="text-muted">{p.investLead}</p>
      </div>
      <ul className="grid gap-4">
        {plan.invest.map(({ horizon, ready }) => (
          <li
            key={horizon}
            className={`flex flex-col gap-3 rounded-[16px] p-5 transition-colors ${ready ? "border border-line bg-surface hover:border-brand" : "border border-dashed border-line-input bg-sunken"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{p.horizonName[horizon]}</h3>
                <p className="font-mono text-xs text-muted">{p.horizonWhen[horizon]}</p>
              </div>
              {!ready && <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-warning">{p.locked}</span>}
            </div>
            <p className="text-[15px]">{p.horizonWhat[horizon]}</p>
            <p className="mt-auto flex items-center gap-2 text-sm">
              <span className="text-muted">{p.risk} : {p.riskLevel[horizon]}</span>
              <span data-dots aria-hidden="true" className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`size-2.5 rounded-full ${n <= RISK[horizon] ? "bg-gold" : "bg-line"}`} />
                ))}
              </span>
            </p>
            <Link href={`/${locale}/apprendre/${LEARN[horizon]}`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink">
              {p.learnMore}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Status = "idle" | "busy" | "gate" | "done" | "error";

/** Téléchargement du PDF : réservé aux inscrits ; sinon on propose l'inscription, qui ramène ici et relance le téléchargement. */
export function PlanDownload({ data, locale, p, autoStart }: { data: PdfData; locale: Locale; p: P; autoStart: boolean }) {
  // `autoStart` is passed only once the tips are known, so the PDF is complete.
  const [status, setStatus] = useState<Status>("idle");
  const [welcome, setWelcome] = useState(false);
  const gate = useRef<HTMLDivElement>(null);
  const press = usePress<HTMLButtonElement>();

  const download = async () => {
    setStatus("busy");
    const me = await fetch(apiUrl("/me")).catch(() => null);
    if (!me?.ok) return setStatus("gate");
    try {
      const { buildPlanPdf } = await import("./plan-pdf");
      const url = URL.createObjectURL(await buildPlanPdf(data));
      const a = Object.assign(document.createElement("a"), { href: url, download: p.fileName });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  // Retour d'inscription (`?pdf=1`) : le téléchargement repart tout seul.
  const started = useRef(false);
  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    setWelcome(true);
    void download();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useGSAP(
    () => {
      if (status !== "gate" || !gate.current) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        rise(gate.current, { distance: 16, duration: DUR.view });
      });
    },
    { dependencies: [status], revertOnUpdate: true },
  );

  const next = encodeURIComponent(`/${locale}/simulateur?pdf=1`);
  return (
    <section data-reveal id="plan-pdf" aria-labelledby="plan-pdf-title" className="relative isolate overflow-hidden rounded-[20px] bg-ink p-6 text-bg sm:p-9">
      <div aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand)_45%,transparent),transparent_70%)]" />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <h2 id="plan-pdf-title" className="font-display text-2xl font-semibold sm:text-3xl">{p.pdfTitle}</h2>
          <p className="opacity-80">{p.pdfText}</p>
          {welcome && status !== "gate" && <p className="font-semibold text-brand">{p.welcomeBack}</p>}
        </div>
        <button
          ref={press}
          type="button"
          onClick={download}
          disabled={status === "busy"}
          className="flex min-h-14 shrink-0 items-center justify-center gap-2.5 rounded-[12px] bg-brand px-7 text-[17px] font-semibold text-on-brand disabled:opacity-70"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
          </svg>
          {status === "busy" ? p.pdfPreparing : p.pdfButton}
        </button>
      </div>
      <p role="status" className="mt-3 min-h-6 text-[15px]">
        {status === "done" ? p.pdfDone : status === "error" ? p.pdfError : ""}
      </p>
      {status === "gate" && (
        <div ref={gate} className="mt-2 flex flex-col gap-3 rounded-[14px] bg-surface p-5 text-ink">
          <strong className="text-lg">{p.gateTitle}</strong>
          <p className="text-muted">{p.gateText}</p>
          <Link href={`/${locale}/connexion?next=${next}`} className="flex min-h-12 w-fit items-center rounded-[10px] bg-brand px-6 font-semibold text-on-brand">
            {p.gateButton}
          </Link>
        </div>
      )}
    </section>
  );
}

/** Fait glisser jusqu'au plan calculé. */
export const scrollToPlan = (el: HTMLElement | null) => smoothScrollTo(el);
