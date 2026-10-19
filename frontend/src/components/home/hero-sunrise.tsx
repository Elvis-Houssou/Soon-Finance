"use client";

import { useRef, type ReactNode } from "react";
import { HorizonReveal } from "@/components/motion/horizon-reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion";

type Props = { title: string; lead: string; children: ReactNode };

const RISE = 1.15; // soleil, halos et ciel partagent durée et courbe : le ciel s'éclaire avec la montée
const sunX = "left-[62%] lg:left-[44%]";

/**
 * Hero signature, scène plein cadre : l'horizon se trace depuis l'aplomb du soleil, un grand soleil or sort
 * de la ligne (rogné par elle) avec ses halos, le ciel s'éclaire, les trois barres du logo poussent au premier
 * plan, la carte se pose sur l'horizon. Joué aussi au premier chargement (≤ 1,4 s, jamais bloquant) ;
 * HTML serveur et mouvement réduit = image finale. `--r` = rayon du soleil.
 */
export function HeroSunrise({ title, lead, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const line = ref.current!.querySelector<HTMLElement>("[data-hero-horizon]")!;
        const sun = ref.current!.querySelector<SVGElement>("[data-hero-sun]")!;
        const l = line.getBoundingClientRect();
        const s = sun.getBoundingClientRect();
        gsap
          .timeline({ defaults: { ease: EASE.expo } })
          .fromTo(line, { scaleX: 0, transformOrigin: `${s.left + s.width / 2 - l.left}px 50%` }, { scaleX: 1, duration: 0.9, clearProps: "transform" }, 0)
          .fromTo(sun, { y: 220 }, { y: 0, duration: RISE, clearProps: "transform" }, 0.05)
          .fromTo("[data-hero-halo]", { scale: 0.8, transformOrigin: "50% 50%" }, { scale: 1, duration: RISE, clearProps: "transform" }, 0.05)
          .fromTo("[data-hero-glow]", { opacity: 0, scale: 0.5, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: RISE, clearProps: "opacity,transform" }, 0.05)
          .fromTo("[data-hero-bar]", { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.6, stagger: 0.09, ease: EASE.out, clearProps: "transform" }, 0.35);
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative isolate [--r:clamp(84px,14vw,200px)]">
      <div className="container-site grid gap-8 pt-8 lg:grid-cols-2 lg:items-end lg:gap-16 lg:pt-16">
        {/* Grand écran : réserve sous le texte la hauteur du soleil et de ses halos, le texte ne passe jamais dessus. */}
        <div className="flex flex-col gap-4 lg:pb-[calc(var(--r)*1.7+24px)]">
          <SplitHeading as="h1" text={title} firstLoad delay={0.1} className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl" />
          <HorizonReveal as="p" firstLoad delay={0.3} className="text-lg text-muted">
            {lead}
          </HorizonReveal>
        </div>

        {/* Scène : bande sous le texte sur mobile, toute la section sur grand écran. */}
        <div aria-hidden="true" className="pointer-events-none relative -z-10 h-[calc(var(--r)*2)] lg:absolute lg:inset-0 lg:h-auto">
          <div
            data-hero-glow
            className={`absolute bottom-0 ${sunX} h-[calc(var(--r)*3.2)] w-[calc(var(--r)*10)] -translate-x-1/2`}
            style={{
              background:
                "radial-gradient(ellipse 50% 100% at 50% 100%, color-mix(in srgb, var(--gold) 65%, var(--tint)), var(--tint) 35%, transparent 70%)",
            }}
          />
          {/* Ligne d'horizon à y = 0 : le bas du cadre SVG rogne le soleil, qui sort vraiment de la ligne. */}
          <svg viewBox="-200 -170 400 170" className={`absolute bottom-0 ${sunX} block w-[calc(var(--r)*4)] -translate-x-1/2`}>
            <defs>
              <radialGradient id="hero-sun-fill">
                <stop offset="0%" style={{ stopColor: "var(--gold)" }} />
                <stop offset="70%" style={{ stopColor: "var(--gold)" }} />
                <stop offset="100%" style={{ stopColor: "color-mix(in srgb, var(--gold) 60%, var(--tint))" }} />
              </radialGradient>
            </defs>
            <g data-hero-sun>
              <circle data-hero-halo cx="0" cy="-20" r="150" fill="color-mix(in srgb, var(--gold) 10%, transparent)" />
              <circle data-hero-halo cx="0" cy="-20" r="130" fill="color-mix(in srgb, var(--gold) 16%, transparent)" />
              <circle data-hero-halo cx="0" cy="-20" r="114" fill="color-mix(in srgb, var(--gold) 24%, transparent)" />
              <circle cx="0" cy="-20" r="100" fill="url(#hero-sun-fill)" />
            </g>
          </svg>
          {/* Les trois barres du logo, au premier plan (devant le soleil), alignées sur le texte. */}
          <div className="absolute bottom-0 left-0 flex items-end gap-[calc(var(--r)*0.14)] lg:left-[max(16px,calc((100%-1120px)/2+16px))]">
            {[0.4, 0.66, 0.92].map((h) => (
              <div key={h} data-hero-bar className="w-[calc(var(--r)*0.26)] rounded-t-[calc(var(--r)*0.06)] bg-brand" style={{ height: `calc(var(--r) * ${h})` }} />
            ))}
          </div>
          <div data-hero-horizon className="absolute -inset-x-[100vw] bottom-0 h-0.5 bg-ink" />
        </div>

        {/* La carte se pose sur l'horizon : la ligne passe derrière. */}
        <div className="relative z-10">{children}</div>
      </div>
    </section>
  );
}
