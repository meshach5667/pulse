import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeReport(content: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return {
      claim: content,
      summary: "Report received. AI analysis is pending configuration.",
      confidence: "low",
      language: "English",
      text_signals: ["No Gemini API key configured"],
    };
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
  const result = await model.generateContent(
    `Return JSON only with claim, summary, location_guess, category, confidence, text_signals, missing_context. Analyze this local report without asserting it is true: ${content}`,
  );
  const text = result.response.text().replace(/^```json\s*|\s*```$/g, "");
  return JSON.parse(text) as Record<string, unknown>;
}
