// PULSE Service Worker for Real-time Web Push Notifications
const SW_VERSION = "pulse-sw-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "⚡ PULSE Intelligence Alert",
    body: "New real-time signal detected in your area.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    url: "/",
    tag: "pulse-alert",
    timestamp: Date.now(),
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || "/favicon.svg",
    badge: data.badge || "/favicon.svg",
    tag: data.tag || "pulse-alert",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || (data.eventId ? `/?event=${data.eventId}` : "/"),
      eventId: data.eventId,
      timestamp: data.timestamp || Date.now(),
    },
    actions: data.eventId
      ? [
          { action: "open", title: "View Signal" },
          { action: "dismiss", title: "Dismiss" },
        ]
      : undefined,
  };

  // Inform any foreground client windows about the incoming push in real-time
  const notifyClients = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: "PULSE_PUSH_RECEIVED",
          payload: data,
        });
      }
    });

  const showNotification = self.registration.showNotification(data.title, notificationOptions);

  event.waitUntil(Promise.all([showNotification, notifyClients]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || "/";
  const eventId = notifData.eventId;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it to show the event
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if (eventId) {
            client.postMessage({
              type: "PULSE_OPEN_EVENT",
              eventId,
            });
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
