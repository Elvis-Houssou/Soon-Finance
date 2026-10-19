"use client";

import { useCallback, type RefCallback, type RefObject } from "react";
import { DUR, EASE, gsap, MOTION_OK } from "@/lib/motion";

/**
 * Retour tactile (scale 0.97, 120 ms) pour un bouton ou une carte cliquable :
 * `<button ref={usePress()}>` ou, avec une ref existante, `<button ref={usePress(myRef)}>`.
 * Ref callback : suit l'élément même s'il apparaît plus tard. Transform nettoyé après chaque appui
 * (un ancêtre transformé déplacerait ses descendants `position: fixed`). Mouvement réduit : aucun effet.
 */
export function usePress<T extends HTMLElement>(ref?: RefObject<T | null>): RefCallback<T> {
  return useCallback(
    (el: T | null) => {
      if (ref) ref.current = el;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, (_, contextSafe) => {
        const to = (scale: number) =>
          contextSafe!(() =>
            gsap.to(el, {
              scale,
              duration: DUR.feedback,
              ease: EASE.out,
              overwrite: "auto",
              clearProps: scale === 1 ? "transform" : undefined,
            }),
          ) as () => void;
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
      return () => {
        mm.revert();
        if (ref) ref.current = null;
      };
    },
    [ref],
  );
}
