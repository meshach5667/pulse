import { cn } from "@/lib/utils";
import { STATUS_META, statusBgClass, statusSoftClass } from "@/lib/pulse/status";
import type { TruthState } from "@/lib/pulse/types";

export function StatusBadge({
  state,
  className,
  size = "sm",
}: {
  state: TruthState;
  className?: string;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[state];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide",
        statusSoftClass(state),
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", statusBgClass(state))} />
      {meta.label}
    </span>
  );
}

export function StatusRail({ state }: { state: TruthState }) {
  return <div className={cn("w-1 shrink-0", statusBgClass(state))} aria-hidden />;
}
