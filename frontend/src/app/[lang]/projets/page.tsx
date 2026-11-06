import type { Metadata } from "next";
import { ProjectsCatalog } from "@/components/projects/projects-catalog";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "fr" ? "Projets" : "Projects" };
}

export default async function Page() {
  return <ProjectsCatalog locale={await getLocale()} />;
}
