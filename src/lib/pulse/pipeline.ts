import { distanceKm } from "./geo";
import type { PulseEvent, PulseProfile } from "./types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "was",
  "are",
  "were",
  "at",
  "in",
  "on",
  "near",
  "of",
  "and",
  "to",
  "i",
  "it",
  "that",
  "there",
  "just",
  "happened",
  "something",
  "some",
  "people",
  "say",
  "said",
  "hear",
  "heard",
  "this",
  "my",
  "we",
  "they",
  "has",
  "have",
  "been",
]);

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywords(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

/** Event matching: same area + overlapping vocabulary + recent. */
export function matchEvent(
  events: PulseEvent[],
  text: string,
  latitude: number,
  longitude: number,
  locationName: string | null,
): PulseEvent | null {
  const words = new Set(keywords(text + " " + (locationName ?? "")));
  let best: { event: PulseEvent; score: number } | null = null;

  for (const event of events) {
    const ageMinutes = (Date.now() - new Date(event.last_updated_at).getTime()) / 60000;
    if (ageMinutes > 240) continue;

    const km = distanceKm(latitude, longitude, event.latitude, event.longitude);
    if (km > 12) continue;

    const eventWords = new Set(
      keywords(`${event.title} ${event.description} ${event.location_name}`),
    );
    let overlap = 0;
    for (const w of words) if (eventWords.has(w)) overlap += 1;

    const score = overlap * 2 + Math.max(0, 6 - km);
    if (overlap >= 1 && (!best || score > best.score)) best = { event, score };
  }

  return best && best.score >= 4 ? best.event : null;
}

export interface SubmitInput {
  profile: PulseProfile;
  content: string;
  locationName: string;
  channel: "text" | "voice" | "image" | "video";
  hasImage: boolean;
  hasVideo: boolean;
  mediaNames: string[];
}

export interface SubmitResult {
  reportId: string;
  eventId: string;
  createdEvent: boolean;
}

/** Step 1 — instant: a report always becomes a visible EARLY SIGNAL right away. */
export async function submitReport(input: SubmitInput): Promise<SubmitResult> {
  const { profile, content } = input;
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      userId: profile.id,
      content,
      city: profile.city,
      latitude: profile.latitude,
      longitude: profile.longitude,
      locationName: input.locationName,
      channel: input.channel,
      media: input.mediaNames,
    }),
  });
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => null))?.error ?? "Report could not be submitted.",
    );
  return (await response.json()) as SubmitResult;
}
