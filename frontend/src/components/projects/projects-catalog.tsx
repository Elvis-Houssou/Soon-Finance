"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { businessProjects, projectCategories } from "@/lib/business-projects";

const money=(n:number,locale:Locale)=>new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{style:"currency",currency:"XOF",maximumFractionDigits:0}).format(n);

export function ProjectsCatalog({locale}:{locale:Locale}){
 const fr=locale==="fr";const [category,setCategory]=useState("all");
 const visible=useMemo(()=>businessProjects.filter(p=>category==="all"||p.category===category),[category]);
 const label=(value:Record<"fr"|"en",string>)=>value[fr?"fr":"en"];
 return <div className="container-site flex flex-col gap-8 py-8 sm:py-12">
  <header className="max-w-3xl space-y-3">
   <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Soon Finance · {fr?"Opportunités entrepreneuriales":"Business opportunities"}</p>
   <h1 className="font-display text-3xl font-semibold sm:text-5xl">{fr?"Des idées d’activités pour faire grandir ton capital.":"Business ideas to put your capital to work."}</h1>
   <p className="text-muted sm:text-lg">{fr?"Découvre des activités commerciales, agricoles et de services à lancer. Évalue le capital nécessaire, les clients, les charges et les risques avant de te décider.":"Explore retail, agriculture and service businesses to launch. Assess capital, customers, costs and risks before deciding."}</p>
  </header>
  <div className="flex flex-wrap gap-2" aria-label={fr?"Filtrer les activités":"Filter activities"}>{projectCategories.map(c=><button key={c.id} type="button" onClick={()=>setCategory(c.id)} aria-pressed={category===c.id} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${category===c.id?"border-brand bg-brand text-on-brand":"border-line bg-surface text-muted hover:text-ink"}`}>{fr?c.fr:c.en}</button>)}</div>
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(p=><article key={p.id} className="flex flex-col gap-4 rounded-[16px] border border-line bg-surface p-5">
   <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-sunken px-3 py-1 text-xs font-semibold text-muted">{fr?(projectCategories.find(c=>c.id===p.category)?.fr??"Activité"):(projectCategories.find(c=>c.id===p.category)?.en??"Business")}</span><span className="text-xs text-muted">{label(p.duration)}</span></div>
   <div><h2 className="font-display text-xl font-semibold">{label(p.title)}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{label(p.summary)}</p></div>
   <div className="rounded-[10px] bg-sunken p-3"><p className="text-xs text-muted">{fr?"Capital de lancement estimatif":"Estimated startup capital"}</p><p className="mt-1 text-lg font-semibold tabular-nums">{money(p.budgetMin,locale)} – {money(p.budgetMax,locale)}</p><p className="mt-1 text-xs text-muted">{fr?"Fourchette indicative à vérifier localement":"Indicative range to validate locally"}</p></div>
   <div className="space-y-1"><h3 className="text-sm font-semibold">{fr?"Clients possibles":"Potential customers"}</h3><p className="text-sm text-muted">{label(p.customers)}</p></div>
   <div className="space-y-1"><h3 className="text-sm font-semibold">{fr?"Comment l’activité génère des revenus":"How the business earns revenue"}</h3><p className="text-sm text-muted">{label(p.revenue)}</p></div>
   <details className="rounded-[10px] border border-line p-3"><summary className="cursor-pointer text-sm font-semibold">{fr?"Charges, premier test et risques":"Costs, first test and risks"}</summary><div className="mt-3 space-y-3 text-sm"><div><h4 className="font-semibold">{fr?"Charges à anticiper":"Costs to plan"}</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{p.costs[fr?"fr":"en"].map(x=><li key={x}>{x}</li>)}</ul></div><div><h4 className="font-semibold">{fr?"Premier test conseillé":"Suggested first test"}</h4><p className="mt-1 text-muted">{label(p.firstTest)}</p></div><div><h4 className="font-semibold">{fr?"Risques à examiner":"Risks to examine"}</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{p.risks[fr?"fr":"en"].map(x=><li key={x}>{x}</li>)}</ul></div></div></details>
   <Link href={`/${locale}/objectifs?projet=${p.id}`} className="mt-auto flex min-h-11 items-center justify-center rounded-[10px] bg-brand px-4 text-center text-sm font-semibold text-on-brand">{fr?"Préparer mon capital de lancement":"Plan my startup capital"}</Link>
  </article>)}</section>
  <p className="text-xs leading-relaxed text-muted">{fr?"Les fourchettes de capital sont des ordres de grandeur illustratifs, non des devis ni des données de rentabilité vérifiées. Les revenus ne sont pas des bénéfices : déduis stock, transport, salaires, loyer, pertes, impôts et autres charges. Vérifie les prix, autorisations et débouchés dans ta zone avant d’investir.":"Capital ranges are illustrative estimates, not quotes or verified profitability data. Revenue is not profit: deduct stock, transport, wages, rent, losses, taxes and other costs. Verify local prices, permits and demand before investing."}</p>
 </div>;
}
