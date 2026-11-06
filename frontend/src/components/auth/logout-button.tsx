"use client";

import { apiFetch } from "@/lib/api";

export function LogoutButton({ locale, label }: { locale: string; label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
        // Navigation complète voulue : l'état de session (cookie) doit être relu côté serveur.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${locale}`);
      }}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </svg>
    </button>
  );
}
