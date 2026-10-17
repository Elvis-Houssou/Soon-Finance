import type { Allocation } from "@/lib/simulation";
import { KIND_BG } from "./shared";

export function AllocationBar({ rows }: { rows: Allocation[] }) {
  return (
    <div aria-hidden="true" className="flex h-5 gap-[3px] overflow-hidden rounded-full">
      {rows.filter((r) => r.pct > 0).map((r) => (
        <div key={r.key} className={KIND_BG[r.kind]} style={{ flex: r.pct }} />
      ))}
    </div>
  );
}
