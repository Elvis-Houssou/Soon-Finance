"use client";

import { useRef } from "react";
import { DUR, EASE, Flip, gsap, MOTION_OK, useGSAP } from "@/lib/motion";
import type { MethodData } from "@/lib/simulation";
import { usePress } from "../motion/press";
import type { SimStrings } from "./shared";

type Label = SimStrings["methods"][keyof SimStrings["methods"]];

function MethodCard({ id, label, checked, onPick, ring }: {
  id: string; label: Label; checked: boolean; onPick: () => void; ring: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <label
      ref={usePress<HTMLLabelElement>()}
      className="relative flex min-h-[52px] items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-4 text-left font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-on-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-ink"
    >
      <input
        type="radio" name="method" value={id} checked={checked}
        onChange={onPick}
        className="absolute inset-0 m-0 cursor-pointer opacity-0"
      />
      <span>{label.name}</span>
      <span className="text-[15px] font-normal text-muted [label:has(:checked)_&]:text-on-brand-muted">{label.hint}</span>
      {/* La carte choisie « s'allume » : un contour menthe, au-delà du contour de focus, qui glisse d'une carte à l'autre. */}
      {checked && (
        <span ref={ring} data-ring data-flip-id="method-ring" aria-hidden="true" className="pointer-events-none absolute -inset-1.5 rounded-[14px] border-2 border-brand" />
      )}
    </label>
  );
}

export function MethodPicker({
  methods, value, onChange, t,
}: { methods: MethodData[]; value: string; onChange: (id: string) => void; t: SimStrings }) {
  const ring = useRef<HTMLSpanElement>(null);
  const before = useRef<Flip.FlipState | null>(null);

  useGSAP(
    () => {
      const state = before.current;
      before.current = null;
      const el = ring.current;
      if (!state || !el) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        Flip.from(state, { targets: el, scale: true, duration: DUR.state, ease: EASE.out, onComplete: () => void gsap.set(el, { clearProps: "transform" }) });
      });
    },
    { dependencies: [value], revertOnUpdate: true },
  );

  return (
    <div role="radiogroup" aria-label={t.simulator.methodGroup} className="flex flex-col gap-2">
      {methods.map((m) => (
        <MethodCard
          key={m.id} id={m.id} label={t.methods[m.id as keyof SimStrings["methods"]]} checked={value === m.id} ring={ring}
          onPick={() => {
            // Position à l'écran du contour (même en plein vol), avant que React ne le déplace.
            before.current = ring.current ? Flip.getState(ring.current) : null;
            onChange(m.id);
          }}
        />
      ))}
    </div>
  );
}
