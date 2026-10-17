import { NextResponse, type NextRequest } from "next/server";
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api" || pathname.startsWith("/api/")) return;
  const hasPrefix = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasPrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf les fichiers internes de Next, l'API (réécrite vers FastAPI) et les fichiers statiques.
  matcher: ["/((?!_next|api(?:/|$)|.*\\..*).*)"],
};
