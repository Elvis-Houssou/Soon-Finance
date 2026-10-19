"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

declare global {
  interface Window {
    /** Point d'observation des tests e2e (ScrollTrigger orphelins). */
    __sfMotion?: { ScrollTrigger: typeof ScrollTrigger };
  }
}

// Seul point d'enregistrement des plugins, côté client uniquement.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip);
  window.__sfMotion = { ScrollTrigger };
}

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };

export const EASE = { out: "power3.out", expo: "expo.out", inOut: "power2.inOut" } as const;
export const DUR = { feedback: 0.12, state: 0.24, view: 0.42, signature: 0.9 } as const;
export const REDUCED = "(prefers-reduced-motion: reduce)";
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Masque « sous l'horizon » : tout est rogné par le haut ; `inset(0)` = entièrement levé. */
export const BELOW_HORIZON = "inset(100% 0% 0% 0%)";

/**
 * Images d'un compteur, de `from` à `to` en unités mineures entières, formatées par `format`.
 * Première et dernière images exactes, suite monotone, sans doublon consécutif.
 */
export function countFrames(from: number, to: number, format: (n: number) => string, count = 60): string[] {
  const frames: string[] = [];
  for (let k = 0; k < count; k++) {
    const text = format(Math.round(from + ((to - from) * k) / Math.max(count - 1, 1)));
    if (text !== frames.at(-1)) frames.push(text);
  }
  frames[frames.length - 1] = format(to); // `to` non entier : la valeur finale exacte reste celle de l'appelant
  return frames;
}

export type RevealTrigger = "mount" | "scroll";

/**
 * L'astre qui passe l'horizon : masque levé (`clip-path`) + légère montée, puis styles nettoyés.
 * À appeler dans un `gsap.matchMedia().add(MOTION_OK, …)` de `useGSAP` ; `trigger: "scroll"` = une seule fois.
 */
export function rise(
  targets: gsap.TweenTarget,
  { trigger = "mount", distance = 24, ...vars }: gsap.TweenVars & { trigger?: RevealTrigger; distance?: number } = {},
) {
  const first = gsap.utils.toArray<Element>(targets)[0];
  return gsap.fromTo(
    targets,
    { clipPath: BELOW_HORIZON, y: distance },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration: DUR.view,
      ease: EASE.expo,
      clearProps: "clipPath,transform",
      scrollTrigger: trigger === "scroll" && first ? { trigger: first, start: "top 90%", once: true } : undefined,
      ...vars,
    },
  );
}
