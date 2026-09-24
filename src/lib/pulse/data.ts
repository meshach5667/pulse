import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PulseEvent, PulseEvidence, PulseReport, PulseTimelineEntry } from "./types";

export const eventsQuery = {
  queryKey: ["pulse", "events"],
  queryFn: async (): Promise<PulseEvent[]> => {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("Events could not be loaded.");
    return (await response.json()) as PulseEvent[];
  },
};

export function useEvents() {
  return useQuery(eventsQuery);
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["pulse", "event", eventId],
    queryFn: async (): Promise<{
      event: PulseEvent | null;
      evidence: PulseEvidence[];
      timeline: PulseTimelineEntry[];
      reports: PulseReport[];
    }> => {
      const [eventResponse, detailResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/evidence`),
      ]);
      if (!eventResponse.ok || !detailResponse.ok)
        throw new Error("Event evidence could not be loaded.");
      const event = (await eventResponse.json()) as PulseEvent | null;
      const details = (await detailResponse.json()) as {
        evidence: PulseEvidence[];
        timeline: PulseTimelineEntry[];
        reports: PulseReport[];
      };
      return { event, ...details };
    },
  });
}

export function useMyReports(userId: string | undefined) {
  return useQuery({
    queryKey: ["pulse", "reports", userId ?? "none"],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PulseReport[]> => {
      const response = await fetch(`/api/reports?userId=${encodeURIComponent(userId!)}`);
      if (!response.ok) throw new Error("Reports could not be loaded.");
      return (await response.json()) as PulseReport[];
    },
  });
}

export function useLiveUpdates() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const source = new EventSource("/api/events/stream");
    source.onmessage = () => {
      void queryClient.invalidateQueries({ queryKey: ["pulse"] });
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [queryClient]);
}
