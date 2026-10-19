import { NextResponse, type NextRequest } from "next/server";
import { LEARN_SLUGS } from "@/content/learn/slugs";
import { defaultLocale, hasLocale, locales, type Locale } from "@/i18n/config";

/** Choisit la langue : cookie du sélecteur de langue, sinon Accept-Language, sinon français. */
export function pickLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("sf-lang")?.value;
  if (cookie && hasLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  const match = preferred.find((lang) => hasLocale(lang.base))?.base;
  return match && hasLocale(match) ? match : defaultLocale;
}

/** Langue dans l'URL et vrai 404 des fiches inconnues. La session est vérifiée par l'API (401 → connexion côté client). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasPrefix) {
    const [, lang, page, slug] = pathname.split("/");
    // Fiche inconnue : chemin sans route, Next rend app/global-not-found.tsx avec un vrai 404 (langue via x-lang).
    if (page === "apprendre" && slug && !LEARN_SLUGS.includes(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}/introuvable`;
      const headers = new Headers(request.headers);
      headers.set("x-lang", lang);
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf les fichiers internes de Next et les fichiers statiques.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
