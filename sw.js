/* v0 서비스 워커
   - 앱 파일은 항상 서버에서 새로 받아오고(바로 반영), 인터넷이 안 되거나 3초 넘게 걸리면 저장본을 쓴다(지하 대비).
   - 글꼴만 저장본을 먼저 쓴다. */
const CACHE = "v0-incheon-3";
const ASSETS = ["./", "./index.html", "./app.js", "./station.js", "./manifest.webmanifest", "./vendor/jsQR.js", "./vendor/qrcode.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  // 브라우저 HTTP 캐시를 건너뛰고 최신 파일로 저장
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (font) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  const nav = req.mode === "navigate";
  const key = nav ? "./index.html" : req;
  e.respondWith(
    Promise.race([fetch(url.href, { cache: "no-cache", credentials: "same-origin" }), timeout(3000)])
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(key, c)); } return r; })
      .catch(() => caches.match(key, { ignoreSearch: true }).then(hit => hit || fetch(req)))
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = new URL("./" + ((e.notification.data && e.notification.data.hash) || ""), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) { if (c.navigate) c.navigate(target).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
