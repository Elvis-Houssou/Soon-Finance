import type { Locale } from "@/i18n/config";

export const CURRENCIES: Record<string, number> = {
  XOF: 0, XAF: 0, EUR: 2, USD: 2, GBP: 2, CAD: 2, CHF: 2, MAD: 2, NGN: 2, GHS: 2, KES: 2, ZAR: 2,
};

export const MAX_INCOME_MINOR = 1_000_000_000_000;

const TAGS: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** Mirrors api/src/soonfinance/money.py; a total != 100 is only for custom-method display. */
export function split(incomeMinor: number, pcts: number[]): number[] {
  if (!Number.isInteger(incomeMinor) || !pcts.every((p) => Number.isInteger(p) && p >= 0 && p <= 100))
    throw new RangeError("integer income and 0-100 integer pcts required");
  if (incomeMinor < 0 || incomeMinor > MAX_INCOME_MINOR) throw new RangeError("income out of range");

  const total = pcts.reduce((a, b) => a + b, 0);
  const target = Math.floor((incomeMinor * total + 50) / 100);
  const parts = pcts.map((p) => Math.floor((incomeMinor * p + 50) / 100));
  const gap = target - parts.reduce((a, b) => a + b, 0);
  const order = pcts.map((_, i) => i).sort((a, b) => pcts[b] - pcts[a] || a - b);
  if (gap >= 0) {
    if (order.length) parts[order[0]] += gap;
    return parts;
  }
  let remaining = -gap;
  for (const i of order) {
    const take = Math.min(parts[i], remaining);
    parts[i] -= take;
    remaining -= take;
    if (remaining === 0) break;
  }
  return parts;
}

export function parseAmount(text: string, currency: string): number | null {
  const d = CURRENCIES[currency] ?? 2;
  const s = text.replace(/[^\d,.]/g, "");
  if (!/\d/.test(s)) return null;
  const m = d > 0 ? s.match(new RegExp(`[,.]([0-9]{1,${d}})$`)) : null;
  const frac = m ? m[1] : "";
  const intPart = (m ? s.slice(0, -m[0].length) : s).replace(/\D/g, "") || "0";
  const minor = Number(intPart) * 10 ** d + Number(frac.padEnd(d, "0") || 0);
  return Math.min(minor, MAX_INCOME_MINOR);
}

const fmt = (minor: number, currency: string, locale: Locale, style?: "currency") => {
  const d = CURRENCIES[currency] ?? 2;
  return new Intl.NumberFormat(TAGS[locale], {
    ...(style ? { style, currency } : {}),
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(minor / 10 ** d);
};

export const formatAmount = (minor: number, currency: string, locale: Locale) =>
  fmt(minor, currency, locale);

export const formatMoney = (minor: number, currency: string, locale: Locale) =>
  fmt(minor, currency, locale, "currency");
