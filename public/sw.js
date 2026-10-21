const CACHE_NAME = "solace-next-shell-v2";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest", "/solace-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => { if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); } return response; }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/offline"))));
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || { title: "A moment for yourself", body: "Return to your Solace practice." };
  event.waitUntil(self.registration.showNotification(data.title || "A moment for yourself", { body: data.body, icon: "/solace-icon.svg", badge: "/solace-icon.svg" }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => windows[0]?.focus() || clients.openWindow("/")));
});
