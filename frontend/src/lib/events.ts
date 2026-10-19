import { apiFetch } from "./api";

export type EventType = "simulation_completed" | "comparison_viewed" | "signup_started";

/** Identifiant aléatoire stable, sans lien avec la personne : sert uniquement à compter. */
function anonId(): string {
  let id = localStorage.getItem("sf-anon");
  if (!id) {
    id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
    localStorage.setItem("sf-anon", id);
  }
  return id;
}

/** Mesure anonyme : ne bloque ni ne signale jamais rien. Un seul `simulation_completed` par session de navigation. */
export async function track(type: EventType, locale: string, currency: string): Promise<void> {
  try {
    if (type === "simulation_completed") {
      if (sessionStorage.getItem("sf-sim-sent")) return;
      sessionStorage.setItem("sf-sim-sent", "1");
    }
    await apiFetch("/api/events", { method: "POST", body: JSON.stringify({ type, anon_id: anonId(), locale, currency }) });
  } catch {
    /* swallowed on purpose */
  }
}
