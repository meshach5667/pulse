import { supabase } from "@/integrations/supabase/client";

import { analyzeReport } from "./ai.functions";
import { distanceKm } from "./geo";
import type { PulseEvent, PulseProfile, ReportAnalysis, TruthState } from "./types";

const STOP_WORDS = new Set([
  "the","a","an","is","was","are","were","at","in","on","near","of","and","to","i","it","that","there","just",
  "happened","something","some","people","say","said","hear","heard","this","my","we","they","has","have","been",
]);

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
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

    const eventWords = new Set(keywords(`${event.title} ${event.description} ${event.location_name}`));
    let overlap = 0;
    for (const w of words) if (eventWords.has(w)) overlap += 1;

    const score = overlap * 2 + Math.max(0, 6 - km);
    if (overlap >= 1 && (!best || score > best.score)) best = { event, score };
  }

  return best && best.score >= 4 ? best.event : null;
}

async function ensureUser(profile: PulseProfile) {
  await supabase.from("pulse_users").upsert(
    {
      id: profile.id,
      name: profile.name,
      city: profile.city,
      latitude: profile.latitude,
      longitude: profile.longitude,
    },
    { onConflict: "id" },
  );
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
  await ensureUser(profile);

  const { data: eventRows } = await supabase
    .from("events")
    .select("*")
    .eq("city", profile.city)
    .order("last_updated_at", { ascending: false })
    .limit(60);

  const events = (eventRows ?? []) as unknown as PulseEvent[];
  const matched = matchEvent(events, content, profile.latitude, profile.longitude, input.locationName);

  let eventId: string;
  let createdEvent = false;

  if (matched) {
    eventId = matched.id;
  } else {
    const title = provisionalTitle(content, input.locationName);
    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        description: "Analyzing this report…",
        location_name: input.locationName || profile.city,
        city: profile.city,
        latitude: profile.latitude,
        longitude: profile.longitude,
        truth_state: "early_signal" as TruthState,
        freshness_score: 1,
        share_count: 1,
        independent_sources: 1,
        category: "general",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    eventId = data.id;
    createdEvent = true;
  }

  // Duplicate / copied-wording detection against existing reports on this event.
  const { data: siblingRows } = await supabase
    .from("reports")
    .select("id, content")
    .eq("event_id", eventId);
  const normalised = normalise(content);
  const duplicateOf =
    (siblingRows ?? []).find((r) => normalise(r.content as string) === normalised)?.id ?? null;

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: profile.id,
      event_id: eventId,
      content,
      media: input.mediaNames,
      location_name: input.locationName || null,
      latitude: profile.latitude,
      longitude: profile.longitude,
      status: "analyzing",
      channel: input.channel,
      is_duplicate_of: duplicateOf,
    })
    .select("id")
    .single();
  if (reportError) throw new Error(reportError.message);

  await supabase.from("event_timeline").insert({
    event_id: eventId,
    label: duplicateOf
      ? "Report received with wording identical to an earlier submission. Counted as the same source."
      : createdEvent
        ? "First report received. Marked as an early signal."
        : "Additional report received and matched to this event.",
    tone: duplicateOf ? "negative" : "signal",
  });

  await supabase
    .from("events")
    .update({ last_updated_at: new Date().toISOString(), share_count: (matched?.share_count ?? 0) + 1 })
    .eq("id", eventId);

  return { reportId: report.id, eventId, createdEvent };
}

