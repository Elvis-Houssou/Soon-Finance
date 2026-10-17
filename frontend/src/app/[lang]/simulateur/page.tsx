import type { Metadata } from "next";
import { Simulator } from "@/components/simulator/simulator";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary(await getLocale())).simulator.title };
}

export default async function SimulatorPage() {
  const locale = await getLocale();
  const { simulator, methods, envelopes, kinds, suggestions } = await getDictionary(locale);
  return (
    <div className="container-site flex flex-col gap-8 py-8 lg:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">{simulator.heading}</h1>
        <p className="text-lg text-muted">{simulator.lead}</p>
      </div>
      <Simulator locale={locale} t={{ simulator, methods, envelopes, kinds, suggestions }} />
    </div>
  );
}
