/**
 * Préférence de thème.
 * - Par défaut (aucune valeur stockée) : le site suit le réglage de l'appareil (prefers-color-scheme).
 * - Si l'utilisateur choisit "light" ou "dark" sur le site, ce choix est stocké et appliqué via data-theme.
 */
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sf-theme";
const CHANGE_EVENT = "sf-theme-change";

/** Script exécuté dans <head> avant le premier rendu, pour éviter tout flash de mauvais thème. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return darkQuery().matches ? "dark" : "light";
}

export function setPreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
  const root = document.documentElement;
  if (preference === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribe(callback: () => void) {
  const media = darkQuery();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    // Un autre onglet a changé la préférence : on aligne cette page.
    const next = readPreference();
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    callback();
  };
  media.addEventListener("change", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
