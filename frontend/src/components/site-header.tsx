import Link from "next/link";
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
  ];

  return (
    <header className="border-b border-line">
      <div className="container-site flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <Link href={`/${locale}`} aria-label={`Soon Finance — ${t.nav.home}`} className="shrink-0">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label={t.nav.main} className="flex items-center">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center px-2 text-[15px] font-semibold text-ink hover:text-brand-ink sm:px-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher locale={locale} label={t.language.label} />
          <ThemeToggle labels={t.theme} />
        </div>
      </div>
    </header>
  );
}
