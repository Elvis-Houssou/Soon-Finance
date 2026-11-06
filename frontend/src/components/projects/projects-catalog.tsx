"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";

type Project = {
  id: string; category: string; title: Record<"fr" | "en", string>;
  summary: Record<"fr" | "en", string>; budget: number; months: string;
  steps: Record<"fr" | "en", string[]>;
};

const projects: Project[] = [
  { id:"computer",category:"equipment",title:{fr:"Acheter un ordinateur",en:"Buy a computer"},summary:{fr:"Préparer l’achat d’un ordinateur adapté aux études, au travail ou à une activité professionnelle.",en:"Plan the purchase of a computer suited to study, work or a professional activity."},budget:450000,months:"3–8",steps:{fr:["Définir l’usage et les caractéristiques nécessaires","Comparer plusieurs modèles et garanties","Prévoir les accessoires et une marge"],en:["Define the intended use and required specifications","Compare models and warranties","Budget for accessories and a contingency"]}},
  { id:"phone",category:"equipment",title:{fr:"Acheter un téléphone",en:"Buy a phone"},summary:{fr:"Prévoir un téléphone fiable en tenant compte des accessoires et de la durée d’utilisation.",en:"Plan for a reliable phone, including accessories and expected lifespan."},budget:180000,months:"2–5",steps:{fr:["Définir le budget maximum","Comparer autonomie, mémoire et garantie","Inclure coque, protection et accessoires"],en:["Set a maximum budget","Compare battery, storage and warranty","Include a case, screen protector and accessories"]}},
  { id:"housing",category:"housing",title:{fr:"Préparer un logement",en:"Prepare a home"},summary:{fr:"Constituer le budget nécessaire pour une installation : caution, avance, équipement et premiers frais.",en:"Build the funds needed to move in: deposit, rent advance, equipment and initial expenses."},budget:1200000,months:"6–18",steps:{fr:["Estimer caution et avance de loyer","Lister les équipements prioritaires","Prévoir transport et frais d’installation"],en:["Estimate deposit and rent advance","List essential household items","Budget for moving and setup costs"]}},
  { id:"business-launch",category:"business",title:{fr:"Lancer une petite activité",en:"Start a small business"},summary:{fr:"Préparer le financement d’un démarrage progressif : matériel, stock initial et fonctionnement.",en:"Plan the funding for a gradual launch: equipment, initial stock and operating costs."},budget:750000,months:"4–12",steps:{fr:["Valider le besoin et les premiers clients","Chiffrer matériel, stock et formalités","Prévoir une trésorerie de départ"],en:["Validate demand and first customers","Estimate equipment, stock and setup costs","Set aside initial working capital"]}},
  { id:"training",category:"education",title:{fr:"Financer une formation",en:"Fund a course"},summary:{fr:"Épargner pour une formation certifiante ou professionnelle, avec les frais annexes.",en:"Save for a professional or certification course, including additional costs."},budget:300000,months:"2–10",steps:{fr:["Comparer les programmes et leur reconnaissance","Ajouter inscription, supports et examens","Planifier les dates de paiement"],en:["Compare programmes and recognition","Include registration, materials and exams","Plan payment dates"]}},
  { id:"trip",category:"travel",title:{fr:"Préparer un voyage",en:"Plan a trip"},summary:{fr:"Construire un budget de voyage qui couvre le transport, le séjour et les dépenses sur place.",en:"Build a travel budget covering transport, accommodation and spending."},budget:600000,months:"4–12",steps:{fr:["Estimer transport et hébergement","Prévoir repas, déplacements et activités","Ajouter une marge pour imprévus"],en:["Estimate transport and accommodation","Budget for meals, local transport and activities","Add a contingency margin"]}},
  { id:"vehicle",category:"mobility",title:{fr:"Acheter un véhicule",en:"Buy a vehicle"},summary:{fr:"Préparer l’achat et les premiers frais d’un moyen de transport adapté à ses besoins.",en:"Plan the purchase and initial costs of a vehicle suited to your needs."},budget:2500000,months:"12–36",steps:{fr:["Définir le type de véhicule et le plafond d’achat","Vérifier état, papiers et historique","Prévoir assurance, entretien et formalités"],en:["Choose vehicle type and purchase ceiling","Check condition, documents and history","Budget for insurance, maintenance and paperwork"]}},
  { id:"custom",category:"personal",title:{fr:"Créer un projet personnel",en:"Create a personal project"},summary:{fr:"Transformer une idée personnelle en étapes chiffrées et en objectif d’épargne concret.",en:"Turn a personal idea into costed steps and a concrete savings goal."},budget:500000,months:"3–12",steps:{fr:["Décrire le résultat attendu","Découper le projet en étapes","Estimer chaque étape et fixer une échéance"],en:["Describe the intended outcome","Break the project into stages","Estimate each stage and set a target date"]}},
];
const categories = [
  {id:"all",fr:"Tous les projets",en:"All projects"},{id:"equipment",fr:"Équipement",en:"Equipment"},
  {id:"housing",fr:"Logement",en:"Housing"},{id:"business",fr:"Entrepreneuriat",en:"Business"},
  {id:"education",fr:"Formation",en:"Education"},{id:"travel",fr:"Voyage",en:"Travel"},
  {id:"mobility",fr:"Mobilité",en:"Mobility"},{id:"personal",fr:"Personnel",en:"Personal"},
];
const money=(n:number,locale:Locale)=>new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{style:"currency",currency:"XOF",maximumFractionDigits:0}).format(n);

