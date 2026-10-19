"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, MOTION_OK, ScrollTrigger } from "@/lib/motion";

let lenis: Lenis | null = null;

/** Défilement doux sur tout le site, synchronisé avec ScrollTrigger. Absent en mouvement réduit (défilement natif). */
export function SmoothScroll() {
  const path = usePathname();

  useEffect(() => {
    if (!matchMedia(MOTION_OK).matches) return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // En-tête : ombre portée dès qu'on a quitté le haut de page.
  useEffect(() => {
    const onScroll = () => document.documentElement.toggleAttribute("data-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nouvelle page : on repart du haut sans glisser depuis la position précédente.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [path]);

  return null;
}

/** Glisse jusqu'à un élément (instantané sans défilement doux). */
export function smoothScrollTo(el: HTMLElement | null, offset = -96) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
  else el.scrollIntoView({ block: "start" });
}
