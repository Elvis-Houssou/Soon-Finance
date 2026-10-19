"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

/** Barre du bas sur mobile (4 entrées), menu latéral sur ordinateur (6 entrées). */
export function AccountNav({ locale, t }: { locale: Locale; t: Dictionary["account"] }) {
  const path = usePathname();
  const items = [
    { slug: "tableau-de-bord", label: t.dashboard, long: t.dashboardLong, desktopOnly: false },
    { slug: "historique", label: t.history, desktopOnly: false },
    { slug: "objectifs", label: t.goals, desktopOnly: false },
    { slug: "simulateur", label: t.method, desktopOnly: true },
    { slug: "apprendre", label: t.learn, desktopOnly: false },
    { slug: "parametres", label: t.settings, desktopOnly: true },
  ];
  return (
    <nav
      aria-label={t.nav}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface lg:static lg:w-52 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-0 lg:bg-transparent"
    >
      {items.map((it) => {
        const href = `/${locale}/${it.slug}`;
        return (
          <Link
            key={it.slug} href={href} aria-current={path === href ? "page" : undefined}
            className={`min-h-14 flex-1 items-center justify-center px-1 text-center text-[13px] font-semibold text-muted aria-[current=page]:text-brand-ink lg:min-h-11 lg:flex-none lg:justify-start lg:rounded-[10px] lg:px-3 lg:text-left lg:text-[15px] lg:aria-[current=page]:bg-tint ${it.desktopOnly ? "hidden lg:flex" : "flex"}`}
          >
            {"long" in it ? (
              <>
                <span className="lg:hidden">{it.label}</span>
                <span className="hidden lg:inline">{it.long}</span>
              </>
            ) : it.label}
          </Link>
        );
      })}
    </nav>
  );
}