function provisionalTitle(content: string, locationName: string): string {
  const words = content.trim().split(/\s+/).slice(0, 9).join(" ");
  const place = locationName ? ` — ${locationName}` : "";
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}${place}`.slice(0, 90);
}

/** Step 2 — background: AI analysis, evidence, truth-state recalculation. */
export async function runAnalysis(
  reportId: string,
  eventId: string,
  input: SubmitInput,
  createdEvent: boolean,
): Promise<void> {
  let analysis: ReportAnalysis;
  try {
    analysis = (await analyzeReport({
      data: {
        content: input.content,
        locationName: input.locationName || null,
        hasImage: input.hasImage,
        hasVideo: input.hasVideo,
        channel: input.channel,
      },
    })) as ReportAnalysis;
  } catch (error) {
    await supabase
      .from("reports")
      .update({ status: "analysis_failed", ai_analysis: { summary: String(error) } })
      .eq("id", reportId);
    await supabase.from("event_timeline").insert({
      event_id: eventId,
      label: "Automated analysis could not complete for this report. The report is still on file.",
      tone: "negative",
    });
    return;
  }

  await supabase
    .from("reports")
    .update({
      status: "analyzed",
      extracted_claim: analysis.claim ?? null,
      ai_analysis: analysis as unknown as Record<string, unknown>,
    })
    .eq("id", reportId);

  const { data: reportRow } = await supabase
    .from("reports")
    .select("is_duplicate_of")
    .eq("id", reportId)
    .maybeSingle();
  const isDuplicate = Boolean(reportRow?.is_duplicate_of);

  await supabase.from("evidence").insert({
    event_id: eventId,
    report_id: reportId,
    kind: input.hasVideo ? "video" : input.hasImage ? "image" : input.channel === "voice" ? "audio" : "text_report",
    supports_claim: !isDuplicate,
    contradicts_claim: false,
    excluded: isDuplicate,
    exclusion_reason: isDuplicate
      ? "Wording is identical to an earlier submission. Counted as one source."
      : null,
    independence_signals: isDuplicate ? ["repeated wording"] : ["unique wording", "submitter location attached"],
    analysis: analysis.summary ?? "",
  });

  if (analysis.text_signals?.length) {
    await supabase.from("event_timeline").insert({
      event_id: eventId,
      label: `Language review: ${analysis.text_signals.slice(0, 2).join("; ")}.`,
      tone: "negative",
    });
  }

  if ((input.hasImage || input.hasVideo) && analysis.visual_review?.length) {
    await supabase.from("event_timeline").insert({
      event_id: eventId,
      label: `AI visual review flagged: ${analysis.visual_review.slice(0, 2).join("; ")}. Not a forensic determination.`,
      tone: "negative",
    });
  }

  await recomputeEvent(eventId, createdEvent ? analysis : undefined);
}

/** Recomputes independent sources and the truth state from the evidence graph. */
export async function recomputeEvent(eventId: string, analysis?: ReportAnalysis): Promise<void> {
  const [{ data: evidenceRows }, { data: eventRow }] = await Promise.all([
    supabase.from("evidence").select("*").eq("event_id", eventId),
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
  ]);
  if (!eventRow) return;

  const evidence = evidenceRows ?? [];
  const supporting = evidence.filter((e) => e.supports_claim && !e.excluded).length;
  const contradicting = evidence.filter((e) => e.contradicts_claim && !e.excluded).length;
  const official = evidence.filter(
    (e) => !e.excluded && e.supports_claim && (e.kind === "official_statement" || e.kind === "media_report"),
  ).length;

  const independent = Math.max(1, supporting);

  let state: TruthState = eventRow.truth_state as TruthState;
  if (eventRow.truth_state !== "false") {
    if (contradicting > 0 && supporting > 0) state = "disputed";
    else if (official > 0 || supporting >= 4) state = "confirmed";
    else if (supporting >= 2) state = "corroborated";
    else state = "early_signal";
  }

  const patch: Record<string, unknown> = {
    truth_state: state,
    independent_sources: independent,
    freshness_score: 1,
    last_updated_at: new Date().toISOString(),
  };

  if (analysis) {
    if (analysis.title) patch.title = analysis.title;
    if (analysis.summary) patch.description = analysis.summary;
    if (analysis.category) patch.category = analysis.category;
    if (analysis.location_guess && analysis.location_guess !== "unspecified") {
      patch.location_name = analysis.location_guess;
    }
  }

  await supabase.from("events").update(patch).eq("id", eventId);

  if (state !== eventRow.truth_state) {
    await supabase.from("event_timeline").insert({
      event_id: eventId,
      label: `Status changed to ${state.replace("_", " ")} based on ${supporting} independent supporting item(s) and ${contradicting} contradicting item(s).`,
      tone: state === "disputed" ? "contradiction" : "positive",
    });
  }
}
