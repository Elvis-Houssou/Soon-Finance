"use client";

import { useRef } from "react";
import { belowFold, BELOW_HORIZON, gsap, MOTION_OK, rise, useGSAP, useHydrating } from "@/lib/motion";

type Props = { title: string; steps: { title: string; text: string }[] };

const SUN_NOTCH = 26; // le soleil monte d'un cran par étape

/**
 * « Comment ça marche » : sur grand écran, la section s'épingle et les étapes se lèvent une à une au
 * défilement, le soleil montant d'un cran à chacune. Mobile : chaque étape monte de l'horizon une fois.
 * HTML serveur et mouvement réduit = état final (trois étapes, soleil levé).
 */
export function HowItWorks({ title, steps }: Props) {
  const ref = useRef<HTMLElement>(null);
  const hydrating = useHydrating();

  useGSAP(
    () => {
      if (hydrating() && !belowFold(ref.current)) return; // déjà peinte à l'écran : on ne la cache pas
      const items = gsap.utils.toArray<HTMLElement>("[data-step]");
      gsap.matchMedia().add(
        { desktop: `(min-width: 1024px) and ${MOTION_OK}`, mobile: `(max-width: 1023.98px) and ${MOTION_OK}` },
        (ctx) => {
          if (ctx.conditions!.mobile) {
            items.forEach((el) => rise(el, { trigger: "scroll" }));
            gsap.from("[data-steps-sun]", { y: SUN_NOTCH * 3, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } });
            return;
          }
          // pinSpacing explicite : ScrollTrigger le désactive par défaut quand le parent est en flex.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: ref.current, start: "center center", end: "+=90%", pin: true, pinSpacing: true, scrub: 0.6 },
          });
          tl.set(items.slice(1), { clipPath: BELOW_HORIZON, y: 24 }).set("[data-steps-sun]", { y: SUN_NOTCH * 2 });
          items.slice(1).forEach((el, i) => {
            tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1 }).to("[data-steps-sun]", { y: SUN_NOTCH * (1 - i), duration: 1 }, "<");
          });
        },
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="steps" className="flex flex-col gap-6">
      <h2 id="steps" className="font-display text-3xl font-semibold">{title}</h2>
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} data-step className="flex gap-4">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-display font-bold text-on-brand">{i + 1}</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <svg aria-hidden="true" viewBox="0 0 1000 110" preserveAspectRatio="xMidYMax meet" className="block h-auto w-full">
        <circle data-steps-sun cx="500" cy="62" r="30" fill="var(--gold)" />
        <rect x="0" y="108" width="1000" height="2" fill="var(--ink)" />
      </svg>
    </section>
  );
}
