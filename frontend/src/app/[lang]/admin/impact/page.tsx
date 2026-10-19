import type { Metadata } from "next";
import { Impact } from "@/components/admin/impact";
import { getDictionary, getLocale } from "@/i18n/server";

// Titre générique : la page ne signale pas son existence (404 pour les non-admins).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const locale = await getLocale();
  const { impact } = await getDictionary(locale);
  return <Impact locale={locale} t={impact} />;
}
