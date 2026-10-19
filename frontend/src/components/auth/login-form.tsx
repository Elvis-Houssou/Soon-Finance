"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { ApiError, apiFetch } from "@/lib/api";
import { track } from "@/lib/events";
import { loadDraft } from "@/lib/simulation";
import { FIELD } from "../simulator/shared";

type Phase =
  | { name: "form" }
  | { name: "sent"; devLink?: string }
  | { name: "limited"; minutes: number }
  | { name: "failed" };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const RESEND_AFTER = 45;
const BTN = "flex min-h-12 w-full items-center justify-center rounded-[10px] px-5 font-semibold sm:w-auto";

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k]));

type Props = {
  locale: Locale;
  t: Dictionary["auth"];
  /** "login" : formulaire complet ; "expired" : email seul (le consentement a déjà été donné) ; "sent" : page « lien envoyé » directe. */
  variant: "login" | "expired" | "sent";
};

export function LoginForm({ locale, t, variant }: Props) {
  const params = useSearchParams();
  const nextParam = params.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("\\") ? nextParam : undefined;
  const emailId = useId();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>(variant === "sent" && email ? { name: "sent" } : { name: "form" });
  const [wait, setWait] = useState(RESEND_AFTER);

  const needsConsent = variant === "login";
  const emailOk = EMAIL_RE.test(email.trim());
  const emailError = tried && !emailOk;
  const consentError = tried && needsConsent && !consent;

  useEffect(() => {
    if (phase.name !== "sent") return;
    const timer = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  async function send() {
    setBusy(true);
    try {
      const res = await apiFetch<{ dev_link?: string }>("/api/auth/request-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), consent: true, locale, next }),
      });
      setWait(RESEND_AFTER);
      setPhase({ name: "sent", devLink: res?.dev_link });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        const retry = (e.detail as { retry_after?: number } | undefined)?.retry_after ?? 600;
        setPhase({ name: "limited", minutes: Math.max(1, Math.ceil(retry / 60)) });
      } else {
        setPhase({ name: "failed" });
      }
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!emailOk || (needsConsent && !consent)) return;
    if (needsConsent) {
      // Mesure anonyme : ne bloque jamais la connexion.
      void track("signup_started", locale, loadDraft().currency);
    }
    void send();
  }

  const changeEmail =
    variant === "login" ? (
      <button type="button" onClick={() => setPhase({ name: "form" })} className="min-h-11 self-start px-1 font-semibold text-brand-ink underline">
        {t.changeEmail}
      </button>
    ) : (
      <Link
        href={`/${locale}/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        className="flex min-h-11 items-center self-start px-1 font-semibold text-brand-ink underline"
      >
        {t.changeEmail}
      </Link>
    );

  if (phase.name !== "form") {
    const mm = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}`;
    return (
      <div className="flex flex-col gap-4" role="status">
        {phase.name === "sent" && (
          <>
            <p className="font-mono text-sm uppercase text-muted">{t.sentKicker}</p>
            <h1 className="font-display text-3xl font-semibold">{t.sentTitle}</h1>
            <p className="text-lg">
              {t.sentBefore} <strong className="break-all">{email}</strong>. {t.sentAfter}
            </p>
            <p className="text-muted">
              {t.spam} {t.sender}
            </p>
            {phase.devLink && (
              <a href={phase.devLink} className={`${BTN} bg-brand text-on-brand`}>
                {t.devOpen}
              </a>
            )}
            <button type="button" disabled={wait > 0 || busy} onClick={() => void send()} className={`${BTN} border border-line-input disabled:text-muted`}>
              {wait > 0 ? fill(t.resendIn, { time: mm }) : t.resend}
            </button>
          </>
        )}
        {phase.name === "limited" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t.limitedTitle}</h1>
            <p className="text-lg">{fill(t.limitedText, { minutes: phase.minutes })}</p>
          </>
        )}
        {phase.name === "failed" && (
          <>
            <h1 className="font-display text-3xl font-semibold">{t.failedTitle}</h1>
            <p className="text-lg">{t.failedText}</p>
            <button type="button" disabled={busy} onClick={() => void send()} className={`${BTN} bg-brand text-on-brand`}>
              {t.retry}
            </button>
          </>
        )}
        {changeEmail}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm uppercase text-muted">{variant === "login" ? t.kicker : t.expiredKicker}</p>
        <h1 className="font-display text-3xl font-semibold">{variant === "login" ? t.title : t.expiredTitle}</h1>
        <p className="text-lg text-muted">{variant === "login" ? t.lead : t.expiredText}</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className="font-semibold">
          {t.emailLabel}
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailError}
          aria-describedby={emailError ? `${emailId}-err` : undefined}
          className={`${FIELD} ${emailError ? "border-danger" : ""}`}
        />
        {emailError && (
          <p id={`${emailId}-err`} role="alert" className="text-sm text-danger">
            {t.emailError}
          </p>
        )}
      </div>
      {needsConsent && (
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={consentError}
              aria-describedby={consentError ? `${emailId}-cerr` : undefined}
              className="mt-1 size-6 shrink-0 accent-brand-ink"
            />
            <span>{t.consent} (<Link href={`/${locale}/confidentialite`} target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">{t.consentLink}<span className="sr-only"> {t.newTab}</span></Link>)</span>
          </label>
          {consentError && (
            <p id={`${emailId}-cerr`} role="alert" className="text-sm text-danger">
              {t.consentError}
            </p>
          )}
        </div>
      )}
      <button type="submit" disabled={busy} className={`${BTN} bg-brand text-on-brand disabled:opacity-60`}>
        {busy ? t.sending : variant === "login" ? t.submit : t.newLink}
      </button>
      <p className="text-sm text-muted">
        {variant === "login" ? (
          <>
            {t.free}
            <br />
            {t.deleteAnytime}
          </>
        ) : (
          t.safe
        )}
      </p>
    </form>
  );
}
