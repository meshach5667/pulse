import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeReport(input: {
  content: string;
  locationName: string | null;
  channel: string;
  hasImage: boolean;
  hasVideo: boolean;
}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return {
      claim: input.content,
      title: input.content.slice(0, 80),
      location_guess: input.locationName ?? "unspecified",
      category: "general",
      language: "English",
      confidence: "low",
      text_signals: ["Gemini is not configured."],
      missing_context: ["Independent confirmation"],
      visual_review: [],
      summary:
        "This report is an early signal. Independent evidence is still needed before the claim can be corroborated.",
    };
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
  const result = await model.generateContent(
    `Return JSON only with claim, title, location_guess, category, language, confidence, text_signals, missing_context, visual_review, summary. Analyze this report calmly without asserting it is true. For media, identify possible inconsistencies only, never forensic deepfake detection. Location: ${input.locationName ?? "unspecified"}. Report: ${input.content}`,
  );
  return JSON.parse(result.response.text().replace(/^```json\s*|\s*```$/g, "")) as Record<
    string,
    unknown
  >;
}

export async function answerQuestion(input: { question: string; city: string; context: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return {
      answer: `Gemini is not configured, so I cannot analyze current reports for ${input.city} yet.`,
    };
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
  const result = await model.generateContent(
    `Answer only from the event data below. Never invent events or call a place safe. Communicate uncertainty in under 120 words. City: ${input.city}. Events: ${input.context}. Question: ${input.question}`,
  );
  return { answer: result.response.text() };
}