export function ProjectsCatalog({locale}:{locale:Locale}){
 const fr=locale==="fr";const [category,setCategory]=useState("all");
 const visible=useMemo(()=>projects.filter(p=>category==="all"||p.category===category),[category]);
 return <div className="container-site flex flex-col gap-8 py-8 sm:py-12">
  <header className="max-w-3xl space-y-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Soon Finance · {fr?"Catalogue":"Catalogue"}</p><h1 className="font-display text-3xl font-semibold sm:text-5xl">{fr?"Des projets concrets, un plan pour les réaliser.":"Real projects, a plan to make them happen."}</h1><p className="text-muted sm:text-lg">{fr?"Explore des idées de projets, découvre les étapes à prévoir et transforme celui qui te correspond en objectif d’épargne.":"Explore project ideas, see the steps to plan and turn the one that fits you into a savings goal."}</p></header>
  <div className="flex flex-wrap gap-2" aria-label={fr?"Filtrer les projets":"Filter projects"}>{categories.map(c=><button key={c.id} type="button" onClick={()=>setCategory(c.id)} aria-pressed={category===c.id} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${category===c.id?"border-brand bg-brand text-on-brand":"border-line bg-surface text-muted hover:text-ink"}`}>{fr?c.fr:c.en}</button>)}</div>
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(p=><article key={p.id} className="flex flex-col gap-4 rounded-[16px] border border-line bg-surface p-5">
   <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-sunken px-3 py-1 text-xs font-semibold text-muted">{fr?(categories.find(c=>c.id===p.category)?.fr??"Projet"):(categories.find(c=>c.id===p.category)?.en??"Project")}</span><span className="text-xs text-muted">{fr?"Durée indicative":"Indicative term"} · {p.months} {fr?"mois":"months"}</span></div>
   <div><h2 className="font-display text-xl font-semibold">{p.title[fr?"fr":"en"]}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{p.summary[fr?"fr":"en"]}</p></div>
   <div className="rounded-[10px] bg-sunken p-3"><p className="text-xs text-muted">{fr?"Budget indicatif à personnaliser":"Indicative budget to customize"}</p><p className="mt-1 text-lg font-semibold tabular-nums">{money(p.budget,locale)}</p></div>
   <div className="flex-1"><h3 className="mb-2 text-sm font-semibold">{fr?"Étapes à prévoir":"Steps to plan"}</h3><ol className="list-decimal space-y-1 pl-5 text-sm text-muted">{p.steps[fr?"fr":"en"].map(s=><li key={s}>{s}</li>)}</ol></div>
   <Link href={`/${locale}/objectifs?projet=${p.id}`} className="flex min-h-11 items-center justify-center rounded-[10px] bg-brand px-4 text-center text-sm font-semibold text-on-brand">{fr?"Lier à un objectif":"Link to a goal"}</Link>
  </article>)}</section>
  <p className="text-xs leading-relaxed text-muted">{fr?"Les budgets et durées sont des exemples indicatifs en FCFA, pas des devis. Adapte-les aux prix réels, à ta situation et à tes priorités.":"Budgets and timelines are illustrative XOF examples, not quotes. Adjust them to actual prices, your situation and priorities."}</p>
 </div>;
}
