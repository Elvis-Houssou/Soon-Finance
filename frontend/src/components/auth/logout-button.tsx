"use client";

import { apiFetch } from "@/lib/api";

export function LogoutButton({ locale, label }: { locale: string; label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        // Navigation complète voulue : l'état de session (cookie) doit être relu côté serveur.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${locale}`);
      }}
      className="flex min-h-11 items-center px-2 text-[15px] font-semibold text-muted hover:text-ink sm:px-3"
    >
      {label}
    </button>
  );
}
