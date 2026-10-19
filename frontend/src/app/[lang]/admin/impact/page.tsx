import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Impact } from "@/components/admin/impact";
import { getDictionary, getLocale } from "@/i18n/server";

// Titre générique : la page ne signale pas son existence (404 pour les non-admins).
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Route bloquante : le contrôle admin lit le cookie de la requête.
export const instant = false;

export default async function Page() {
  const locale = await getLocale();
  // Contrôle admin côté serveur, avant tout rendu : un non-admin reçoit un vrai 404 sans une ligne de la page admin.
  const origin = process.env.API_ORIGIN || "http://127.0.0.1:8000";
  const res = await fetch(`${origin}/api/admin/impact?days=30`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  }).catch(() => null);
  if (res?.status === 404) notFound();
  if (res?.status === 401) redirect(`/${locale}/connexion?next=${encodeURIComponent(`/${locale}/admin/impact`)}`);
  if (!res?.ok) notFound(); // fermé par défaut : API en panne ou réponse inattendue = rien d'admin
  const { impact } = await getDictionary(locale);
  return <Impact locale={locale} t={impact} />;
}
