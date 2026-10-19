import type { Metadata } from "next";
import { CloseForm } from "@/components/month/close-form";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).month.title };
}

export default async function Page({ params }: { params: Promise<{ mois: string }> }) {
  const [{ mois }, locale] = await Promise.all([params, getLocale()]);
  const { month, account, dashboard, suggestions, envelopes, kinds, methods } = await getDictionary(locale);
  return <CloseForm ym={mois} locale={locale} t={{ month, account, dashboard, suggestions, envelopes, kinds, methods }} />;
}

// Un exemple suffit au prérendu ; les autres mois sont rendus à la demande.
export const generateStaticParams = () => [{ mois: "2000-01" }];
