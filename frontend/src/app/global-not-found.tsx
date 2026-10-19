import { headers } from "next/headers";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import "./globals.css";

/** 404 sans route (rendu par Next avec le statut 404). La langue vient de `x-lang`, posé par proxy.ts. */
export const instant = false;

export default async function GlobalNotFound() {
  const lang = (await headers()).get("x-lang") ?? "";
  const locale = hasLocale(lang) ? lang : defaultLocale;
  const { notFound } = await getDictionary(locale);
  return (
    <html lang={locale}>
      <body className="flex min-h-svh flex-col">
        <main id="main" className="container-site flex flex-col gap-3 py-12">
          <h1 className="font-display text-3xl font-bold">{notFound.title}</h1>
          <p className="text-muted">{notFound.text}</p>
          <a href={`/${locale}`} className="flex min-h-11 w-fit items-center font-semibold text-brand-ink underline">
            {notFound.back}
          </a>
        </main>
      </body>
    </html>
  );
}
