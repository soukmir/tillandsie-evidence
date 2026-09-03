/* Evidence tilandsií — service worker
   Uloží appku (shell) do telefonu natvrdo, aby šla otevřít i bez signálu,
   klidně hned po restartu telefonu. Data samotná zůstávají v IndexedDB,
   tohle jen zajišťuje, že se appka má z čeho spustit.
   Zvyš CACHE_NAME při každé nové verzi appky, ať se stažení obnoví.
*/
const CACHE_NAME = "tilandsie-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Appka: vždy zkusit síť první (ať se aktualizace projeví hned), při výpadku vzít z cache.
// Google Apps Script volání appka dělá přímo přes fetch mimo tuhle doménu,
// service worker do nich nezasahuje, jen doplňuje odpověď, když selžou úplně offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("./index.html")))
  );
});
