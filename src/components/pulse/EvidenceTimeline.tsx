import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/pulse/geo";
import type { PulseTimelineEntry } from "@/lib/pulse/types";

const TONE_DOT: Record<string, string> = {
  signal: "bg-signal",
  positive: "bg-corroborated",
  negative: "bg-falsehood",
  contradiction: "bg-confirmed",
  neutral: "bg-disputed",
};

export function EvidenceTimeline({ entries }: { entries: PulseTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-[12px] text-muted-foreground">No timeline entries recorded yet.</p>;
  }

  return (
    <ol className="relative ml-1.5 space-y-3 border-l border-border pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              "absolute -left-[21px] top-1 size-2.5 rounded-full ring-2 ring-background",
              TONE_DOT[entry.tone] ?? TONE_DOT.neutral,
            )}
          />
          <p className="tabular font-mono text-[11px] text-muted-foreground">
            {formatClock(entry.occurred_at)}
          </p>
          <p className="text-[12px] leading-snug text-pretty">{entry.label}</p>
        </li>
      ))}
    </ol>
  );
}
