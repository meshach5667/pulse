import { TrendingUp } from "lucide-react";

import type { PulseEvent } from "@/lib/pulse/types";

export function RumorBlock({ event }: { event: PulseEvent }) {
  return (
    <div className="rounded-xl bg-signal/10 p-2.5 ring-1 ring-signal/25">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-signal">
        <TrendingUp className="size-3.5" />
        High circulation, low corroboration
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/75">
        This claim has been widely shared, but the reports appear to originate from the same source.
        Independent confirmation has not yet been established.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <span className="tabular font-mono text-[12px]">
          {event.share_count} <span className="text-[10px] text-muted-foreground">shares</span>
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="tabular font-mono text-[12px] text-signal">
          {event.independent_sources}{" "}
          <span className="text-[10px] text-muted-foreground">independent sources</span>
        </span>
      </div>
    </div>
  );
}
