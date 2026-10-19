import Link from "next/link";
import type { Locale } from "@/i18n/config";

/** Texte d’une suggestion ; la règle `learn-investing` renvoie vers l’article sur les risques, par identifiant. */
export function SuggestionText({ id, text, locale }: { id: string; text: string; locale: Locale }) {
  return id === "learn-investing"
    ? <Link href={`/${locale}/apprendre/risques-frais-duree`} className="font-semibold text-brand-ink underline">{text}</Link>
    : <>{text}</>;
}
