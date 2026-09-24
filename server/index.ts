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

// Normalize rewritten URLs from Vercel so routes matching /api/* always work
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});

interface GeocodeResult {
  city: string;
  area: string | null;
  state: string | null;
  country: string | null;
  display_name: string;
  latitude: number;
  longitude: number;
}

const geocodeCache = new Map<string, { data: GeocodeResult; time: number }>();

app.get("/api/geocode/reverse", async (request, response) => {
  const lat = Number(request.query["lat"]);
  const lon = Number(request.query["lon"]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    response.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 3600000) {
    response.json(cached.data);
    return;
  }

  // 1. Try Nominatim
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        headers: { "User-Agent": "PulseLocalIntelligence/1.0" },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (osmRes.ok) {
      const data = (await osmRes.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };
      const addr: Record<string, string | undefined> = data.address ?? {};
      const state = addr["state"] || addr["province"] || addr["region"] || null;
      let city =
        addr["city"] ||
        addr["town"] ||
        addr["municipality"] ||
        addr["county"] ||
        addr["city_district"] ||
        addr["state_district"] ||
        null;
      let area =
        addr["suburb"] ||
        addr["neighbourhood"] ||
        addr["district"] ||
        addr["village"] ||
        addr["quarter"] ||
        addr["residential"] ||
        null;

      // Special normalization for FCT / Abuja
      if (
        state &&
        (state.toLowerCase().includes("federal capital territory") ||
          state.toLowerCase().includes("fct"))
      ) {
        if (
          !city ||
          city.toLowerCase().includes("council") ||
          city.toLowerCase().includes("municipal")
        ) {
          area = area || city || "Central District";
          city = "Abuja";
        }
      }

      if (city) {
        city = city.replace(/^(City of|Municipality of)\s+/i, "").trim();
        const result: GeocodeResult = {
          city,
          area: area && area.toLowerCase() !== city.toLowerCase() ? area : null,
          state,
          country: addr["country"] ?? null,
          display_name: data.display_name ?? `${city}, ${state ?? ""}`,
          latitude: lat,
          longitude: lon,
        };
        geocodeCache.set(cacheKey, { data: result, time: Date.now() });
        response.json(result);
        return;
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 2. Try BigDataCloud
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (bdcRes.ok) {
      const data = (await bdcRes.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      let city = data.city || data.locality || data.principalSubdivision || null;
      const area = data.locality || null;
      const state = data.principalSubdivision || null;

      if (state && (state.toLowerCase().includes("abuja") || state.toLowerCase().includes("fct"))) {
        city = "Abuja";
      }

      if (city) {
        const result: GeocodeResult = {
          city,
          area: area && area.toLowerCase() !== city.toLowerCase() ? area : null,
          state,
          country: data.countryName ?? null,
          display_name: `${city}${state ? `, ${state}` : ""}`,
          latitude: lat,
          longitude: lon,
        };
        geocodeCache.set(cacheKey, { data: result, time: Date.now() });
        response.json(result);
        return;
      }
    }
  } catch {
    // Continue
  }

  response.status(404).json({ error: "Could not reverse geocode coordinates" });
});

app.get("/api/geocode/search", async (request, response) => {
  const qVal = request.query["q"];
  const query = typeof qVal === "string" ? qVal.trim() : "";
  if (!query || query.length < 2) {
    response.json([]);
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      {
        headers: { "User-Agent": "PulseLocalIntelligence/1.0" },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (res.ok) {
      const list = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
        address?: Record<string, string>;
      }>;
      const results = list.map((item) => {
        const addr: Record<string, string | undefined> = item.address ?? {};
        const state = addr["state"] || addr["province"] || addr["region"] || null;
        let city =
          addr["city"] ||
          addr["town"] ||
          addr["municipality"] ||
          addr["county"] ||
          addr["state_district"] ||
          query;
        if (
          state &&
          (state.toLowerCase().includes("federal capital territory") ||
            state.toLowerCase().includes("fct"))
        ) {
          city = "Abuja";
        }
        return {
          city,
          area: addr["suburb"] || addr["neighbourhood"] || addr["district"] || null,
          state,
          country: addr["country"] ?? null,
          display_name: item.display_name,
          latitude: Number.parseFloat(item.lat),
          longitude: Number.parseFloat(item.lon),
        };
      });
      response.json(results);
      return;
    }
  } catch {
    // Fall back to empty array
  }

  response.json([]);
});

app.get(["/api", "/api/health"], (_request, response) =>
  response.json({ ok: true, database: "mongodb", ai: Boolean(process.env["GEMINI_API_KEY"]) }),
);

app.get("/api/events", async (request, response) => {
  try {
    const db = await getDb();
    const city = typeof request.query["city"] === "string" ? request.query["city"] : undefined;
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
    const id = request.params["id"];
    response.json(await events(db).findOne({ id }));
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.get("/api/events/:id/evidence", async (request, response) => {
  try {
    const db = await getDb();
    const eventId = request.params["id"];
    const [items, history, eventReports] = await Promise.all([
      evidence(db).find({ event_id: eventId }).sort({ created_at: 1 }).toArray(),
      timeline(db).find({ event_id: eventId }).sort({ occurred_at: 1 }).toArray(),
      reports(db).find({ event_id: eventId }).sort({ created_at: 1 }).toArray(),
    ]);
    response.json({ evidence: items, timeline: history, reports: eventReports });
  } catch (error) {
    response.status(503).json({ error: errorMessage(error) });
  }
});

app.get("/api/reports", async (request, response) => {
  try {
    const db = await getDb();
    const userId = typeof request.query["userId"] === "string" ? request.query["userId"] : undefined;
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
    const input = (request.body ?? {}) as {
      userId?: string;
      content?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      channel?: string;
      media?: string[];
    };
    if (!input.content?.trim()) {
      response.status(400).json({ error: "Report content is required." });
      return;
    }
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
      user_id: input.userId ?? "anonymous",
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
    // Guarantee AI analysis and updates are persisted before completing response (needed on serverless)
    await processReport(db, event, reportId, input);
    response.status(202).json({ reportId, eventId, createdEvent: true });
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
  input: {
    userId?: string;
    content?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    channel?: string;
    media?: string[];
  },
) {
  try {
    const analysis = await analyzeReport({
      content: String(input.content ?? ""),
      locationName: typeof input.locationName === "string" ? input.locationName : null,
      channel: String(input.channel ?? "text"),
      hasImage: false,
      hasVideo: false,
    });
    const now = new Date().toISOString();
    const claim = typeof analysis["claim"] === "string" ? analysis["claim"] : (input.content ?? "");
    const title = typeof analysis["title"] === "string" ? analysis["title"] : event.title;
    const summary = typeof analysis["summary"] === "string" ? analysis["summary"] : event.description;
    const category = typeof analysis["category"] === "string" ? analysis["category"] : event.category;
    const locationGuess =
      typeof analysis["location_guess"] === "string" ? analysis["location_guess"] : event.location_name;

    await reports(db).updateOne(
      { id: reportId },
      {
        $set: {
          status: "analyzed",
          extracted_claim: claim,
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
      analysis: summary || "Analysis complete.",
      created_at: now,
    });
    await events(db).updateOne(
      { id: event.id },
      {
        $set: {
          title,
          description: summary,
          category,
          location_name: locationGuess,
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

if (!process.env["VERCEL"]) {
  const port = Number(process.env["PORT"] ?? 8787);
  app.listen(port, () => console.log(`PULSE API listening on http://localhost:${port}`));
}
