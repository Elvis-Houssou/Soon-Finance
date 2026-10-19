"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { DUR, gsap, MOTION_OK, rise, useGSAP, type RevealTrigger } from "@/lib/motion";

type Props = {
  as?: ElementType;
  trigger?: RevealTrigger;
  className?: string;
  children: ReactNode;
};

const TOTAL = 0.4; // la cascade entière tient en 400 ms

/** Enfants directs qui montent de l'horizon en cascade (≤ 400 ms au total). */
export function StaggerList({ as: Tag = "ul", trigger = "mount", className, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    const items = ref.current ? [...ref.current.children] : [];
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
