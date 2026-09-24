import type { PulseProfile, PushSubscriptionData } from "./types";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("Service Worker registration failed:", err);
    return null;
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await registerServiceWorker();
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error("Failed to get push subscription:", err);
    return null;
  }
}

export async function subscribeToPush(
  profile?: PulseProfile | null,
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error:
          permission === "denied"
            ? "Notification permission was blocked in browser settings."
            : "Notification permission was not granted.",
      };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: "Failed to initialize service worker." };
    }

    // Get VAPID public key from backend
    const keyRes = await fetch("/api/push/vapid-public-key");
    if (!keyRes.ok) {
      throw new Error("Unable to retrieve push notification server keys.");
    }
    const { publicKey } = (await keyRes.json()) as { publicKey: string };
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe with pushManager
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    const subJson = sub.toJSON() as PushSubscriptionData;
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      throw new Error("Invalid push subscription received from browser.");
    }

    // Register subscription on backend
    const registerRes = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        userId: profile?.id,
        city: profile?.city,
        latitude: profile?.latitude,
        longitude: profile?.longitude,
      }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save push subscription on server.");
    }

    return { success: true, subscription: sub };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription failed.";
    console.error("Push subscription error:", error);
    return { success: false, error: message };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };
  try {
    const reg = await registerServiceWorker();
    if (!reg) return { success: true };

    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      // Inform server to remove from database
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {
        // ignore background removal error
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe.",
    };
  }
}

export async function sendTestPushNotification(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  try {
    const sub = await getExistingPushSubscription();
    if (!sub) {
      return {
        success: false,
        error: "No active push subscription found. Please enable notifications first.",
      };
    }

    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || "Failed to trigger test notification." };
    }

    return { success: true, message: data.message || "Test push notification sent successfully!" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during test.",
    };
  }
}

export async function syncPushSubscription(profile: PulseProfile): Promise<void> {
  if (!isPushSupported() || Notification.permission !== "granted") return;
  try {
    const sub = await getExistingPushSubscription();
    if (!sub) return;

    const subJson = sub.toJSON() as PushSubscriptionData;
    if (!subJson.endpoint || !subJson.keys) return;

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        userId: profile.id,
        city: profile.city,
        latitude: profile.latitude,
        longitude: profile.longitude,
      }),
    });
  } catch {
    // Silent background sync
  }
}
