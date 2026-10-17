"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");

  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line p-0.5">
      {locales.map((value) => {
        const active = value === locale;
        return (
          <Link
            key={value}
            href={`/${value}${rest}`}
            hrefLang={value}
            lang={value}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              document.cookie = `sf-lang=${value}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full font-mono text-xs font-medium uppercase transition-colors ${
              active ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {value}
          </Link>
        );
      })}
    </div>
  );
}
