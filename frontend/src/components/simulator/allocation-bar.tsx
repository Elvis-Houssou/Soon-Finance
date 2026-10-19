"use client";

import { useRef, type CSSProperties } from "react";
import { DUR, EASE, gsap, MOTION_OK, useGSAP, useHydrating } from "@/lib/motion";
import type { Allocation } from "@/lib/simulation";
import { KIND_BG } from "./shared";

const SAVE = new Set(["save", "save2"]);

/**
 * Barre de répartition. Chaque segment occupe toute la piste et part de son bord gauche (`--x` %) : le suivant
 * le recouvre. Seul `translateX` bouge quand la répartition change (pas de largeur animée, pas de déformation),
 * et un écart de 3 px reste net. Sans JS, CSS seul place les segments. `replay` qui change = la barre se redessine
 * depuis la gauche ; à l'apparition côté client aussi.
 */
export function AllocationBar({ rows, replay }: { rows: Allocation[]; replay?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hydrating = useHydrating();
  const shown = rows.filter((r) => r.pct > 0);
  const sum = shown.reduce((a, r) => a + r.pct, 0) || 1;
  const segs = shown.map((r, i) => ({
    r,
    x: (shown.slice(0, i).reduce((a, q) => a + q.pct, 0) / sum) * 100,
    w: (r.pct / sum) * 100,
  }));
  const geom = segs.map((s) => `${s.x}:${s.w}`).join("|");
  const prev = useRef<{ x: number[]; w: number[]; replay?: string } | null>(null);
  const ok = useRef(false); // mouvement autorisé (suivi en direct)

  // Un seul matchMedia pour la vie du composant : les tweens de recomposition ne sont pas annulés à chaque
  // changement (on repart de la position à l'écran) ; passer en mouvement réduit pose l'état final.
  useGSAP(() => {
    gsap.matchMedia().add(MOTION_OK, () => {
      ok.current = true;
      return () => {
        ok.current = false;
        const els = [ref.current!, ...ref.current!.children];
        gsap.killTweensOf(els);
        gsap.set(els, { clearProps: "transform,filter,clipPath" });
      };
    });
  });

  useGSAP(
    () => {
      const els = [...ref.current!.children] as HTMLElement[];
      const before = prev.current;
      prev.current = { x: segs.map((s) => s.x), w: segs.map((s) => s.w), replay };
      if (hydrating() || !ok.current) return; // HTML serveur déjà peint ; mouvement réduit : état final direct
        if (!before || before.replay !== replay) {
          // Apparition : la barre se lève depuis la gauche, comme l'horizon qui se dessine.
          gsap.fromTo(ref.current, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.view, ease: EASE.expo, overwrite: true, clearProps: "clipPath" });
          return;
        }
        els.forEach((el, i) => {
          // En plein vol (transform en ligne) : on repart de la position à l'écran ; sinon de l'ancienne place
          // (nouveau segment : du bord droit). x: 0 car GSAP lit la translation CSS initiale en pixels.
          const from = el.style.transform ? (gsap.getProperty(el, "xPercent") as number) : (before.x[i] ?? 100);
          gsap.killTweensOf(el);
          gsap.set(el, { clearProps: "transform,filter" }); // jamais figé à mi-course
          if (from !== segs[i].x)
            gsap.fromTo(el, { x: 0, xPercent: from }, { x: 0, xPercent: segs[i].x, duration: DUR.state, ease: EASE.out, clearProps: "transform" });
          // L'épargne qui grandit reçoit un bref éclat menthe.
          if (SAVE.has(segs[i].r.kind) && segs[i].w > (before.w[i] ?? 0) + 0.01)
            gsap.fromTo(el, { filter: "brightness(1.35)" }, { filter: "brightness(1)", duration: DUR.view, ease: EASE.out, clearProps: "filter" });
        });
    },
    { dependencies: [geom, replay] },
  );

  return (
    <div ref={ref} data-bar aria-hidden="true" className="relative h-5 overflow-hidden rounded-full">
      {segs.map(({ r, x }, i) => (
        <div
          key={i}
          className={`absolute inset-0 ${KIND_BG[r.kind]} ${i ? "border-l-[3px] border-surface" : ""} [transform:translateX(calc(var(--x)*1%))] motion-safe:transition-colors`}
          style={{ "--x": x } as CSSProperties}
        />
      ))}
    </div>
  );
}
