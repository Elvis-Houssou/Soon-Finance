import type { Metadata } from "next";
import { History } from "@/components/history/history";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).history.title };
}

export default async function Page() {
  const locale = await getLocale();
  const { history, account, dashboard, methods } = await getDictionary(locale);
  return <History locale={locale} t={{ history, account, dashboard, methods }} />;
}
