"use client";

import { useRef, type ReactNode } from "react";
import { HorizonReveal } from "@/components/motion/horizon-reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion";

type Props = { title: string; lead: string; children: ReactNode };

/**
 * Hero signature : le logo à grande échelle. L'horizon se trace depuis le point où le soleil va se lever,
 * la lumière teinte le ciel, le soleil or monte, les trois barres poussent du sol. Moment signature joué
 * aussi au premier chargement (≤ 1,4 s, jamais bloquant) ; HTML serveur et mouvement réduit = état final.
 */
export function HeroSunrise({ title, lead, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const line = ref.current!.querySelector<HTMLElement>("[data-hero-horizon]")!;
        const sun = ref.current!.querySelector<SVGElement>("[data-hero-sun]")!;
        // L'horizon s'ouvre à partir de l'aplomb du soleil.
        const l = line.getBoundingClientRect();
        const s = sun.getBoundingClientRect();
        gsap
          .timeline({ defaults: { ease: EASE.expo } })
          .fromTo(line, { scaleX: 0, transformOrigin: `${s.left + s.width / 2 - l.left}px 50%` }, { scaleX: 1, duration: 0.9, clearProps: "transform" }, 0)
          .fromTo("[data-hero-glow]", { opacity: 0, scale: 0.6, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: 1.1, ease: EASE.out, clearProps: "opacity,transform" }, 0.1)
          .fromTo(sun, { y: 190 }, { y: 0, duration: 1.1, clearProps: "transform" }, 0.15)
          .fromTo("[data-hero-bar]", { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.6, stagger: 0.09, ease: EASE.out, clearProps: "transform" }, 0.35);
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative isolate overflow-x-clip">
      <div className="container-site grid gap-8 pt-8 lg:grid-cols-2 lg:items-end lg:gap-16 lg:pt-16">
        <div className="flex flex-col gap-4">
          <SplitHeading as="h1" text={title} firstLoad delay={0.1} className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl" />
          <HorizonReveal as="p" firstLoad delay={0.3} className="text-lg text-muted">
            {lead}
          </HorizonReveal>
          <div aria-hidden="true" className="relative mt-4 w-60 sm:w-72">
            {/* Lumière du lever : demi-ellipse posée sur l'horizon, à l'aplomb du soleil, qui teinte le ciel. */}
            <div
              data-hero-glow
              className="absolute bottom-0 left-[81%] -z-10 h-64 w-[52rem] -translate-x-1/2 sm:h-80"
              style={{
                background:
                  "radial-gradient(ellipse 50% 100% at 50% 100%, color-mix(in srgb, var(--gold) 40%, var(--tint)), var(--tint) 40%, transparent 100%)",
              }}
            />
            {/* Barres et soleil du logo, à l'échelle 5. */}
            <svg viewBox="140 10 210 190" className="block w-full">
              <rect data-hero-bar x="140" y="150" width="40" height="50" rx="7.5" fill="var(--brand)" />
              <rect data-hero-bar x="195" y="115" width="40" height="85" rx="7.5" fill="var(--brand)" />
              <rect data-hero-bar x="250" y="80" width="40" height="120" rx="7.5" fill="var(--brand)" />
              <circle data-hero-sun cx="310" cy="50" r="35" fill="var(--gold)" />
            </svg>
            {/* Ligne d'horizon pleine largeur (rognée par la section) : la carte s'y pose sur grand écran. */}
            <div data-hero-horizon className="absolute -inset-x-[100vw] bottom-0 h-0.5 bg-ink" />
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
