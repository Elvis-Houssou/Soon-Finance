"use client";

import { useRef } from "react";
import { countFrames, DUR, EASE, gsap, MOTION_OK, useGSAP, useHydrating } from "@/lib/motion";

type Props = {
  value: number;
  /** Départ explicite ; par défaut la dernière valeur affichée (0 au premier rendu). */
  from?: number;
  format: (n: number) => string;
  duration?: number;
  /** Défile aussi au premier chargement (HTML serveur déjà peint) : réservé aux moments signature. */
  firstLoad?: boolean;
  className?: string;
};

/**
 * Montant qui défile jusqu'à `value`. Le HTML serveur et le texte final sont exactement `format(value)` ;
 * pas d'aria-live : les valeurs intermédiaires ne sont jamais annoncées. Mouvement réduit : saut direct.
 */
export function CountUp({ value, from, format, duration = DUR.signature, firstLoad = false, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0); // valeur numérique actuellement à l'écran
  const hydrating = useHydrating();

  useGSAP(
    () => {
      const text = ref.current?.firstChild;
      // Premier chargement : la valeur finale est déjà peinte, on ne la fait pas retomber à 0.
      const start = hydrating() && !firstLoad ? value : (from ?? shown.current);
      shown.current = value;
      if (!text) return;
      const final = format(value);
      text.nodeValue = final; // le nettoyage d'une animation interrompue a pu réécrire l'ancienne valeur
      if (start === value) return;
      gsap.matchMedia().add(MOTION_OK, (ctx) => {
        const frames = countFrames(start, value, format, Math.max(2, Math.round(duration * 60)));
        const toNumber = (i: number) => start + ((value - start) * i) / Math.max(frames.length - 1, 1);
        const state = { i: 0 };
        text.nodeValue = frames[0]; // avant la peinture : pas d'image intermédiaire à la valeur finale
        shown.current = start;
        let tween: gsap.core.Tween | undefined;
        // Hors contexte : un revert rejouerait onUpdate à 0 et fausserait la « dernière valeur affichée ».
        ctx.ignore(() => {
          tween = gsap.to(state, {
            i: frames.length - 1,
            duration,
            ease: EASE.expo,
            onUpdate: () => {
              const i = Math.round(state.i);
              text.nodeValue = frames[i];
              shown.current = toNumber(i);
            },
            onComplete: () => {
              text.nodeValue = final;
              shown.current = value;
            },
          });
        });
        // Interrompu (nouvelle valeur, démontage, bascule en mouvement réduit) : jamais figé à mi-course.
        return () => {
          tween?.kill();
          text.nodeValue = final;
        };
      });
    },
    // `format` est souvent une fonction en ligne : on suit son résultat (devise, langue), pas son identité.
    { dependencies: [value, format(value)], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
