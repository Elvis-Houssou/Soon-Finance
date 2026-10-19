"use client";

import { useState } from "react";
import { CountUp } from "@/components/motion/count-up";
import { HorizonReveal } from "@/components/motion/horizon-reveal";
import { usePress } from "@/components/motion/press";
import { SplitHeading } from "@/components/motion/split-heading";
import { formatMoney } from "@/lib/money";

export function MotionLab() {
  const [value, setValue] = useState(500000);
  const [currency, setCurrency] = useState("XOF");
  const press = usePress<HTMLButtonElement>();
  return (
    <div className="container-site flex flex-col gap-4 py-8">
      <SplitHeading as="h1" text="Labo motion" className="font-display text-4xl font-bold" />
      <HorizonReveal>
        <p data-count className="font-mono text-2xl">
          <CountUp value={value} format={(n) => formatMoney(n, currency, "fr")} />
        </p>
      </HorizonReveal>
      <div className="flex gap-2">
        <button ref={press} className="min-h-11 rounded-[10px] bg-brand px-4 text-on-brand" onClick={() => setValue((v) => v + 123457)}>
          Ajouter
        </button>
        <button className="min-h-11 rounded-[10px] border border-line px-4" onClick={() => setCurrency("EUR")}>
          EUR
        </button>
      </div>
    </div>
  );
}
