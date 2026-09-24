import type { PulseEvent, TruthState } from "./types";

/** Half-life in minutes per category — how fast information stops being current. */
const HALF_LIFE: Record<string, number> = {
  incident: 55,
  security: 70,
  traffic: 45,
  utility: 120,
  weather: 90,
  rumour: 150,
  general: 90,
};

export interface Freshness {
  score: number;
  stage: "current" | "aging" | "expired";
  label: string;
}

export function computeFreshness(event: PulseEvent, now: number = Date.now()): Freshness {
  const minutes = (now - new Date(event.last_updated_at).getTime()) / 60000;
  const halfLife = HALF_LIFE[event.category] ?? 90;
  const score = Math.max(0, Math.min(1, Math.pow(0.5, minutes / halfLife)));

  if (event.truth_state === "expired" || score < 0.2) {
    return { score, stage: "expired", label: "No longer current" };
  }
  if (score < 0.5) {
    return { score, stage: "aging", label: "Aging — no recent supporting evidence" };
  }
  return { score, stage: "current", label: "Current" };
}

/** Applies truth decay: confirmed -> aging -> expired unless new evidence arrives. */
export function decayedState(event: PulseEvent, now: number = Date.now()): TruthState {
  const { stage } = computeFreshness(event, now);
  if (event.truth_state === "false") return "false";
  if (stage === "expired") return "expired";
  return event.truth_state;
}

/** Feed rank: location + distance + recency + evidence. */
export function relevanceScore(
  event: PulseEvent,
  distance: number,
  now: number = Date.now(),
): number {
  const proximity = 1 / (1 + distance / 4);
  const { score: freshness } = computeFreshness(event, now);
  const evidenceWeight =
    {
      confirmed: 1,
      corroborated: 0.85,
      disputed: 0.7,
      early_signal: 0.6,
      false: 0.35,
      expired: 0.15,
    }[decayedState(event, now)] ?? 0.5;

  return proximity * 0.4 + freshness * 0.3 + evidenceWeight * 0.3;
}

/** Virality does not equal corroboration. */
export function isHighCirculationLowCorroboration(event: PulseEvent): boolean {
  return event.share_count >= 40 && event.independent_sources <= 2;
}
