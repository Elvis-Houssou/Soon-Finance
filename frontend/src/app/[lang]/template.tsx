"use client";

import { useRef } from "react";
import { EASE, gsap, MOTION_OK, REDUCED, useGSAP, useHydrating } from "@/lib/motion";

/**
 * Entrée de page (navigation client ou page réaffichée) : le contenu se lève depuis le haut, un trait menthe
 * balaie le haut de page. Jamais de transform sur [data-page] : il deviendrait le bloc conteneur de la barre
 * de compte `position: fixed` (mobile). Premier chargement : rien, le HTML serveur est déjà peint.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const hydrating = useHydrating();

  useGSAP(
    () => {
      if (hydrating()) return;
      const page = root.current?.querySelector<HTMLElement>("[data-page]");
      if (!page) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Masque levé en px sur la partie visible : le haut de l'écran apparaît d'abord, sur toute la durée.
        const height = page.offsetHeight;
        const hidden = Math.max(0, height - (window.innerHeight - page.getBoundingClientRect().top));
        gsap
          .timeline({ defaults: { ease: EASE.out } })
          .fromTo(
            page,
            { opacity: 0, clipPath: `inset(0px 0px ${height}px 0px)` },
            { opacity: 1, clipPath: `inset(0px 0px ${hidden}px 0px)`, duration: 0.38, clearProps: "opacity,clipPath" },
          )
          .fromTo("[data-horizon]", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.3 }, 0)
          .to("[data-horizon]", { scaleX: 0, transformOrigin: "right center", duration: 0.25, ease: EASE.inOut });
      });
      mm.add(REDUCED, () => {
        gsap.fromTo(page, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", clearProps: "opacity" });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      <div aria-hidden="true" data-horizon className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-brand" style={{ transform: "scaleX(0)" }} />
      <div data-page>{children}</div>
    </div>
  );
}
