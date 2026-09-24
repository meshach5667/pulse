// Self-destroying service worker to cleanly unregister legacy service workers and clear caches
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim()),
  );
});

// Do not intercept any fetch events so Vite and network requests proceed without errors
self.addEventListener("fetch", () => {
  return;
});
