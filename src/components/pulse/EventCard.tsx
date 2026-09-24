import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { StatusBadge, StatusRail } from "@/components/pulse/StatusBadge";
import { EvidencePanel, useEvidence } from "@/components/pulse/EvidencePanel";
import { RumorBlock } from "@/components/pulse/RumorBlock";
import {
  computeFreshness,
  decayedState,
  isHighCirculationLowCorroboration,
} from "@/lib/pulse/freshness";
import { formatClock, formatDistance } from "@/lib/pulse/geo";
import type { PulseEvent } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  distance,
  index = 0,
  onOpen,
}: {
  event: PulseEvent;
  distance: number;
  index?: number;
  onOpen?: (event: PulseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: evidence } = useEvidence(event.id, open);
  const state = decayedState(event);
  const freshness = computeFreshness(event);
  const stale = freshness.stage !== "current";

  return (
    <article
      className="glass animate-rise overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
    >
      <div className="flex">
        <StatusRail state={state} />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-[14.5px] leading-snug font-semibold text-balance",
                  stale && "text-foreground/60",
                )}
              >
                {event.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {event.location_name} · {formatDistance(distance)}
              </p>
            </div>
            <StatusBadge state={state} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-y border-border py-2.5">
            <Meta label="First" value={formatClock(event.first_reported_at)} />
            <Meta label="Updated" value={formatClock(event.last_updated_at)} />
            <Meta label="Independent" value={String(event.independent_sources)} />
          </div>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-pretty text-foreground/80">
            {event.description}
          </p>

          {stale ? <p className="mt-2 text-[11px] text-expired">{freshness.label}</p> : null}

          {isHighCirculationLowCorroboration(event) ? (
            <div className="mt-3">
              <RumorBlock event={event} />
            </div>
          ) : null}

          {open && evidence ? (
            <div className="mt-3">
              <EvidencePanel
                event={{ ...event, truth_state: state }}
                distance={distance}
                evidence={evidence}
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-[11px] font-medium text-accent"
            >
              {open ? "Hide evidence" : "Why am I seeing this?"}
            </button>
            <button
              type="button"
              onClick={() => onOpen?.(event)}
              className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Timeline
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="tabular font-mono text-[12px]">{value}</p>
    </div>
  );
}
