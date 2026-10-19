"use client";

import { useGSAP } from "@gsap/react";
import { useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

declare global {
  interface Window {
    /** Point d'observation des tests e2e (ScrollTrigger orphelins) ; absent des builds de production hors e2e. */
    __sfMotion?: { ScrollTrigger: typeof ScrollTrigger };
  }
}

// Seul point d'enregistrement des plugins, côté client uniquement.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip);
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_E2E === "1") window.__sfMotion = { ScrollTrigger };
}

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };

export const EASE = { out: "power3.out", expo: "expo.out", inOut: "power2.inOut" } as const;
export const DUR = { feedback: 0.12, state: 0.24, view: 0.42, signature: 0.9 } as const;
export const REDUCED = "(prefers-reduced-motion: reduce)";
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Masque « sous l'horizon » : tout est rogné par le bas, le haut apparaît en premier ; `inset(0)` = entièrement levé. */
export const BELOW_HORIZON = "inset(0% 0% 100% 0%)";

const noSubscribe = () => () => {};

/**
 * `true` au premier passage d'un composant hydraté (son HTML serveur est déjà peint) : ne pas le cacher
 * pour l'animer. `false` pour tout ce qui est monté côté client (navigation, contenu chargé ensuite) et
 * pour les passages suivants (page réaffichée par Activity). À appeler dans useGSAP :
 * `const hydrating = useHydrating(); useGSAP(() => { if (hydrating()) return; … })`.
 */
export function useHydrating(): () => boolean {
  // Instantané serveur pendant l'hydratation (y compris des frontières Suspense hydratées plus tard).
  const first = useRef(useSyncExternalStore(noSubscribe, () => false, () => true));
  return () => {
    const was = first.current;
    first.current = false;
    return was;
  };
}

/** Sous la ligne de flottaison : jamais vu avant l'hydratation, on peut l'animer au défilement. */
export const belowFold = (el: Element | null | undefined) => !!el && el.getBoundingClientRect().top >= window.innerHeight;

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
