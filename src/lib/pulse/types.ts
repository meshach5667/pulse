export type TruthState =
  | "early_signal"
  | "corroborated"
  | "confirmed"
  | "disputed"
  | "false"
  | "expired";

export type EvidenceKind =
  | "text_report"
  | "image"
  | "video"
  | "audio"
  | "official_statement"
  | "media_report"
  | "sensor";

export type SourceKind = "anonymous" | "eyewitness" | "official" | "broadcast" | "social" | "unknown";

export interface PulseEvent {
  id: string;
  title: string;
  description: string;
  location_name: string;
  city: string;
  latitude: number;
  longitude: number;
  first_reported_at: string;
  last_updated_at: string;
  truth_state: TruthState;
  freshness_score: number;
  share_count: number;
  independent_sources: number;
  category: string;
}

export interface PulseEvidence {
  id: string;
  event_id: string;
  report_id: string | null;
  source_id: string | null;
  kind: EvidenceKind;
  supports_claim: boolean;
  contradicts_claim: boolean;
  excluded: boolean;
  exclusion_reason: string | null;
  independence_signals: string[];
  analysis: string;
  created_at: string;
}

export interface PulseTimelineEntry {
  id: string;
  event_id: string;
  occurred_at: string;
  label: string;
  tone: "signal" | "positive" | "negative" | "contradiction" | "neutral" | string;
}

export interface PulseReport {
  id: string;
  event_id: string | null;
  content: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  extracted_claim: string | null;
  ai_analysis: ReportAnalysis | Record<string, never>;
  status: string;
  channel: string;
  created_at: string;
}

export interface ReportAnalysis {
  claim?: string;
  location_guess?: string;
  language?: string;
  category?: string;
  text_signals?: string[];
  missing_context?: string[];
  circulation_note?: string;
  visual_review?: string[];
  summary?: string;
  confidence?: "low" | "medium" | "high";
}

export interface PulseProfile {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  gpsGranted: boolean;
  notifications: boolean;
  simulatedTravel: boolean;
}
