/* Offline cache voor de Golfwedstrijd-app.
   Werkwijze "eerst netwerk, dan cache": met netwerk krijg je altijd de nieuwste versie van de
   app (en die wordt meteen in de cache gezet), zonder netwerk opent de app uit de cache.
   Verzoeken naar andere sites (JSONBin) worden niet onderschept. Verhoog CACHE_NAAM als je
   bestanden toevoegt of hernoemt. */
const CACHE_NAAM = "golfwedstrijd-v4.3";
const BESTANDEN = [
  "./",
  "index.html",
  "app.js",
  "style.css",
  "baan.json",
  "categorieen.json",
  "teeregels.json",
  "baantestregels.json",
  "opmerkingen.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAAM).then(cache => cache.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n.startsWith("golfwedstrijd-") && n !== CACHE_NAAM).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req, { cache: "no-cache" })
      .then(resp => {
        if (resp && resp.ok) {
          const kopie = resp.clone();
          caches.open(CACHE_NAAM).then(cache => cache.put(req, kopie));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
