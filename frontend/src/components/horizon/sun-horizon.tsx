"use client";

import { useId, useRef } from "react";
import { EASE, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/motion";

const MAX = 12;
const HORIZON = 86;
const clamp = (n: number) => Math.max(0, Math.min(MAX, Math.round(n)));

// Règle de la maquette (cy = 101 − 7,5 × crans ; 0 cran : sous l'horizon), prolongée en continu pour l'animation.
const sunY = (s: number) => (s < 1 ? 112 - 18.5 * s : 101 - 7.5 * s);
// Le soleil suit un arc : il part de la gauche et rejoint le centre au 12e cran.
const sunX = (s: number) => 60 + (100 * s) / MAX;
const place = (s: number) => `translate(${sunX(s)} ${sunY(s)})`;
const skyOpacity = (s: number) => 0.18 + (0.62 * s) / MAX;

type Props = {
  steps: number;
  previousSteps?: number;
  size?: "md" | "lg";
  label: string;
  /** Sans previousSteps : se lève depuis l'horizon (0 cran) à l'affichage. */
  animateOnMount?: boolean;
};

/**
 * Soleil qui monte d'un cran par mois de progression, coupé par l'horizon. Animé le long de son arc de
 * previousSteps (ou de 0 avec animateOnMount) à steps ; les crans atteints s'allument un à un, le ciel se
 * réchauffe, le halo respire tant qu'il est à l'écran. Mouvement réduit : état final immédiat.
 */
export function SunHorizon({ steps, previousSteps, size = "md", label, animateOnMount = false }: Props) {
  const target = clamp(steps);
  const from = previousSteps !== undefined ? clamp(previousSteps) : animateOnMount ? 0 : target;
  const root = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const sun = q("[data-sun]")[0];
        const sky = q("[data-sky]")[0];
        const dots = q("[data-dot]") as Element[];
        const halo = gsap.to(q("[data-halo]"), { scale: 1.08, transformOrigin: "50% 50%", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true });
        const loop = ScrollTrigger.create({ trigger: root.current, onToggle: (self) => (self.isActive ? halo.play() : halo.pause()) });
        if (from !== target) {
          const state = { s: from };
          gsap.set(sun, { attr: { transform: place(from) } });
          gsap.set(sky, { attr: { "fill-opacity": skyOpacity(from) } });
          dots.forEach((d, i) => i >= Math.min(from, target) && i < Math.max(from, target) && gsap.set(d, { attr: { r: 3 }, fill: "var(--line-input)" }));
          const tl = gsap.timeline({ delay: 0.25 });
          tl.to(state, {
            s: target,
            duration: 1.1 + 0.12 * Math.abs(target - from),
            ease: EASE.expo,
            onUpdate: () => sun.setAttribute("transform", place(state.s)),
          });
          tl.to(sky, { attr: { "fill-opacity": skyOpacity(target) }, duration: 1.4, ease: EASE.out }, 0);
          const lit = dots.slice(Math.min(from, target), Math.max(from, target));
          if (target > from)
            tl.to(lit, { attr: { r: 4 }, fill: "var(--brand-ink)", duration: 0.35, ease: "back.out(3)", stagger: 0.09, clearProps: "fill" }, 0.3);
        }
        return () => loop.kill();
      });
    },
    { scope: root, dependencies: [from, target], revertOnUpdate: true },
  );

  return (
    <svg ref={root} viewBox="0 0 320 112" role="img" aria-label={label} className={`block w-full overflow-visible ${size === "lg" ? "max-w-xl" : "max-w-md"}`}>
      <defs>
        <radialGradient id={`sun-${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--gold) 70%, var(--tint))" />
        </radialGradient>
        <radialGradient id={`sky-${id}`} cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`above-${id}`}>
          <rect x="-40" y="-60" width="400" height={HORIZON + 60} />
        </clipPath>
      </defs>
      <ellipse data-sky cx="160" cy={HORIZON} rx="175" ry="80" fill={`url(#sky-${id})`} fillOpacity={skyOpacity(target)} />
      <g clipPath={`url(#above-${id})`}>
        <g data-sun transform={place(target)}>
          <circle data-halo r="54" className="fill-gold" fillOpacity="0.12" />
          <circle data-halo r="42" className="fill-gold" fillOpacity="0.2" />
          <circle r="30" fill={`url(#sun-${id})`} />
        </g>
      </g>
      <rect x="0" y={HORIZON} width="320" height="26" className="fill-sunken" />
      <rect x="0" y={HORIZON - 1} width="320" height="2" className="fill-line-input" />
      {Array.from({ length: MAX }, (_, i) => (
        <circle
          key={i} data-dot cx={22 + 25 * i} cy="100" r={i < target ? 4 : 3}
          className={i < target ? "fill-brand-ink" : "fill-line-input"}
        />
      ))}
    </svg>
  );
}
