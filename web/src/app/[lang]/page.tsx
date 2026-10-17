import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";

// Provisoire : la page d'accueil complète arrive avec la tâche 10.
export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return (
    <div className="container-site flex flex-col gap-4 py-12">
      <h1 className="font-display text-4xl font-bold">{t.home.title}</h1>
      <Link
        href={`/${locale}/simulateur`}
        className="flex min-h-12 w-fit items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand"
      >
        {t.home.cta}
      </Link>
    </div>
  );
}
