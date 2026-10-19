"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_OK, rise, useGSAP, type RevealTrigger } from "@/lib/motion";

type Props = {
  as?: ElementType;
  delay?: number;
  trigger?: RevealTrigger;
  className?: string;
  children: ReactNode;
};

/** Révèle ses enfants en les faisant monter derrière une ligne d'horizon. Visible sans JS et en mouvement réduit. */
export function HorizonReveal({ as: Tag = "div", delay = 0, trigger = "mount", className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
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
