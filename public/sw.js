/* Service worker de Career Compass : mise en cache de tout le site statique pour un usage hors ligne.
   BUILD est remplacé à chaque build par scripts/gen-sw-manifest.mjs (ce qui déclenche la mise à jour du worker).
   Hypothèse : application servie à la racine du domaine. */
const BUILD = "__BUILD__";
const CACHE = "cc-" + BUILD;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch("/sw-manifest.json?b=" + BUILD, { cache: "no-store" });
        const urls = await res.json();
        await cache.addAll(urls);
      } catch (e) {
        /* installation partielle : la mise en cache se fera à l’usage */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("cc-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) return cached;
      const res = await network;
      return res || (await cache.match("/404.html")) || Response.error();
    })(),
  );
});
