import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

export type Envelope = { label: string; kind: string; pct: number; planned: number; actual: number | null };
export type MonthData = { year_month: string; income: number; currency: string; method: string; envelopes: Envelope[]; closed_at: string | null };
export type GoalData = { id: string; label: string; target: number; deadline: string; saved: number; pace: { projected: string | null } };
export type DashboardData = {
  first_name: string | null; currency: string; current_month: MonthData | null; closed_count: number; steps: number;
  rates: { year_month: string; savings_rate_bp: number }[]; saved_total: number; goals: GoalData[];
  suggestions: { id: string; params: Record<string, number | string> }[];
};
export type DashStrings = Pick<Dictionary, "dashboard" | "account" | "suggestions" | "envelopes" | "kinds" | "methods">;
export type Ctx = { locale: Locale; t: DashStrings };
export type MonthStrings = DashStrings & Pick<Dictionary, "month">;
