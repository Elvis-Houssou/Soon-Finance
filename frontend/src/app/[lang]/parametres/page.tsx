import type { Metadata } from "next";
import { Settings } from "@/components/settings/settings";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).settings.title };
}

export default async function Page() {
  const locale = await getLocale();
  const { settings, account, dashboard, theme } = await getDictionary(locale);
  return <Settings locale={locale} t={{ settings, account, dashboard, theme }} />;
}
