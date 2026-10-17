"use client";

import { useSyncExternalStore } from "react";
import { readPreference, resolveTheme, setPreference, subscribe, type ThemePreference } from "@/lib/theme";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const SunIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg {...iconProps}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

function usePreference(): ThemePreference {
  // Côté serveur, on ne connaît pas le réglage de l'appareil : "system" est la valeur neutre.
  return useSyncExternalStore(subscribe, readPreference, () => "system");
}

type ToggleLabels = { toLight: string; toDark: string };

/** Bouton soleil/lune de l'en-tête : bascule vers le thème opposé au thème affiché. */
export function ThemeToggle({ labels }: { labels: ToggleLabels }) {
  const theme = useSyncExternalStore(
    subscribe,
    () => resolveTheme(readPreference()),
    () => null,
  );

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolveTheme(readPreference()) === "dark" ? "light" : "dark";
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      setPreference(next);
      return;
    }

    // Le nouveau thème se dévoile en cercle à partir du bouton.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.classList.add("theme-vt");
    const transition = doc.startViewTransition(() => setPreference(next));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 600, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
    transition.finished.catch(() => {}).finally(() => root.classList.remove("theme-vt"));
  };

  // Les icônes sont affichées par CSS selon le thème effectif (pas de flash à l'hydratation).
  const label = theme === "dark" ? labels.toLight : theme === "light" ? labels.toDark : `${labels.toLight} / ${labels.toDark}`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
    >
      <span className="when-dark">
        <SunIcon />
      </span>
      <span className="when-light">
        <MoonIcon />
      </span>
    </button>
  );
}

type PreferenceLabels = { label: string; auto: string; light: string; dark: string };

/** Choix explicite Auto / Clair / Sombre (pied de page) : "Auto" revient au réglage de l'appareil. */
export function ThemePreferencePicker({ labels }: { labels: PreferenceLabels }) {
  const preference = usePreference();
  const options: { value: ThemePreference; label: string }[] = [
    { value: "system", label: labels.auto },
    { value: "light", label: labels.light },
    { value: "dark", label: labels.dark },
  ];

  return (
    <div role="group" aria-label={labels.label} className="inline-flex rounded-full border border-line p-0.5">
      {options.map((option) => {
        const checked = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={checked}
            onClick={() => setPreference(option.value)}
            className={`min-h-11 cursor-pointer rounded-full px-4 font-mono text-xs font-medium transition-colors ${
              checked ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
