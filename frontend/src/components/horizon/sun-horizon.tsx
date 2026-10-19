"use client";

import { useEffect, useState } from "react";

const MAX = 12;
const clamp = (n: number) => Math.max(0, Math.min(MAX, Math.round(n)));
// Règle de la maquette ; 0 cran : le soleil reste sous l'horizon.
const sunY = (steps: number) => (steps === 0 ? 112 : 101 - steps * 7.5);

type Props = { steps: number; previousSteps?: number; size?: "md" | "lg"; label: string };

/** Soleil qui monte d'un cran par mois de progression. Animé de previousSteps à steps (CSS, coupé si prefers-reduced-motion). */
export function SunHorizon({ steps, previousSteps, size = "md", label }: Props) {
  const target = clamp(steps);
  const [shown, setShown] = useState(previousSteps === undefined ? target : clamp(previousSteps));
  // Le décalage d'un rendu permet à la transition CSS de partir de l'ancienne hauteur.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setShown(target), [target]);

  return (
    <svg
      viewBox="0 0 320 112" role="img" aria-label={label}
      className={`block w-full ${size === "lg" ? "max-w-xl" : "max-w-md"}`}
    >
      <circle
        data-sun cx="160" cy="0" r="30"
        className="fill-brand transition-transform duration-1000 ease-out"
        style={{ transform: `translateY(${sunY(shown)}px)` }}
      />
      <rect x="0" y="86" width="320" height="26" className="fill-sunken" />
      <rect x="0" y="85" width="320" height="2" className="fill-line-input" />
      {Array.from({ length: MAX }, (_, i) => (
        <circle
          key={i} cx={22 + 25 * i} cy="100" r={i < target ? 4 : 3}
          className={i < target ? "fill-brand-ink" : "fill-line-input"}
        />
      ))}
    </svg>
  );
}
