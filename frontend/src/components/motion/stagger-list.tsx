"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { belowFold, DUR, gsap, MOTION_OK, rise, useGSAP, useHydrating, type RevealTrigger } from "@/lib/motion";

type Props = {
  as?: ElementType;
  trigger?: RevealTrigger;
  /** Anime aussi au premier chargement (HTML serveur déjà peint) : réservé aux moments signature. */
  firstLoad?: boolean;
  className?: string;
  children: ReactNode;
};

const TOTAL = 0.4; // la cascade entière tient en 400 ms

/** Enfants directs qui montent de l'horizon en cascade (≤ 400 ms au total). */
export function StaggerList({ as: Tag = "ul", trigger = "mount", firstLoad = false, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const hydrating = useHydrating();
  useGSAP(() => {
    const items = ref.current ? [...ref.current.children] : [];
    if (hydrating() && !firstLoad && !(trigger === "scroll" && belowFold(items[0]))) return;
    if (!items.length) return;
    gsap.matchMedia().add(MOTION_OK, () => {
      const each = items.length > 1 ? Math.min(0.06, (TOTAL - DUR.state) / (items.length - 1)) : 0;
      rise(items, { duration: DUR.state, stagger: each, trigger, distance: 16 });
    });
  });
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
