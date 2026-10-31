/* v0 서비스 워커: 앱을 폰에 저장해서 지하에서도 열리게 한다. */
const CACHE = "v0-incheon-2026-10-31-1";
const ASSETS = ["./", "./index.html", "./app.js", "./station.js", "./manifest.webmanifest", "./vendor/jsQR.js", "./vendor/qrcode.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  if (req.mode === "navigate") { e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; }).catch(() => caches.match("./index.html"))); return; }
  // station.js는 현장조사 뒤 자주 바뀌므로 네트워크 먼저, 나머지는 저장본 먼저
  if (url.pathname.endsWith("/station.js")) { e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req))); return; }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL("./" + ((e.notification.data && e.notification.data.hash) || ""), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { if (c.navigate) c.navigate(target).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
