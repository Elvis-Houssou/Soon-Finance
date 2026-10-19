"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { fill, FIELD } from "@/components/simulator/shared";
import { ThemePreferencePicker } from "@/components/theme-controls";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { apiFetch, apiUrl } from "@/lib/api";
import { CURRENCIES } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type Me = { email: string; first_name: string | null; locale: Locale; currency: string };
type Strings = Pick<Dictionary, "settings" | "account" | "dashboard" | "theme">;

const BTN = "flex min-h-11 w-fit items-center rounded-[10px] px-5 font-semibold";
const LINK = `${BTN} bg-brand text-on-brand`;
const OUTLINE = `${BTN} border border-line-input`;

const setLangCookie = (v: string) => {
  document.cookie = `sf-lang=${v}; path=/; max-age=31536000; samesite=lax`;
};

export function Settings({ locale, t }: { locale: Locale; t: Strings }) {
  const { data: me, error, reload } = useApi<Me>("/me");
  const months = useApi<unknown[]>("/months");
  const goals = useApi<unknown[]>("/goals");
  const router = useRouter();
  const s = t.settings;
  const id = useId();
  const [name, setName] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const names = new Intl.DisplayNames(locale, { type: "currency" });

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const patch = (m: Me, change: Partial<Pick<Me, "first_name" | "locale" | "currency">>) =>
    apiFetch("/me", { method: "PATCH", body: JSON.stringify({ first_name: m.first_name, locale: m.locale, currency: m.currency, ...change }) });

  let body;
  if (error) {
    body = (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[14px] bg-sunken p-5">
        <p>{s.error}</p>
        <button type="button" onClick={reload} className={LINK}>{s.retry}</button>
      </div>
    );
  } else if (!me) {
    body = <p role="status" aria-busy="true" className="min-h-svh text-muted">{s.loading}</p>;
  } else {
    const firstName = name ?? me.first_name ?? "";
    const cur = currency ?? me.currency;
    const save = async (e: FormEvent) => {
      e.preventDefault();
      setStatus("saving");
      try {
        await patch(me, { first_name: firstName.trim() || null, currency: cur });
        setStatus("saved");
        setName(null);
        setCurrency(null);
        reload();
      } catch {
        setStatus("failed");
      }
    };
    const setLocale = async (value: Locale) => {
      if (value === locale) return;
      try {
        await patch(me, { locale: value });
        setLangCookie(value);
        router.push(`/${value}/parametres`);
      } catch {
        setStatus("failed");
      }
    };
    const signOut = async () => {
      await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
      // Navigation complète voulue : le cookie de session doit être relu côté serveur.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/${locale}`);
    };
    const erase = async () => {
      try {
        await apiFetch("/me", { method: "DELETE" });
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${locale}`);
      } catch {
        setStatus("failed");
      }
    };
    const n = goals.data?.length ?? 0;
    body = (
      <>
        <form onSubmit={save} className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">{s.profile}</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-name`} className="font-semibold">{s.firstName}</label>
            <input id={`${id}-name`} maxLength={40} autoComplete="given-name" className={FIELD} value={firstName} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-email`} className="font-semibold">{s.email}</label>
            <input id={`${id}-email`} readOnly value={me.email} className={`${FIELD} text-muted`} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-cur`} className="font-semibold">{s.currency}</label>
            <select id={`${id}-cur`} aria-describedby={`${id}-cur-note`} value={cur} onChange={(e) => setCurrency(e.target.value)} className={`${FIELD} font-mono`}>
              {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c} — {names.of(c)}</option>)}
            </select>
            <p id={`${id}-cur-note`} className="text-sm text-muted">{s.currencyNote}</p>
          </div>
          <button type="submit" disabled={status === "saving"} className={`${LINK} disabled:opacity-60`}>
            {status === "saving" ? s.saving : s.save}
          </button>
        </form>

        <section aria-labelledby={`${id}-lang`} className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
          <h2 id={`${id}-lang`} className="font-display text-xl font-semibold">{s.language}</h2>
          <div role="group" aria-labelledby={`${id}-lang`} className="flex gap-2">
            {locales.map((value) => (
              <button
                key={value} type="button" lang={value} aria-pressed={value === locale} onClick={() => void setLocale(value)}
                className={`min-h-11 min-w-11 rounded-full px-4 font-semibold ${value === locale ? "bg-ink text-bg" : "border border-line-input"}`}
              >
                {value === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
          <h2 className="mt-2 font-display text-xl font-semibold">{s.appearance}</h2>
          <ThemePreferencePicker labels={t.theme} />
          <p className="text-sm text-muted">{s.appearanceNote}</p>
        </section>

        <section aria-labelledby={`${id}-data`} className="flex flex-col items-start gap-3 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
          <h2 id={`${id}-data`} className="font-display text-xl font-semibold">{s.data}</h2>
          <p className="text-muted">{s.dataText}</p>
          <Link href={`/${locale}/confidentialite`} className="flex min-h-11 items-center font-semibold text-brand-ink underline">{s.keepLink}</Link>
          <a href={apiUrl("/me/export")} download className={OUTLINE}>{s.download}</a>
          {!confirming && (
            <button type="button" onClick={() => setConfirming(true)} className={`${OUTLINE} text-danger`}>{s.delete}</button>
          )}
          {confirming && (
            <div ref={confirmRef} tabIndex={-1} role="group" aria-labelledby={`${id}-ct`} className="flex flex-col gap-3 rounded-[14px] border border-danger p-4">
              <h3 id={`${id}-ct`} className="font-semibold">{s.confirmTitle}</h3>
              <p>{fill(s.confirmText, { months: months.data?.length ?? 0, goals: n, s: n > 1 ? "s" : "" })}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void erase()} className={`${BTN} bg-danger text-on-brand`}>{s.confirmYes}</button>
                <button type="button" onClick={() => setConfirming(false)} className={OUTLINE}>{s.cancel}</button>
              </div>
            </div>
          )}
        </section>

        <button type="button" onClick={() => void signOut()} className={OUTLINE}>{s.signOut}</button>
        <p role="status" className={status === "failed" ? "text-danger" : "text-muted"}>
          {status === "saved" ? s.saved : status === "failed" ? s.failed : ""}
        </p>
        {cur !== me.currency && <p role="status" className="text-sm text-muted">{s.currencyNote}</p>}
      </>
    );
  }

  return (
    <div className="container-site flex flex-col gap-6 py-8 pb-24 lg:flex-row lg:gap-10 lg:py-12 lg:pb-12">
      <AccountNav locale={locale} t={t.account} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{s.title}</h1>
        {body}
        <p className="text-[13px] text-muted">{t.dashboard.disclaimer}</p>
      </div>
    </div>
  );
}
