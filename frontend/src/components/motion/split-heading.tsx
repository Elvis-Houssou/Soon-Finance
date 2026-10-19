"use client";

import { useRef } from "react";
import { DUR, EASE, gsap, MOTION_OK, SplitText, useGSAP, useHydrating } from "@/lib/motion";

type Props = {
  as?: "h1" | "h2" | "h3";
  text: string;
  delay?: number;
  /** Anime aussi au premier chargement (HTML serveur déjà peint) : réservé aux moments signature. */
  firstLoad?: boolean;
  className?: string;
};

/**
 * Titre dont les mots montent derrière une ligne d'horizon. Le texte entier reste l'aria-label pendant
 * l'animation (mots aria-hidden) ; le découpage est annulé à la fin. Mouvement réduit : titre simple.
 */
export function SplitHeading({ as: Tag = "h2", text, delay = 0, firstLoad = false, className }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const hydrating = useHydrating();
  useGSAP(
    () => {
      if (hydrating() && !firstLoad) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        const split = SplitText.create(ref.current, { type: "words", mask: "words", tag: "span", aria: "auto" });
        gsap.set(split.masks, { display: "inline-block" }); // un span inline ne rogne pas : la ligne d'horizon de chaque mot
        gsap.from(split.words, {
          yPercent: 110,
          duration: DUR.view * 1.5,
          stagger: 0.06,
          ease: EASE.expo,
          delay,
          onComplete: () => split.revert(),
        });
      });
    },
    { dependencies: [text], revertOnUpdate: true },
  );
  // key : un nouveau texte remonte l'élément, React ne touche jamais au DOM découpé par SplitText.
  return (
    <Tag key={text} ref={ref} className={className}>
      {text}
    </Tag>
  );
}
