"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { suggestionRequest, type Simulation } from "@/lib/simulation";

export type Suggestion = { id: string; params: Record<string, number> };
type State = { status: "idle" | "loading" | "ready" | "unavailable"; items: Suggestion[] };

export function useSuggestions(sim: Simulation): State {
  // `body` tags the result so a stale one is never shown for a newer request.
  const [state, setState] = useState<State & { body: string }>({ status: "idle", items: [], body: "" });
  const body = JSON.stringify(suggestionRequest(sim));

  useEffect(() => {
    if (body === "null") return;
    const ctrl = new AbortController();
    let stale = false;
    let limit: ReturnType<typeof setTimeout> | undefined;
    const done = (s: State) => { if (!stale) setState({ ...s, body }); };
    const debounce = setTimeout(async () => {
      setState({ status: "loading", items: [], body });
      limit = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(apiUrl("/suggestions"), {
          method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal,
        });
        // 422: the request is not adviceable (nothing to show); any other failure is an outage.
        if (res.status === 422) return done({ status: "ready", items: [] });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { suggestions?: unknown };
        if (!Array.isArray(json.suggestions)) throw new Error("bad body");
        done({ status: "ready", items: json.suggestions as Suggestion[] });
      } catch {
        done({ status: "unavailable", items: [] });
      } finally {
        clearTimeout(limit);
      }
    }, 300);
    return () => { stale = true; clearTimeout(debounce); clearTimeout(limit); ctrl.abort(); };
  }, [body]);

  if (body === "null") return { status: "idle", items: [] };
  // Until the debounce fires, show nothing (no stale items, no loading flash per keystroke).
  return state.body === body ? state : { status: "idle", items: [] };
}
