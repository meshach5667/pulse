import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Slash } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatClock, formatDistance } from "@/lib/pulse/geo";
import { STATUS_META } from "@/lib/pulse/status";
import type { PulseEvent, PulseEvidence } from "@/lib/pulse/types";

export function useEvidence(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["pulse", "evidence", eventId],
    enabled,
    queryFn: async (): Promise<PulseEvidence[]> => {
      const { data } = await supabase.from("evidence").select("*").eq("event_id", eventId).order("created_at");
      return (data ?? []) as unknown as PulseEvidence[];
    },
  });
}

function Row({
  tone,
  children,
}: {
  tone: "support" | "against" | "excluded";
  children: React.ReactNode;
}) {
  const Icon = tone === "support" ? Plus : tone === "against" ? Minus : Slash;
  const color =
    tone === "support"
      ? "text-corroborated"
      : tone === "against"
        ? "text-confirmed"
        : "text-muted-foreground";
  return (
    <li className="flex gap-2 text-[11.5px] leading-relaxed">
      <Icon className={`mt-[3px] size-3 shrink-0 ${color}`} />
      <span className="text-foreground/80">{children}</span>
    </li>
  );
}

export function EvidencePanel({
  event,
  distance,
  evidence,
}: {
  event: PulseEvent;
  distance: number;
  evidence: PulseEvidence[];
}) {
  const supporting = evidence.filter((e) => e.supports_claim && !e.excluded);
  const contradicting = evidence.filter((e) => e.contradicts_claim && !e.excluded);
  const excluded = evidence.filter((e) => e.excluded);

  return (
    <div className="rounded-xl bg-panel/80 p-3 ring-1 ring-border">
      <p className="text-[11px] font-semibold">
        Why is this {STATUS_META[event.truth_state].label.toLowerCase()}?
      </p>
      <ul className="mt-2 space-y-1.5">
        <Row tone="support">
          {formatDistance(distance)} from you, first reported {formatClock(event.first_reported_at)}
          , last updated {formatClock(event.last_updated_at)}.
        </Row>
        <Row tone="support">
          {event.independent_sources} independent{" "}
          {event.independent_sources === 1 ? "report" : "reports"} on file.
        </Row>
        {supporting.slice(0, 4).map((e) => (
          <Row key={e.id} tone="support">
            {e.analysis || "Supporting item recorded."}
          </Row>
        ))}
        {contradicting.map((e) => (
          <Row key={e.id} tone="against">
            {e.analysis || "Contradicting item recorded."}
          </Row>
        ))}
        {excluded.map((e) => (
          <Row key={e.id} tone="excluded">
            Excluded: {e.exclusion_reason ?? e.analysis}
          </Row>
        ))}
        {evidence.length === 0 ? (
          <Row tone="excluded">No independent evidence has been attached yet.</Row>
        ) : null}
      </ul>
      <p className="mt-2.5 border-t border-border pt-2 text-[10.5px] leading-relaxed text-muted-foreground">
        {STATUS_META[event.truth_state].meaning} Pulse does not describe any location as safe.
      </p>
    </div>
  );
}
