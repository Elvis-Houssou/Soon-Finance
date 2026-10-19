import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { LogoutButton } from "./auth/logout-button";
import { getDictionary, getLocale } from "@/i18n/server";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-controls";

const ITEM = "flex min-h-11 items-center px-2 text-[15px] font-semibold text-ink hover:text-brand-ink sm:px-3";

async function AccountLinks({ locale, t }: { locale: Locale; t: Dictionary["auth"] }) {
  // Présence du cookie seulement : la session est vérifiée par l'API.
  const signedIn = (await cookies()).has("sf_session");
  return signedIn ? (
    <>
      <Link href={`/${locale}/tableau-de-bord`} className={ITEM}>{t.dashboard}</Link>
      <LogoutButton locale={locale} label={t.signOut} />
    </>
  ) : (
    <Link href={`/${locale}/connexion`} className={ITEM}>{t.signIn}</Link>
  );
}

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const items = [
    { href: `/${locale}/simulateur`, label: t.nav.simulator },
    { href: `/${locale}/comparer`, label: t.nav.compare },
    { href: `/${locale}/apprendre`, label: t.nav.learn },
  ];

  return (
    <header className="border-b border-line">
      <div className="container-site flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <Link href={`/${locale}`} aria-label={`Soon Finance — ${t.nav.home}`} className="shrink-0">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-2 sm:gap-x-4">
          <nav aria-label={t.nav.main} className="flex flex-wrap items-center">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center px-2 text-[15px] font-semibold text-ink hover:text-brand-ink sm:px-3"
              >
                {item.label}
              </Link>
            ))}
            <Suspense fallback={<Link href={`/${locale}/connexion`} className={ITEM}>{t.auth.signIn}</Link>}>
              <AccountLinks locale={locale} t={t.auth} />
            </Suspense>
          </nav>
          <LanguageSwitcher locale={locale} label={t.language.label} />
          <ThemeToggle labels={t.theme} />
        </div>
      </div>
    </header>
  );
}
