import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { PulseEvent, PulseEvidence, PulseReport, PulseTimelineEntry } from "./types";

export const eventsQuery = {
  queryKey: ["pulse", "events"],
  queryFn: async (): Promise<PulseEvent[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("last_updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PulseEvent[];
  },
};

export function useEvents() {
  return useQuery(eventsQuery);
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["pulse", "event", eventId],
    queryFn: async () => {
      const [event, evidence, timeline, reports] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
        supabase
          .from("evidence")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true }),
        supabase
          .from("event_timeline")
          .select("*")
          .eq("event_id", eventId)
          .order("occurred_at", { ascending: true }),
        supabase
          .from("reports")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true }),
      ]);

      if (event.error) throw new Error(event.error.message);

      return {
        event: event.data as unknown as PulseEvent | null,
        evidence: (evidence.data ?? []) as unknown as PulseEvidence[],
        timeline: (timeline.data ?? []) as unknown as PulseTimelineEntry[],
        reports: (reports.data ?? []) as unknown as PulseReport[],
      };
    },
  });
}

export function useMyReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["pulse", "reports", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PulseReport[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as PulseReport[];
    },
  });
}

/** Keeps the feed live: any change to events, reports or the timeline refreshes. */
export function useLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("pulse-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pulse"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pulse"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_timeline" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pulse"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
