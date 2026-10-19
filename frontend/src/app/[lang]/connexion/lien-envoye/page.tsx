import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getDictionary, getLocale } from "@/i18n/server";

export default async function Page() {
  const locale = await getLocale();
  const { auth } = await getDictionary(locale);
  return (
    <div className="container-site flex max-w-xl flex-col py-12">
      <Suspense>
        <LoginForm locale={locale} t={auth} variant="sent" />
      </Suspense>
    </div>
  );
}
