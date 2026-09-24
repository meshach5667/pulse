import { useQuery } from "@tanstack/react-query";
import { fetchEvidence } from "./evidence-api";
import type { PulseEvidence } from "./types";

export function useEvidence(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["pulse", "evidence", eventId],
    enabled,
    queryFn: async (): Promise<PulseEvidence[]> => fetchEvidence(eventId),
  });
}
