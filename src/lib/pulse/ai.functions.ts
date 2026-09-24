import type { PulseEvent, ReportAnalysis } from "./types";

interface AnalyzeInput {
  content: string;
  locationName: string | null;
  hasImage: boolean;
  hasVideo: boolean;
  channel: string;
}

export async function analyzeReport(input: AnalyzeInput): Promise<ReportAnalysis> {
  {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.ok) return (await response.json()) as ReportAnalysis;
  }
  return {
    claim: input.content.trim(),
    title: input.content.trim().split(/\s+/).slice(0, 8).join(" "),
    location_guess: input.locationName ?? "unspecified",
    language: "English",
    category: "general",
    text_signals: ["AI analysis is pending server configuration."],
    missing_context: ["Independent confirmation"],
    visual_review:
      input.hasImage || input.hasVideo ? ["Media review requires the AI service."] : [],
    summary:
      "This report has been received as an early signal. Independent evidence is still needed before the claim can be corroborated.",
    confidence: "low",
  };
}

export async function askPulse(input: {
  question: string;
  city: string;
  context: string;
}): Promise<{ answer: string }> {
  {
    const response = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.ok) return (await response.json()) as { answer: string };
  }
  let events: PulseEvent[] = [];
  try {
    events = JSON.parse(input.context) as PulseEvent[];
  } catch {
    /* use an empty evidence set */
  }
  if (!events.length)
    return {
      answer: `I do not have current event data for ${input.city}, so I cannot answer that reliably.`,
    };
  const summary = events
    .slice(0, 3)
    .map((event) => `${event.title} (${event.truth_state.replace("_", " ")})`)
    .join("; ");
  return {
    answer: `Current Pulse data for ${input.city}: ${summary}. This is a summary of available reports, not a guarantee about conditions on the ground.`,
  };
}
