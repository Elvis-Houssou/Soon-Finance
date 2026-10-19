"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { LogoutButton } from "./logout-button";

const ITEM = "flex min-h-11 items-center px-2 text-[15px] font-semibold text-ink hover:text-brand-ink sm:px-3";

/** Lien du compte dans l'en-tête : la session (cookie de l'API, autre domaine) n'est connue que du navigateur. */
export function AccountLinks({ locale, t }: { locale: string; t: { signIn: string; dashboard: string; signOut: string } }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    fetch(apiUrl("/me"), { credentials: "include" }).then((r) => setSignedIn(r.ok), () => {});
  }, []);
  return signedIn ? (
    <>
      <Link href={`/${locale}/tableau-de-bord`} className={ITEM}>{t.dashboard}</Link>
      <LogoutButton locale={locale} label={t.signOut} />
    </>
  ) : (
    <Link href={`/${locale}/connexion`} className={ITEM}>{t.signIn}</Link>
  );
}
