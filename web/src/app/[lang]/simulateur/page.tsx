import type { Metadata } from "next";
import { Simulator } from "@/components/simulator/simulator";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).simulator.title };
}

export default async function SimulatorPage() {
  const locale = await getLocale();
  const { simulator, methods, envelopes, kinds, suggestions } = await getDictionary(locale);
  return <Simulator locale={locale} t={{ simulator, methods, envelopes, kinds, suggestions }} />;
}
