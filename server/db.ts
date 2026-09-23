import { MongoClient, type Collection, type Db } from "mongodb";
import type { PulseEvent, PulseEvidence, PulseReport } from "../src/lib/pulse/types.js";

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
export const reports = (db: Db): Collection<PulseReport> => db.collection<PulseReport>("reports");
export const evidence = (db: Db): Collection<PulseEvidence> =>
  db.collection<PulseEvidence>("evidence");

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
      category: "public safety",
    },
    {
      id: "airport-road-demo",
      title: "Traffic slowing on Airport Road",
      description: "A traffic disruption has been reported near the Airport Road interchange.",
      location_name: "Airport Road",
      city: "Abuja",
      latitude: 9.0067,
      longitude: 7.4422,
      first_reported_at: new Date(now - 22 * 60_000).toISOString(),
      last_updated_at: new Date(now - 90_000).toISOString(),
      truth_state: "early_signal",
      freshness_score: 0.82,
      share_count: 31,
      independent_sources: 1,
      category: "transport",
    },
  ]);
}
