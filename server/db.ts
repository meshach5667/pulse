import { MongoClient, type Collection, type Db } from "mongodb";
import type {
  PulseEvent,
  PulseEvidence,
  PulseReport,
  PulseTimelineEntry,
} from "../src/lib/pulse/types.js";

const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017");
let database: Db | undefined;

export async function getDb(): Promise<Db> {
  if (!database) {
    await client.connect();
    database = client.db(process.env.MONGODB_DB ?? "pulse");
    await seedDemo(database);
  }
  return database;
}

export const events = (db: Db): Collection<PulseEvent> => db.collection<PulseEvent>("events");
export const evidence = (db: Db): Collection<PulseEvidence> =>
  db.collection<PulseEvidence>("evidence");
export const reports = (db: Db): Collection<PulseReport> => db.collection<PulseReport>("reports");
export const timeline = (db: Db): Collection<PulseTimelineEntry> =>
  db.collection<PulseTimelineEntry>("event_timeline");

async function seedDemo(db: Db) {
  if ((await events(db).countDocuments()) > 0) return;
  const now = Date.now();
  await events(db).insertMany([
    {
      id: "central-market-demo",
      title: "Reports of an incident near Central Market",
      description:
        "Several reports describe unusual activity near Central Market. The claim is still being assessed.",
      location_name: "Central Market",
      city: "Abuja",
      latitude: 9.0579,
      longitude: 7.4951,
      first_reported_at: new Date(now - 10 * 60_000).toISOString(),
      last_updated_at: new Date(now - 30_000).toISOString(),
      truth_state: "corroborated",
      freshness_score: 0.94,
      share_count: 14,
      independent_sources: 2,
      category: "security",
    },
    {
      id: "ibadan-road-demo",
      title: "Traffic slowing near Mokola roundabout",
      description:
        "Multiple reports describe slower traffic near Mokola. The cause is not yet independently confirmed.",
      location_name: "Mokola Roundabout",
      city: "Ibadan",
      latitude: 7.421,
      longitude: 3.905,
      first_reported_at: new Date(now - 18 * 60_000).toISOString(),
      last_updated_at: new Date(now - 2 * 60_000).toISOString(),
      truth_state: "early_signal",
      freshness_score: 0.88,
      share_count: 8,
      independent_sources: 1,
      category: "traffic",
    },
  ]);
}
