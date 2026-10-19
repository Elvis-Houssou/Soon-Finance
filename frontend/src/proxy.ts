import { NextResponse, type NextRequest } from "next/server";
import { apiUrl } from "@/lib/api";
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

export const ACCOUNT_PATHS = ["admin", "tableau-de-bord", "bilan", "historique", "objectifs", "parametres"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/api" || pathname.startsWith("/api/")) return;
  const hasPrefix = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasPrefix) {
    // Présence seule du cookie : la validité est vérifiée par l'API (401 → connexion).
    const [, , page, slug] = pathname.split("/");
    // Fiche inconnue : vrai 404 (statut compris) avec la page introuvable du site.
    if (page === "apprendre" && slug && !LEARN_SLUGS.includes(slug)) {
      // Chemin sans route : Next rend app/global-not-found.tsx avec un vrai statut 404 (langue via x-lang).
      const lang = pathname.split("/")[1];
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}/introuvable`;
      const headers = new Headers(request.headers);
      headers.set("x-lang", lang);
      return NextResponse.rewrite(url, { request: { headers } });
    }
    const toLogin = () => {
      const url = request.nextUrl.clone();
      url.pathname = `/${pathname.split("/")[1]}/connexion`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    };
    if (ACCOUNT_PATHS.includes(page) && !request.cookies.has("sf_session")) return toLogin();
    // Zone admin : le rôle est vérifié par l'API ; un non-admin reçoit le vrai 404 du site, sans aucun balisage admin.
    if (page === "admin") {
      const res = await fetch(new URL(apiUrl("/admin/impact?days=30"), request.url), { headers: { cookie: request.headers.get("cookie") ?? "" }, cache: "no-store", signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (res?.status === 401) return toLogin(); // session expirée : connexion, pas 404
      if (res?.status !== 200) {  // fermé par défaut : seule une réponse 200 de l'API ouvre la zone admin
        const lang = pathname.split("/")[1];
        const url = request.nextUrl.clone();
        url.pathname = `/${lang}/introuvable`;
        const headers = new Headers(request.headers);
        headers.set("x-lang", lang);
        return NextResponse.rewrite(url, { request: { headers } });
      }
    }
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf les fichiers internes de Next, l'API (réécrite vers FastAPI) et les fichiers statiques.
  matcher: ["/((?!_next|api(?:/|$)|.*\\..*).*)"],
};
