"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { fill } from "@/components/simulator/shared";

export type IndexItem = { slug: string; kind: "method" | "basics"; minutes: number; title: string; summary: string; hint?: string };
type Strings = {
  search: string; startHere: string; basics: string; methods: string; minutes: string;
  resultOne: string; resultMany: string; none: string;
};

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const CARD = "flex h-full min-h-11 flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-5 hover:border-ink";
const H2 = "text-[13px] font-semibold tracking-wide text-muted uppercase";

export function LearnIndex({ items, locale, t }: { items: IndexItem[]; locale: Locale; t: Strings }) {
  const [q, setQ] = useState("");
  const words = norm(q).split(/\s+/).filter(Boolean);
  const shown = items.filter((it) => {
    const hay = norm(`${it.title} ${it.summary}`);
    return words.every((w) => hay.includes(w));
  });
  const searching = words.length > 0;
  const basicsAll = shown.filter((i) => i.kind === "basics");
  const start = searching ? undefined : basicsAll[0];
  const basics = searching ? basicsAll : basicsAll.slice(1);
  const methods = shown.filter((i) => i.kind === "method");
  const href = (i: IndexItem) => `/${locale}/apprendre/${i.slug}`;
  const meta = (i: IndexItem) => fill(t.minutes, { n: i.minutes });
  const status = !searching ? "" : shown.length === 0 ? t.none : shown.length === 1 ? t.resultOne : fill(t.resultMany, { n: shown.length });

  return (
    <div className="flex flex-col gap-8">
      <label className="flex max-w-xl flex-col gap-1.5 text-[15px] font-semibold">
        {t.search}
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          className="min-h-11 rounded-[10px] border border-line-input bg-surface px-4 text-base font-normal"
        />
      </label>
      <p role="status" className="text-muted">{status}</p>
      {start && (
        <section aria-label={t.startHere} className="flex flex-col gap-3">
          <h2 className={H2}>{t.startHere}</h2>
          <Link href={href(start)} className="flex min-h-11 flex-col gap-2 rounded-[14px] bg-tint p-5 hover:outline-2 hover:outline-brand-ink sm:p-8">
            <span className="text-[13px] font-semibold text-brand-ink">{meta(start)} · {t.basics}</span>
            <span className="font-display text-2xl font-semibold sm:text-3xl">{start.title}</span>
            <span className="text-lg text-muted">{start.summary}</span>
          </Link>
        </section>
      )}
      {basics.length > 0 && (
        <section aria-label={t.basics} className="flex flex-col gap-3">
          <h2 className={H2}>{t.basics}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {basics.map((i) => (
              <li key={i.slug}>
                <Link href={href(i)} className={CARD}>
                  <span className="text-[13px] font-semibold text-brand-ink">{meta(i)}</span>
                  <span className="text-[17px] font-semibold">{i.title}</span>
                  <span className="text-[15px] text-muted">{i.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {methods.length > 0 && (
        <section aria-label={t.methods} className="flex flex-col gap-3">
          <h2 className={H2}>{t.methods}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map((i) => (
              <li key={i.slug}>
                <Link href={href(i)} className={CARD}>
                  <span className="text-[13px] font-semibold text-brand-ink">{i.hint}</span>
                  <span className="text-[17px] font-semibold">{i.title}</span>
                  <span className="text-[15px] text-muted">{i.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
