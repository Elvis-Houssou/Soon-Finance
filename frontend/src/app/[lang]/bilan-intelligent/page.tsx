import { MonthlyReview } from "@/components/review/monthly-review";
import { getLocale } from "@/i18n/server";
export default async function Page() { return <main className="container-site py-8"><MonthlyReview locale={await getLocale()} /></main>; }
