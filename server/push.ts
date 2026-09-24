import webpush from "web-push";
import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { pushSubscriptions } from "./db.js";
import type { PushNotificationPayload, PushSubscriptionRecord } from "../src/lib/pulse/types.js";

const DEFAULT_VAPID_PUBLIC_KEY =
  "BHyyif9xvyovZKIn8sB7bY1-faXrTM4aCOCKmTibi6tydcXGW_cO0RBHXV-A-i_WBshFZ3Elt00CUG1ME68uPKc";
const DEFAULT_VAPID_PRIVATE_KEY = "NHz3DxMCRB3N1FUZ-N68wu4YHlFzWS1cZExsHlVhItE";
const DEFAULT_VAPID_SUBJECT = "mailto:alerts@pulse-intelligence.local";

const vapidPublicKey = process.env["VAPID_PUBLIC_KEY"] || DEFAULT_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env["VAPID_PRIVATE_KEY"] || DEFAULT_VAPID_PRIVATE_KEY;
const vapidSubject = process.env["VAPID_SUBJECT"] || DEFAULT_VAPID_SUBJECT;

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (error) {
  console.error("Failed to initialize VAPID details for Web Push:", error);
}

// In-memory cache of subscriptions for instant delivery and resilience
const memorySubscriptions = new Map<string, PushSubscriptionRecord>();

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

export async function savePushSubscription(
  db: Db | null,
  data: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userId?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<PushSubscriptionRecord> {
  const now = new Date().toISOString();
  const existing = memorySubscriptions.get(data.endpoint);
  const record: PushSubscriptionRecord = {
    id: existing?.id || randomUUID(),
    endpoint: data.endpoint,
    keys: data.keys,
    userId: data.userId || existing?.userId,
    city: data.city || existing?.city,
    latitude: data.latitude ?? existing?.latitude,
    longitude: data.longitude ?? existing?.longitude,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  memorySubscriptions.set(data.endpoint, record);

  if (db) {
    try {
      await pushSubscriptions(db).updateOne(
        { endpoint: data.endpoint },
        {
          $set: {
            keys: data.keys,
            userId: record.userId,
            city: record.city,
            latitude: record.latitude,
            longitude: record.longitude,
            updated_at: now,
          },
          $setOnInsert: {
            id: record.id,
            endpoint: record.endpoint,
            created_at: record.created_at,
          },
        },
        { upsert: true },
      );
    } catch (err) {
      console.error("Failed to persist push subscription to MongoDB:", err);
    }
  }

  return record;
}

export async function removePushSubscription(db: Db | null, endpoint: string): Promise<boolean> {
  memorySubscriptions.delete(endpoint);
  if (db) {
    try {
      await pushSubscriptions(db).deleteOne({ endpoint });
      return true;
    } catch (err) {
      console.error("Failed to remove push subscription from MongoDB:", err);
    }
  }
  return true;
}

export async function sendPushToSubscription(
  db: Db | null,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushNotificationPayload,
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const stringified = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/favicon.svg",
      badge: payload.badge || "/favicon.svg",
      url: payload.url || "/",
      eventId: payload.eventId,
      tag: payload.tag || "pulse-notification",
      timestamp: payload.timestamp || Date.now(),
      data: payload.data || {},
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      stringified,
      {
        TTL: 60 * 60, // 1 hour
        urgency: "high",
      },
    );
    return { success: true };
  } catch (error: unknown) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode: unknown }).statusCode)
        : undefined;
    // 404 or 410 means subscription has expired or user revoked permission
    if (statusCode === 404 || statusCode === 410) {
      void removePushSubscription(db, subscription.endpoint);
    }
    return {
      success: false,
      status: statusCode,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function notifySubscribers(
  db: Db | null,
  options: {
    title: string;
    body: string;
    eventId?: string;
    city?: string;
    lat?: number;
    lon?: number;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
  },
): Promise<{ sent: number; failed: number; total: number }> {
  let allSubs: PushSubscriptionRecord[] = [];

  if (db) {
    try {
      allSubs = await pushSubscriptions(db).find().toArray();
      // Sync memory cache
      for (const sub of allSubs) {
        memorySubscriptions.set(sub.endpoint, sub);
      }
    } catch (err) {
      console.error("Failed to query subscriptions from MongoDB, using cache:", err);
      allSubs = Array.from(memorySubscriptions.values());
    }
  } else {
    allSubs = Array.from(memorySubscriptions.values());
  }

  if (allSubs.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  // Filter subscribers relevant to the incident:
  // 1. If incident has city, match same city (case-insensitive) OR within 50 km OR subscriber has no city set
  // 2. If no location specified on incident, notify all subscribers
  const relevantSubs = allSubs.filter((sub) => {
    if (!options.city && (options.lat === undefined || options.lon === undefined)) {
      return true;
    }

    if (
      options.city &&
      sub.city &&
      sub.city.trim().toLowerCase() === options.city.trim().toLowerCase()
    ) {
      return true;
    }

    if (
      options.lat !== undefined &&
      options.lon !== undefined &&
      sub.latitude !== undefined &&
      sub.longitude !== undefined
    ) {
      const dist = calculateDistanceKm(options.lat, options.lon, sub.latitude, sub.longitude);
      if (dist <= 60) return true; // within 60km
    }

    // If subscriber hasn't set city/location, deliver to them as broadcast
    if (!sub.city && sub.latitude === undefined) {
      return true;
    }

    return false;
  });

  const targetSubs = relevantSubs.length > 0 ? relevantSubs : allSubs;

  let sent = 0;
  let failed = 0;

  const payload: PushNotificationPayload = {
    title: options.title,
    body: options.body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    url: options.url || (options.eventId ? `/?event=${options.eventId}` : "/"),
    eventId: options.eventId,
    tag: options.tag || (options.eventId ? `pulse-event-${options.eventId}` : "pulse-alert"),
    timestamp: Date.now(),
    data: options.data || {},
  };

  const results = await Promise.allSettled(
    targetSubs.map((sub) => sendPushToSubscription(db, sub, payload)),
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, total: targetSubs.length };
}

export async function sendTestNotification(
  db: Db | null,
  endpoint: string,
): Promise<{ success: boolean; message: string }> {
  let sub = memorySubscriptions.get(endpoint);
  if (!sub && db) {
    try {
      const found = await pushSubscriptions(db).findOne({ endpoint });
      if (found) sub = found;
    } catch {
      // ignore
    }
  }

  if (!sub) {
    return {
      success: false,
      message: "Subscription endpoint not found. Please re-subscribe to push notifications.",
    };
  }

  const payload: PushNotificationPayload = {
    title: "⚡ PULSE Real-time Alert Active",
    body: "Push notifications are working perfectly! You will receive real-time alerts as signals emerge.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    url: "/",
    tag: "pulse-test-alert",
    timestamp: Date.now(),
  };

  const res = await sendPushToSubscription(db, sub, payload);
  if (res.success) {
    return { success: true, message: "Test push notification sent successfully!" };
  }
  return {
    success: false,
    message: `Push notification delivery failed: ${res.error || "Unknown error"}`,
  };
}
