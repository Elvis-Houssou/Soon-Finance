import { AccountNav } from "@/components/account/account-nav";
import { MonthlyReview } from "@/components/review/monthly-review";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function Page() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return (
    <div className="container-site flex flex-col gap-6 py-8 pb-24 lg:flex-row lg:gap-10 lg:py-12 lg:pb-12">
      <AccountNav locale={locale} t={t.account} />
      <div className="min-w-0 flex-1"><MonthlyReview locale={locale} /></div>
    </div>
  );
}
