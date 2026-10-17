import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";

// Provisoire : remplacée par la vraie connexion au plan 2.
export default async function LoginPage() {
  const locale = await getLocale();
  const { login } = await getDictionary(locale);
  return (
    <div className="container-site flex flex-col items-start gap-4 py-12">
      <h1 className="font-display text-3xl font-semibold">{login.title}</h1>
      <p className="text-lg text-muted">{login.text}</p>
      <Link href={`/${locale}/simulateur`} className="flex min-h-12 items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand">
        {login.back}
      </Link>
    </div>
  );
}
