"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
import type { Kind, Simulation } from "@/lib/simulation";
import { BELOW_HORIZON, DUR, EASE, gsap, MOTION_OK, rise, useGSAP } from "@/lib/motion";
import { usePress } from "../motion/press";
import { fill, FIELD, type SimStrings } from "./shared";

const KINDS: Kind[] = ["need", "want", "save", "save2", "give", "learn"];
type Custom = Simulation["custom"];

export function CustomEditor({ custom, onChange, t }: { custom: Custom; onChange: (c: Custom) => void; t: SimStrings }) {
  const s = t.simulator;
  const total = custom.reduce((a, e) => a + e.pct, 0);
  const set = (i: number, patch: Partial<Custom[number]>) =>
    onChange(custom.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const btn = "flex min-h-11 items-center justify-center rounded-[10px] border border-line-input px-4 font-semibold disabled:opacity-50";

  const root = useRef<HTMLElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const prev = useRef({ count: custom.length, exact: total === 100 });
  const ghosts = useRef(new Set<HTMLElement>());

  useGSAP(
    () => {
      const was = prev.current;
      prev.current = { count: custom.length, exact: total === 100 };
      gsap.matchMedia().add(MOTION_OK, () => {
        // Enveloppe ajoutée : elle monte de l'horizon.
        if (custom.length > was.count) rise(root.current!.querySelectorAll("[data-env]")[custom.length - 1], { duration: DUR.state, distance: 16 });
        // Le total atteint 100 % : il passe au vert avec une brève impulsion.
        if (total === 100 && !was.exact)
          gsap.fromTo(status.current, { scale: 1.04 }, { scale: 1, duration: DUR.view, ease: EASE.out, clearProps: "transform" });
      });
    },
    { dependencies: [custom.length, total === 100], scope: root, revertOnUpdate: true },
  );
  // Contexte stable pour les sorties (pas révoqué à chaque changement) ; au démontage, les fantômes disparaissent.
  const { contextSafe } = useGSAP(() => () => ghosts.current.forEach((g) => g.remove()), { scope: root });

  // La suppression est appliquée tout de suite. Ce qui sort est un fantôme (copie inerte, position fixe) qui
  // redescend sous l'horizon pendant que les éléments suivants glissent à leur nouvelle place (FLIP).
  const remove = (i: number) => {
    const before = [...root.current!.children] as HTMLElement[];
    const motion = window.matchMedia(MOTION_OK).matches;
    const rects = motion ? before.map((el) => el.getBoundingClientRect()) : [];
    const row = before[1 + i]; // enfants : titre, enveloppes…, bouton, total
    const ghost = motion ? (row.cloneNode(true) as HTMLElement) : null;
    // Avant la mise à jour : ce nœud servira ensuite à l'enveloppe suivante (clé = rang).
    if (ghost) row.querySelectorAll("select").forEach((sel, k) => (ghost.querySelectorAll("select")[k].value = sel.value));
    flushSync(() => onChange(custom.filter((_, j) => j !== i)));
    if (!ghost) return;
    contextSafe(() => {
      const r = rects[1 + i];
      // Fond opaque : la ligne qui glisse dessous ne transparaît pas.
      Object.assign(ghost.style, {
        background: getComputedStyle(document.body).backgroundColor,
        position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: "0", pointerEvents: "none", zIndex: "1" });
      ghost.setAttribute("aria-hidden", "true");
      ghost.querySelectorAll("[aria-label]").forEach((el) => el.removeAttribute("aria-label")); // jamais confondu avec un vrai champ
      ghost.inert = true;
      document.body.append(ghost);
      ghosts.current.add(ghost);
      const drop = () => { ghost.remove(); ghosts.current.delete(ghost); };
      gsap.to(ghost, { clipPath: BELOW_HORIZON, y: 12, opacity: 0, duration: DUR.state * 0.7, ease: "power2.in", onComplete: drop });
      // Le nœud à l'index m montre maintenant ce qui était à m + 1 (clé = rang) : il part de cette ancienne place.
      const after = [...root.current!.children] as HTMLElement[];
      after.forEach((el, m) => {
        if (m < 1 + i) return;
        gsap.killTweensOf(el);
        gsap.set(el, { clearProps: "transform,clipPath,opacity" });
        const dy = rects[m + 1].top - el.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.5) gsap.fromTo(el, { y: dy }, { y: 0, duration: DUR.state, ease: EASE.out, clearProps: "transform" });
      });
    })();
  };

  return (
    <section ref={root} aria-label={s.customTitle} className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">{s.customTitle}</h2>
      {custom.map((e, i) => (
        <div key={i} data-env className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
          <input
            aria-label={fill(s.name, { n: i + 1 })} className={FIELD} maxLength={40}
            value={(t.envelopes as Record<string, string>)[e.name] ?? e.name}
            onChange={(ev) => set(i, { name: ev.target.value })}
          />
          <div className="flex gap-2">
            <select
              aria-label={fill(s.kind, { n: i + 1 })} className={FIELD} value={e.kind}
              onChange={(ev) => set(i, { kind: ev.target.value as Kind })}
            >
              {KINDS.map((k) => <option key={k} value={k}>{t.kinds[k]}</option>)}
            </select>
            {/* w-20! : FIELD porte w-full, généré après w-20 dans la feuille de style. */}
            <input
              aria-label={fill(s.pct, { n: i + 1 })} inputMode="numeric" autoComplete="off"
              className={`${FIELD} w-20! shrink-0 text-right`} value={e.pct}
              onChange={(ev) => set(i, { pct: Math.min(100, Number(ev.target.value.replace(/\D/g, "").slice(0, 3)) || 0) })}
            />
            <RemoveButton
              label={fill(s.remove, { n: i + 1 })} disabled={custom.length <= 1}
              className={`${btn} w-11 shrink-0 px-0`} onClick={() => contextSafe(() => remove(i))()}
            />
          </div>
        </div>
      ))}
      <button
        ref={usePress<HTMLButtonElement>()}
        type="button" disabled={custom.length >= 8} className={btn}
        onClick={() => onChange([...custom, { name: "", kind: "want", pct: 0 }])}
      >
        {s.add}
      </button>
      <p
        ref={status} role="status" aria-live="polite"
        className={`rounded-[10px] px-4 py-3.5 text-[15px] motion-safe:transition-colors ${total === 100 ? "bg-tint text-brand-ink" : "bg-sunken text-warning"}`}
      >
        {total === 100 ? s.exact : fill(total < 100 ? s.under : s.over, { total, rest: Math.abs(100 - total) })}
      </p>
    </section>
  );
}

function RemoveButton({ label, disabled, className, onClick }: { label: string; disabled: boolean; className: string; onClick: () => void }) {
  return (
    <button ref={usePress<HTMLButtonElement>()} type="button" aria-label={label} disabled={disabled} className={className} onClick={onClick}>
      ×
    </button>
  );
}
