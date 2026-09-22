import type { TruthState } from "./types";

interface StatusMeta {
  label: string;
  /** Tailwind colour token name for this state. */
  token: string;
  short: string;
  meaning: string;
}

export const STATUS_META: Record<TruthState, StatusMeta> = {
  early_signal: {
    label: "Early signal",
    token: "signal",
    short: "Reported, not yet corroborated",
    meaning: "A report exists, but there is insufficient independent evidence.",
  },
  corroborated: {
    label: "Corroborated",
    token: "corroborated",
    short: "Multiple independent reports",
    meaning: "Multiple independent reports support this event.",
  },
  confirmed: {
    label: "Confirmed",
    token: "confirmed",
    short: "Strong or credible-source evidence",
    meaning: "Strong evidence or a credible source confirms the event.",
  },
  disputed: {
    label: "Disputed",
    token: "disputed",
    short: "Credible reports conflict",
    meaning: "Credible reports conflict. Both accounts are shown.",
  },
  false: {
    label: "False",
    token: "falsehood",
    short: "Evidence indicates the claim is false",
    meaning: "Available evidence strongly indicates the claim is false.",
  },
  expired: {
    label: "Expired",
    token: "expired",
    short: "No longer current",
    meaning: "This information is no longer considered current.",
  },
};

export const ORDERED_STATES: TruthState[] = [
  "early_signal",
  "corroborated",
  "confirmed",
  "disputed",
  "false",
  "expired",
];

export function statusTextClass(state: TruthState): string {
  return {
    early_signal: "text-signal",
    corroborated: "text-corroborated",
    confirmed: "text-confirmed",
    disputed: "text-disputed",
    false: "text-falsehood",
    expired: "text-expired",
  }[state];
}

export function statusBgClass(state: TruthState): string {
  return {
    early_signal: "bg-signal",
    corroborated: "bg-corroborated",
    confirmed: "bg-confirmed",
    disputed: "bg-disputed",
    false: "bg-falsehood",
    expired: "bg-expired",
  }[state];
}

export function statusSoftClass(state: TruthState): string {
  return {
    early_signal: "bg-signal/15 text-signal",
    corroborated: "bg-corroborated/12 text-corroborated",
    confirmed: "bg-confirmed/12 text-confirmed",
    disputed: "bg-disputed/20 text-falsehood",
    false: "bg-falsehood/12 text-falsehood",
    expired: "bg-expired/12 text-expired",
  }[state];
}
