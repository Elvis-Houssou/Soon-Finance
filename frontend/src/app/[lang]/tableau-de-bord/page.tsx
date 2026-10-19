import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).dashboard.title };
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const { dashboard, account, suggestions, envelopes, kinds, methods } = await getDictionary(locale);
  return <Dashboard locale={locale} t={{ dashboard, account, suggestions, envelopes, kinds, methods }} />;
}
