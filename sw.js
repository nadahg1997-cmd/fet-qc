// Service worker: يجعل البرنامج يفتح ويعمل دون إنترنت
// الصفحة الرئيسية: من الإنترنت أولاً (لأخذ آخر تحديث)، ومن النسخة المحفوظة عند انقطاعه
const CACHE = 'fet-qc-v7.7';
const CORE = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './xlsx.full.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  const fresh = same && (req.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(url.pathname) || url.pathname.endsWith('config.js'));
  if (fresh) {
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await timeout(fetch(req, { cache: 'no-store' }), 5000); if (r && r.ok) { c.put(req, r.clone()); return r; } throw 0; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || (await c.match('./index.html')) || new Response('', { status: 504 }); }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: same });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('', { status: 504 });
  }));
});
