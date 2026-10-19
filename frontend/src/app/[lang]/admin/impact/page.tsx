import type { Metadata } from "next";
import { Impact } from "@/components/admin/impact";
import { getDictionary, getLocale } from "@/i18n/server";

// La page ne signale pas son existence : non indexée, et l'API répond 404 aux non-admins (page introuvable côté client).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const locale = await getLocale();
  const { impact } = await getDictionary(locale);
  return <Impact locale={locale} t={impact} />;
}
