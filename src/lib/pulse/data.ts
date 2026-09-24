import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { PulseEvent, PulseEvidence, PulseReport, PulseTimelineEntry } from "./types";

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio context autoplay policy restrictions
  }
}

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

export function useLiveUpdates(onOpenEvent?: (event: PulseEvent) => void) {
  const queryClient = useQueryClient();
  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function connect() {
      if (!active) return;
      source = new EventSource("/api/events/stream");

      source.onmessage = (messageEvent) => {
        try {
          const payload = JSON.parse(messageEvent.data) as {
            type?: string;
            eventId?: string;
            event?: PulseEvent;
          };
          void queryClient.invalidateQueries({ queryKey: ["pulse"] });

          if (payload.type === "event.created" && payload.event) {
            playNotificationSound();
            const ev = payload.event;
            toast.info(`⚡ New Signal: ${ev.title}`, {
              description: `${ev.location_name || ev.city} · Early report received`,
              action: onOpenEvent
                ? {
                    label: "View",
                    onClick: () => onOpenEvent(ev),
                  }
                : undefined,
              duration: 8000,
            });
          } else if (payload.type === "event.updated" && payload.event) {
            const ev = payload.event;
            toast(`🔍 Signal Updated: ${ev.title}`, {
              description: ev.description,
              action: onOpenEvent
                ? {
                    label: "View",
                    onClick: () => onOpenEvent(ev),
                  }
                : undefined,
              duration: 6000,
            });
          }
        } catch {
          void queryClient.invalidateQueries({ queryKey: ["pulse"] });
        }
      };

      source.onerror = () => {
        source?.close();
        if (active) {
          reconnectTimeout = setTimeout(connect, 4000);
        }
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      source?.close();
    };
  }, [queryClient, onOpenEvent]);
}
