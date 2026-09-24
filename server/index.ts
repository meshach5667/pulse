import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { analyzeReport, answerQuestion } from "./ai.js";
import { events, evidence, getDb, reports, timeline } from "./db.js";
import type { PulseEvent } from "../src/lib/pulse/types.js";

const app = express();
const clients = new Set<express.Response>();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_request, response) =>
  response.json({ ok: true, database: "mongodb", ai: Boolean(process.env.GEMINI_API_KEY) }),
);
app.get("/api/events", async (request, response) => {
  try {
    const db = await getDb();
    const city = typeof request.query.city === "string" ? request.query.city : undefined;
    response.json(
      await events(db)
        .find(city ? { city } : {})
        .sort({ last_updated_at: -1 })
        .toArray(),
    );
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.get("/api/events/stream", (_request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders();
  clients.add(response);
  response.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
  response.on("close", () => clients.delete(response));
});
app.get("/api/events/:id", async (request, response) => {
  try {
    const db = await getDb();
    response.json(await events(db).findOne({ id: request.params.id }));
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.get("/api/events/:id/evidence", async (request, response) => {
  try {
    const db = await getDb();
    const [items, history, eventReports] = await Promise.all([
      evidence(db).find({ event_id: request.params.id }).sort({ created_at: 1 }).toArray(),
      timeline(db).find({ event_id: request.params.id }).sort({ occurred_at: 1 }).toArray(),
      reports(db).find({ event_id: request.params.id }).sort({ created_at: 1 }).toArray(),
    ]);
    response.json({ evidence: items, timeline: history, reports: eventReports });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.get("/api/reports", async (request, response) => {
  try {
    const db = await getDb();
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    response.json(
      await reports(db)
        .find(userId ? { user_id: userId } : {})
        .sort({ created_at: -1 })
        .toArray(),
    );
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.post("/api/reports", async (request, response) => {
  try {
    const input = request.body as {
      userId?: string;
      content?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      channel?: string;
      media?: string[];
    };
    if (!input.content?.trim())
      return response.status(400).json({ error: "Report content is required." });
    const db = await getDb();
    const now = new Date().toISOString();
    const eventId = randomUUID();
    const reportId = randomUUID();
    const event = {
      id: eventId,
      title: input.content.trim().slice(0, 90),
      description: "Analyzing this report…",
      location_name: input.locationName || input.city || "Unknown location",
      city: input.city || "Unknown",
      latitude: input.latitude ?? 0,
      longitude: input.longitude ?? 0,
      first_reported_at: now,
      last_updated_at: now,
      truth_state: "early_signal" as const,
      freshness_score: 1,
      share_count: 1,
      independent_sources: 1,
      category: "general",
    };
    await events(db).insertOne(event);
    await reports(db).insertOne({
      id: reportId,
      event_id: eventId,
      user_id: input.userId,
      content: input.content,
      location_name: input.locationName ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      extracted_claim: null,
      ai_analysis: {},
      status: "analyzing",
      channel: input.channel ?? "text",
      created_at: now,
    });
    await timeline(db).insertOne({
      id: randomUUID(),
      event_id: eventId,
      occurred_at: now,
      label: "First report received. Marked as an early signal.",
      tone: "signal",
    });
    broadcast({ type: "event.created", eventId });
    response.status(202).json({ reportId, eventId, createdEvent: true });
    void processReport(db, event, reportId, input);
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.post("/api/ai/analyze", async (request, response) => {
  try {
    response.json(await analyzeReport(request.body));
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});
app.post("/api/ai/ask", async (request, response) => {
  try {
    response.json(await answerQuestion(request.body));
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

async function processReport(
  db: Awaited<ReturnType<typeof getDb>>,
  event: PulseEvent,
  reportId: string,
  input: Record<string, unknown>,
) {
  try {
    const analysis = await analyzeReport({
      content: String(input.content),
      locationName: typeof input.locationName === "string" ? input.locationName : null,
      channel: String(input.channel ?? "text"),
      hasImage: false,
      hasVideo: false,
    });
    const now = new Date().toISOString();
    await reports(db).updateOne(
      { id: reportId },
      {
        $set: {
          status: "analyzed",
          extracted_claim: String(analysis.claim ?? input.content),
          ai_analysis: analysis,
        },
      },
    );
    await evidence(db).insertOne({
      id: randomUUID(),
      event_id: event.id,
      report_id: reportId,
      source_id: null,
      kind: "text_report",
      supports_claim: true,
      contradicts_claim: false,
      excluded: false,
      exclusion_reason: null,
      independence_signals: ["submitter location attached"],
      analysis: String(analysis.summary ?? "Analysis complete."),
      created_at: now,
    });
    await events(db).updateOne(
      { id: event.id },
      {
        $set: {
          title: String(analysis.title ?? event.title),
          description: String(analysis.summary ?? event.description),
          category: String(analysis.category ?? event.category),
          location_name: String(analysis.location_guess ?? event.location_name),
          independent_sources: 1,
          last_updated_at: now,
        },
      },
    );
    await timeline(db).insertOne({
      id: randomUUID(),
      event_id: event.id,
      occurred_at: now,
      label:
        "AI analysis completed. The report remains an early signal pending independent confirmation.",
      tone: "neutral",
    });
    broadcast({ type: "event.updated", eventId: event.id });
  } catch (error) {
    console.error("Report analysis failed:", errorMessage(error));
  }
}
function broadcast(payload: unknown) {
  for (const client of clients) client.write(`data: ${JSON.stringify(payload)}\n\n`);
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Service unavailable";
}

export default app;
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 8787);
  app.listen(port, () => console.log(`PULSE API listening on http://localhost:${port}`));
}
