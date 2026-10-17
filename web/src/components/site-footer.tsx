import { getDictionary, getLocale } from "@/i18n/server";
import { LanguageSwitcher } from "./language-switcher";
import { ThemePreferencePicker } from "./theme-controls";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <footer className="mt-16 border-t border-line">
      <div className="container-site flex flex-col gap-6 py-8">
        <p className="text-sm text-muted">{t.footer.disclaimer}</p>
        <div className="flex flex-wrap items-center gap-4">
          <ThemePreferencePicker labels={t.theme} />
          <LanguageSwitcher locale={locale} label={t.language.label} />
        </div>
        <p className="text-sm text-muted">{t.footer.brand}</p>
      </div>
    </footer>
  );
}
