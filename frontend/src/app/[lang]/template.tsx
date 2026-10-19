"use client";

import { useRef } from "react";
import { EASE, gsap, MOTION_OK, REDUCED, useGSAP } from "@/lib/motion";

// Premier rendu du document : le HTML serveur est déjà peint, on ne le cache pas à l'hydratation.
let booted = false;

/** Remonté à chaque navigation : le contenu monte de l'horizon, un trait menthe balaie le haut de page. */
export default function Template({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!booted) {
        booted = true;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE.out } })
          .fromTo("[data-page]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.38, clearProps: "opacity,transform" })
          .fromTo("[data-horizon]", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.3 }, 0)
          .to("[data-horizon]", { scaleX: 0, transformOrigin: "right center", duration: 0.25, ease: EASE.inOut });
      });
      mm.add(REDUCED, () => {
        gsap.fromTo("[data-page]", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", clearProps: "opacity" });
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
