import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app yet.");
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Report analysis: claim + location extraction, text and media review */
/* ------------------------------------------------------------------ */

const AnalysisSchema = z.object({
  claim: z.string().describe("The single underlying claim, stated plainly and without drama."),
  title: z.string().describe("A short, neutral event title, max 8 words."),
  location_guess: z.string().describe("Place name mentioned in the report, or 'unspecified'."),
  language: z.string().describe("Detected language, e.g. English, Nigerian Pidgin, Hausa, Yoruba, Igbo."),
  category: z.enum(["incident", "security", "traffic", "utility", "weather", "rumour", "general"]),
  text_signals: z.array(z.string()).describe("Unsupported claims, contradictions, copied wording, sensational language, suspicious certainty."),
  missing_context: z.array(z.string()).describe("What is missing before this could be corroborated."),
  visual_review: z.array(z.string()).describe("Possible visual inconsistencies if media was described; empty array otherwise."),
  summary: z.string().describe("Two calm sentences summarising what is and is not established."),
  confidence: z.enum(["low", "medium", "high"]),
});

const AnalyzeInput = z.object({
  content: z.string().min(1),
  locationName: z.string().nullable(),
  hasImage: z.boolean(),
  hasVideo: z.boolean(),
  channel: z.string(),
});

export const analyzeReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const lovable = gateway();
    const media = [data.hasImage ? "an image" : null, data.hasVideo ? "a video" : null]
      .filter(Boolean)
      .join(" and ");

    const result = streamText({
      model: lovable.responses(MODEL),
      system: [
        "You are the verification pipeline of Pulse, a local intelligence platform.",
        "Extract the underlying claim from a citizen report. Never assert that something is true or false.",
        "Flag copied or forwarded wording, sensational language and suspicious certainty.",
        "If media is attached, describe possible visual inconsistencies only. Never claim forensic deepfake detection.",
        "Stay calm and factual. Do not invent details that are not in the report.",
      ].join(" "),
      prompt: [
        `Channel: ${data.channel}`,
        `Reported location: ${data.locationName ?? "unspecified"}`,
        media ? `Attached media: ${media}` : "No media attached.",
        "",
        `Report: ${data.content}`,
      ].join("\n"),
      output: Output.object({ schema: AnalysisSchema }),
      providerOptions: reasoningOptions,
    });

    return await result.output;
  });

/* ------------------------------------------------------------------ */
/* Ask Pulse: grounded assistant over current events                   */
/* ------------------------------------------------------------------ */

const AskInput = z.object({
  question: z.string().min(1),
  city: z.string(),
  context: z.string(),
});

export const askPulse = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const lovable = gateway();

    const result = streamText({
      model: lovable.responses(MODEL),
      system: [
        "You are Ask Pulse. Answer only from the event and evidence data provided below.",
        "Never invent events, sources, numbers or times. If the data does not answer the question, say so plainly.",
        "Always communicate uncertainty and name the truth state of anything you reference.",
        "Never tell anyone that a place is safe. Keep answers under 120 words, calm and specific.",
        "Write plain prose. No markdown headings, no emoji.",
      ].join(" "),
      prompt: [
        `The person is currently in ${data.city}.`,
        "Current event data:",
        data.context,
        "",
        `Question: ${data.question}`,
      ].join("\n"),
      providerOptions: reasoningOptions,
    });

    return { answer: await result.text };
  });
