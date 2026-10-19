export class ApiError extends Error {
  constructor(public status: number, public detail: unknown) {
    super(`API ${status}`);
  }
}

export function redirectToLogin(locale: string, nextPath: string) {
  // Navigation complète voulue : l'état de session (cookie) doit être relu côté serveur.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/${locale}/connexion?next=${encodeURIComponent(nextPath)}`);
}

/** Base de l'API FastAPI, appelée en direct par le navigateur : NEXT_BASE_API_URL (ex. http://localhost:8000/api). */
export const API_URL = (process.env.NEXT_BASE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
export const apiUrl = (path: string) => `${API_URL}${path}`;

/** Appel JSON vers l'API, chemin relatif à API_URL (ex. "/me"). Sur 401, renvoie vers la connexion puis lève ApiError. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    credentials: "include", // cookie de session de l'API (autre origine)
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const body: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      const { pathname, search } = window.location;
      redirectToLogin(pathname.split("/")[1] || "fr", pathname + search);
    }
    throw new ApiError(res.status, body);
  }
  return body as T;
}
