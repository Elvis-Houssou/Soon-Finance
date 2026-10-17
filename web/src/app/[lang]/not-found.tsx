import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return (
    <div className="container-site flex flex-col gap-3 py-12">
      <h1 className="font-display text-3xl font-bold">{t.notFound.title}</h1>
      <p className="text-muted">{t.notFound.text}</p>
      <Link href={`/${locale}`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink underline">
        {t.notFound.back}
      </Link>
    </div>
  );
}
