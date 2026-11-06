import type { Metadata } from "next";
import { Goals } from "@/components/goals/goals";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).goals.title };
}

export default async function Page() {
  const locale = await getLocale();
  const { goals, account, dashboard } = await getDictionary(locale);
  return <Goals locale={locale} t={{ goals, account, dashboard }} />;
}
