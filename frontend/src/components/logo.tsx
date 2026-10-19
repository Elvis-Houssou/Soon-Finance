/** Logo : tuile de assets/soon-finance-icon.svg colorée par les tokens, et mot-symbole en Syne. Survol d'un parent `group` : le soleil monte un peu. */
export function Logo() {
  return (
    <span className="flex items-center gap-2 text-ink">
      <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--logo-tile)" />
        <rect x="13" y="38" width="8" height="10" rx="1.5" fill="var(--brand)" />
        <rect x="24" y="31" width="8" height="17" rx="1.5" fill="var(--brand)" />
        <rect x="35" y="24" width="8" height="24" rx="1.5" fill="var(--brand)" />
        <circle cx="47" cy="14" r="7" fill="var(--gold)" className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:group-hover:-translate-y-1" />
        <rect x="6" y="49" width="52" height="3" fill="var(--logo-hz)" />
      </svg>
      <span className="font-display text-lg font-bold">soon finance</span>
    </span>
  );
}
