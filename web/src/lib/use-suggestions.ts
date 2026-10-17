"use client";

import { useEffect, useState } from "react";
import { suggestionRequest, type Simulation } from "@/lib/simulation";

export type Suggestion = { id: string; params: Record<string, number> };
type State = { status: "idle" | "loading" | "ready" | "unavailable"; items: Suggestion[] };

export function useSuggestions(sim: Simulation): State {
  const [state, setState] = useState<State>({ status: "idle", items: [] });
  const body = JSON.stringify(suggestionRequest(sim));

  useEffect(() => {
    if (body === "null") return;
    const ctrl = new AbortController();
    let stale = false;
    let limit: ReturnType<typeof setTimeout> | undefined;
    const debounce = setTimeout(async () => {
      setState((s) => ({ ...s, status: "loading" }));
      limit = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch("/api/suggestions", {
          method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal,
        });
        if (res.status >= 500) throw new Error(String(res.status));
        // 4xx (e.g. 422): no advice to show, not an outage
        const json = res.ok ? ((await res.json()) as { suggestions: Suggestion[] }) : { suggestions: [] };
        if (!stale) setState({ status: "ready", items: json.suggestions });
      } catch {
        if (!stale) setState({ status: "unavailable", items: [] });
      } finally {
        clearTimeout(limit);
      }
    }, 300);
    return () => { stale = true; clearTimeout(debounce); clearTimeout(limit); ctrl.abort(); };
  }, [body]);

  return body === "null" ? { status: "idle", items: [] } : state;
}
