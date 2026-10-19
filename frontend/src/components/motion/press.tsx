"use client";

import { useRef } from "react";
import { DUR, EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion";

/**
 * Retour tactile (scale 0.97, 120 ms) pour un bouton ou une carte cliquable : `ref={usePress<HTMLButtonElement>()}`.
 * Mouvement réduit : aucun effet.
 */
export function usePress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    gsap.matchMedia().add(MOTION_OK, (_, contextSafe) => {
      const to = (scale: number) =>
        contextSafe!(() => gsap.to(el, { scale, duration: DUR.feedback, ease: EASE.out, overwrite: "auto" })) as () => void;
      const down = to(0.97);
      const up = to(1);
      const events = ["pointerup", "pointerleave", "pointercancel"] as const;
      el.addEventListener("pointerdown", down);
      events.forEach((e) => el.addEventListener(e, up));
      return () => {
        el.removeEventListener("pointerdown", down);
        events.forEach((e) => el.removeEventListener(e, up));
      };
    });
  });
  return ref;
}
