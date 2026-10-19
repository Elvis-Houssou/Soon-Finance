import { getDictionary } from "@/i18n/server";

// Provisoire : la tâche 7 remplace cette page par le vrai tableau de bord.
export default async function DashboardPage() {
  const { dashboard } = await getDictionary();
  return (
    <div className="container-site py-12">
      <h1 className="font-display text-3xl font-semibold">{dashboard.title}</h1>
    </div>
  );
}
