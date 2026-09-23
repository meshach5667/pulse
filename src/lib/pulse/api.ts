import type { PulseEvent, PulseEvidence } from "./types";

const DEMO_EVENTS: PulseEvent[] = [
  {
    id: "demo-central-market",
    title: "Reports of an incident near Central Market",
    description:
      "Several reports describe unusual activity near Central Market. The claim is still being assessed.",
    location_name: "Central Market",
    city: "Abuja",
    latitude: 9.0579,
    longitude: 7.4951,
    first_reported_at: new Date(Date.now() - 10 * 60_000).toISOString(),
    last_updated_at: new Date(Date.now() - 30_000).toISOString(),
    truth_state: "corroborated",
    freshness_score: 0.94,
    share_count: 14,
    independent_sources: 2,
    category: "public safety",
  },
  {
    id: "demo-road-closure",
    title: "Traffic slowing on Airport Road",
    description:
      "A traffic disruption has been reported near the Airport Road interchange. Conditions may change quickly.",
    location_name: "Airport Road",
    city: "Abuja",
    latitude: 9.0067,
    longitude: 7.4422,
    first_reported_at: new Date(Date.now() - 22 * 60_000).toISOString(),
    last_updated_at: new Date(Date.now() - 90_000).toISOString(),
    truth_state: "early_signal",
    freshness_score: 0.82,
    share_count: 31,
    independent_sources: 1,
    category: "transport",
  },
];

export async function fetchEvents(city?: string): Promise<PulseEvent[]> {
  try {
    const response = await fetch(`/api/events${city ? `?city=${encodeURIComponent(city)}` : ""}`);
    if (!response.ok) throw new Error("Events unavailable");
    return (await response.json()) as PulseEvent[];
  } catch {
    return city && city !== "Abuja"
      ? DEMO_EVENTS.map((event) => ({ ...event, city }))
      : DEMO_EVENTS;
  }
}

export async function fetchEvidence(eventId: string): Promise<PulseEvidence[]> {
  try {
    const response = await fetch(`/api/events/${eventId}/evidence`);
    if (!response.ok) throw new Error("Evidence unavailable");
    return (await response.json()) as PulseEvidence[];
  } catch {
    return [];
  }
}

export async function submitReport(input: {
  content: string;
  city: string;
  latitude: number;
  longitude: number;
}) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Report could not be submitted");
  return response.json() as Promise<{ reportId: string; eventId: string }>;
}

export function subscribeToEvents(onUpdate: () => void) {
  const source = new EventSource("/api/events/stream");
  source.onmessage = onUpdate;
  source.onerror = () => source.close();
  return () => source.close();
}
