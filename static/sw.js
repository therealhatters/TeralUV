// Service worker entry for the Python UV setup.
// This keeps the implementation focused on Ultraviolet-style routing only.

importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/uv/uv.sw.js");

const uv = new UVServiceWorker();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;
  const proxiedPrefix = location.origin + self.__uv$config.prefix;

  if (requestUrl.startsWith(proxiedPrefix)) {
    event.respondWith(uv.fetch(event));
    return;
  }

  event.respondWith(fetch(event.request));
});
