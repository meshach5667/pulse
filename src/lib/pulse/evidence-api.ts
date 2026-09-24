import type { PulseEvidence } from "./types";

export async function fetchEvidence(eventId: string): Promise<PulseEvidence[]> {
  const response = await fetch(`/api/events/${eventId}/evidence`);
  if (!response.ok) throw new Error("Evidence could not be loaded.");
  const data = (await response.json()) as { evidence?: PulseEvidence[] };
  return data.evidence ?? [];
}
