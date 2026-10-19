"use client";

import { useRef } from "react";
import { belowFold, BELOW_HORIZON, EASE, gsap, MOTION_OK, rise, useGSAP, useHydrating } from "@/lib/motion";

type Props = { title: string; steps: { title: string; text: string }[] };

// Soleil r = 40 (unités SVG), centre levé à y = -40. Aube → mi-hauteur → levé : crans de 28 et 40 (≥ 1/3 du diamètre).
const DAWN = 68;
const HALF = 40;

/**
 * « Comment ça marche » : sur grand écran, la section s'épingle ; chaque étape se lève de l'horizon, un trait
 * or la marque, le soleil passe de l'aube au plein jour et la lumière grandit. Mobile : chaque étape monte une
 * fois au défilement. HTML serveur et mouvement réduit = image finale (trois étapes, soleil levé).
 */
export function HowItWorks({ title, steps }: Props) {
  const ref = useRef<HTMLElement>(null);
  const hydrating = useHydrating();

  useGSAP(
    () => {
      if (hydrating() && !belowFold(ref.current)) return; // déjà peinte à l'écran : on ne la cache pas
      const items = gsap.utils.toArray<HTMLElement>("[data-step]");
      const marks = gsap.utils.toArray<HTMLElement>("[data-step-mark]");
      gsap.matchMedia().add(
        { desktop: `(min-width: 1024px) and ${MOTION_OK}`, mobile: `(max-width: 1023.98px) and ${MOTION_OK}` },
        (ctx) => {
          if (ctx.conditions!.mobile) {
            items.forEach((el) => rise(el, { trigger: "scroll" }));
            gsap
              .timeline({ defaults: { duration: 0.9, ease: EASE.expo }, scrollTrigger: { trigger: "[data-steps-scene]", start: "bottom 95%", once: true } })
              .from("[data-steps-sun]", { y: DAWN + 24 }, 0)
              .from("[data-steps-glow]", { scale: 0.4, opacity: 0, transformOrigin: "50% 100%" }, 0);
            return;
          }
          // pinSpacing explicite : ScrollTrigger le désactive par défaut quand le parent est en flex.
          const tl = gsap.timeline({
            defaults: { ease: "none", duration: 1 },
            scrollTrigger: { trigger: ref.current, start: "top 15%", end: "+=60%", pin: true, pinSpacing: true, scrub: 0.6 },
          });
          tl.set(items.slice(1), { clipPath: BELOW_HORIZON, y: 24 })
            .set(marks.slice(1), { scaleX: 0, transformOrigin: "0% 50%" })
            .set("[data-steps-sun]", { y: DAWN })
            .set("[data-steps-glow]", { scale: 0.5, transformOrigin: "50% 100%" });
          [HALF, 0].forEach((y, i) => {
            tl.to(items[i + 1], { clipPath: "inset(0% 0% 0% 0%)", y: 0 })
              .to("[data-steps-sun]", { y }, "<")
              .to("[data-steps-glow]", { scale: 0.75 + 0.25 * i }, "<")
              .to(marks[i + 1], { scaleX: 1, duration: 0.5 });
          });
        },
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="steps" className="isolate flex flex-col gap-6">
      <h2 id="steps" className="font-display text-3xl font-semibold">{title}</h2>
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} data-step className="flex gap-4">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-display font-bold text-on-brand">{i + 1}</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              {/* Trait or : l'étape franchie (la lumière marque la réussite). */}
              <span aria-hidden="true" data-step-mark className="block h-0.5 w-10 bg-gold" />
              <p className="text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div aria-hidden="true" data-steps-scene className="relative -z-10 mt-4 h-28 lg:h-52">
        <div
          data-steps-glow
          className="absolute bottom-0 left-1/2 h-40 w-[40rem] -translate-x-1/2 lg:h-72 lg:w-[72rem]"
          style={{ background: "radial-gradient(ellipse 50% 100% at 50% 100%, color-mix(in srgb, var(--gold) 60%, var(--tint)), var(--tint) 40%, transparent 72%)" }}
        />
        <svg viewBox="-60 -100 120 100" className="absolute bottom-0 left-1/2 h-28 -translate-x-1/2 lg:h-52">
          <circle data-steps-sun cx="0" cy="-40" r="40" fill="var(--gold)" />
        </svg>
        <div className="absolute -inset-x-[100vw] bottom-0 h-0.5 bg-ink" />
      </div>
    </section>
  );
}
