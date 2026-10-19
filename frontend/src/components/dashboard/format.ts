import type { Locale } from "@/i18n/config";
import type { Envelope, DashStrings } from "./types";

const TAGS: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** "2026-10" -> "octobre" / "October". */
export const monthName = (ym: string, locale: Locale) => {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat(TAGS[locale], { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1)));
};
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Preset methods: label is the envelope key (translated). Custom: the user's text, or the kind when blank. */
export const envLabel = (t: DashStrings, method: string, e: Pick<Envelope, "label" | "kind">) =>
  method === "custom"
    ? e.label === e.kind ? (t.kinds as Record<string, string>)[e.kind] ?? e.label : e.label
    : (t.envelopes as Record<string, string>)[e.label] ?? e.label;
