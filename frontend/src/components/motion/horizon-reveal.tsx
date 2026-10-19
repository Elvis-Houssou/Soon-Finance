"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { belowFold, gsap, MOTION_OK, rise, useGSAP, useHydrating, type RevealTrigger } from "@/lib/motion";

type Props = {
  as?: ElementType;
  delay?: number;
  trigger?: RevealTrigger;
  /** Anime aussi au premier chargement (HTML serveur déjà peint) : réservé aux moments signature. */
  firstLoad?: boolean;
  className?: string;
  children: ReactNode;
};

/** Révèle ses enfants en les faisant monter derrière une ligne d'horizon. Visible sans JS et en mouvement réduit. */
export function HorizonReveal({ as: Tag = "div", delay = 0, trigger = "mount", firstLoad = false, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const hydrating = useHydrating();
  useGSAP(() => {
    if (hydrating() && !firstLoad && !(trigger === "scroll" && belowFold(ref.current))) return;
    gsap.matchMedia().add(MOTION_OK, () => {
      rise(ref.current, { delay, trigger });
    });
  });
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
