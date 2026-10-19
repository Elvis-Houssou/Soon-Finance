"use client";

import { useRef } from "react";
import { BELOW_HORIZON, belowFold, EASE, gsap, MOTION_OK, REDUCED, rise, ScrollTrigger, useGSAP, useHydrating } from "@/lib/motion";

/** Blocs révélés au défilement sur toutes les pages (les sections qui gèrent leur propre entrée portent data-reveal). */
const BLOCKS = "section, article, form, li, h2, figure, table";

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

  // Au défilement, chaque bloc encore sous la ligne de flottaison se lève à son tour, y compris le contenu
  // chargé plus tard (tableau de bord, historique…) : un MutationObserver relance la recherche.
  useGSAP(
    () => {
      const page = root.current?.querySelector<HTMLElement>("[data-page]");
      if (!page) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        const seen = new WeakSet<Element>();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const scan = () => {
          const fresh = [...page.querySelectorAll<HTMLElement>(BLOCKS)].filter(
            (el) => !seen.has(el) && !el.closest("[data-reveal], [data-no-reveal], nav, [aria-hidden=true]"),
          );
          fresh.forEach((el) => seen.add(el));
          // Barres et jauges (data-grow="x" | "y") : elles poussent depuis leur base quand elles arrivent à l'écran.
          const grow = [...page.querySelectorAll<HTMLElement>("[data-grow]")].filter((el) => !seen.has(el));
          grow.forEach((el) => {
            seen.add(el);
            const y = el.dataset.grow === "y";
            gsap.from(el, {
              [y ? "scaleY" : "scaleX"]: 0,
              transformOrigin: y ? "50% 100%" : "0% 50%",
              duration: 1.1,
              ease: EASE.expo,
              delay: 0.05 * [...(el.parentElement?.parentElement?.children ?? [])].indexOf(el.parentElement as Element),
              clearProps: "transform",
              scrollTrigger: { trigger: el, start: "top 96%", once: true },
            });
          });
          const below = fresh.filter(belowFold);
          // Le plus extérieur seulement : un bloc déjà animé emporte ses enfants.
          const targets = below.filter((el) => !below.some((o) => o !== el && o.contains(el)));
          if (!targets.length) return;
          gsap.set(targets, { clipPath: BELOW_HORIZON, y: 40 });
          ScrollTrigger.batch(targets, {
            start: "top 94%",
            once: true,
            onEnter: (batch) => rise(batch, { distance: 40, duration: 0.9, stagger: 0.07 }),
          });
        };
        scan();
        const mo = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(scan, 80);
        });
        mo.observe(page, { childList: true, subtree: true });
        return () => {
          mo.disconnect();
          clearTimeout(timer);
        };
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
