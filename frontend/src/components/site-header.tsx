import Link from "next/link";
import { AccountLinks } from "./auth/account-links";
import { getDictionary, getLocale } from "@/i18n/server";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-controls";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const items = [
    { href: `/${locale}/simulateur`, label: t.nav.simulator },
    { href: `/${locale}/comparer`, label: t.nav.compare },
    { href: `/${locale}/apprendre`, label: t.nav.learn },
  ];

  return (
    <header data-site-header className="z-40 border-b border-line bg-bg/85 backdrop-blur-md transition-shadow duration-300 lg:sticky lg:top-0">
      <div className="container-site flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <Link href={`/${locale}`} aria-label={`Soon Finance — ${t.nav.home}`} className="group shrink-0">
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
            <AccountLinks locale={locale} t={t.auth} />
          </nav>
          <LanguageSwitcher locale={locale} label={t.language.label} />
          <ThemeToggle labels={t.theme} />
        </div>
      </div>
    </header>
  );
}
