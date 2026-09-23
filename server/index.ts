import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { analyzeReport } from "./ai.js";
import { evidence, events, getDb, reports } from "./db.js";

const app = express();
const clients = new Set<express.Response>();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_request, response) => response.json({ ok: true, service: "pulse-api" }));
app.get("/api/events", async (request, response) => {
  const db = await getDb();
  const city = typeof request.query.city === "string" ? request.query.city : undefined;
  const result = await events(db)
    .find(city ? { city } : {})
    .sort({ last_updated_at: -1 })
    .toArray();
  response.json(result);
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
app.get("/api/events/:id/evidence", async (request, response) => {
  const db = await getDb();
  response.json(
    await evidence(db).find({ event_id: request.params.id }).sort({ created_at: 1 }).toArray(),
  );
});
app.post("/api/reports", async (request, response) => {
  const { content, city, latitude, longitude } = request.body as {
    content?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  if (!content?.trim()) return response.status(400).json({ error: "content is required" });
  const db = await getDb();
  const reportId = randomUUID();
  const eventId = randomUUID();
  const now = new Date().toISOString();
  const event = {
    id: eventId,
    title: content.trim().slice(0, 90),
    description: "Analyzing this report…",
    location_name: city ?? "Unknown location",
    city: city ?? "Unknown",
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
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
    content,
    location_name: city ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    extracted_claim: null,
    ai_analysis: {},
    status: "analyzing",
    channel: "text",
    created_at: now,
  });
  broadcast({ type: "event.created", eventId });
  response.status(202).json({ reportId, eventId });
  void processReport(db, event, reportId, content);
});

async function processReport(
  db: Awaited<ReturnType<typeof getDb>>,
  event: Parameters<typeof events>[0] extends never
    ? never
    : import("../src/lib/pulse/types.js").PulseEvent,
  reportId: string,
  content: string,
) {
  try {
    const analysis = await analyzeReport(content);
    await reports(db).updateOne(
      { id: reportId },
      {
        $set: {
          extracted_claim: String(analysis.claim ?? content),
          ai_analysis: analysis,
          status: "analyzed",
        },
      },
    );
    await evidence(db).insertOne({
      id: randomUUID(),
      event_id: event.id,
      report_id: reportId,
      source_id: null,
      kind: "text_report",
      supports_claim: false,
      contradicts_claim: false,
      excluded: false,
      exclusion_reason: null,
      independence_signals: ["new report"],
      analysis: String(analysis.summary ?? "Analysis complete."),
      created_at: new Date().toISOString(),
    });
    await events(db).updateOne(
      { id: event.id },
      {
        $set: {
          description: String(analysis.summary ?? event.description),
          last_updated_at: new Date().toISOString(),
        },
      },
    );
    broadcast({ type: "event.updated", eventId: event.id });
  } catch (error) {
    console.error("Report analysis failed", error);
  }
}
function broadcast(payload: unknown) {
  for (const client of clients) client.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default app;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 8787);
  app.listen(port, () => console.log(`PULSE API listening on http://localhost:${port}`));
}
