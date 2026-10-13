/* Site-scoped, bounded caches. Reading pages survive asset deployments. */
const SCOPE_PATH = {{ site.Home.RelPermalink | jsonify }};
const ASSET_PATH = {{ ((urls.Parse site.BaseURL).Path | default "/") | jsonify }};
const PREFIX = 'vishine-' + {{ (substr (md5 site.Home.RelPermalink) 0 12) | jsonify }} + '-';
// Fingerprinted URLs already identify versions. Keep the bounded asset cache
// across builds so retained HTML can still load its previous CSS and scripts.
const ASSETS = PREFIX + 'assets-v2';
const PAGES = PREFIX + 'pages-v2';
const MAX_PAGES = {{ site.Params.pwaMaxPages | default 80 }};
const MAX_ASSETS = 180;
const OFFLINE_URL = {{ ("offline.html" | relURL) | jsonify }};
const PRECACHE = [OFFLINE_URL, {{ ("android-chrome-192x192.png" | relURL) | jsonify }}, {{ ("android-chrome-512x512.png" | relURL) | jsonify }}];

async function remember(name, request, response, limit) {
  if(!response || !(response.ok || response.type === 'opaque')) return;
  const cache = await caches.open(name);
  await cache.delete(request);
  await cache.put(request, response);
  const keys = await cache.keys();
  const removable = keys.filter(key => !PRECACHE.some(path => new URL(path, self.location.origin).href === key.url));
  await Promise.all(removable.slice(0, Math.max(0, keys.length-limit)).map(key => cache.delete(key)));
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(ASSETS).then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX+'assets-') && key !== ASSETS).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin && url.pathname.startsWith(SCOPE_PATH);
  if(req.mode === 'navigate' && own) {
    const network = fetch(req, {cache:'no-cache'});
    event.waitUntil(network.then(response => response.ok ? remember(PAGES, req, response.clone(), MAX_PAGES) : undefined).catch(() => {}));
    event.respondWith(network.then(async response => {
      if(response.status >= 500) return (await (await caches.open(PAGES)).match(req)) || response;
      return response;
    }).catch(async () => (await (await caches.open(PAGES)).match(req)) || (await (await caches.open(ASSETS)).match(OFFLINE_URL))));
    return;
  }
  const fonts = ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname);
  if((url.origin === self.location.origin && url.pathname.startsWith(ASSET_PATH) && /\.(css|js|mjs|json|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname)) || fonts) {
    const network = fetch(req);
    event.waitUntil(network.then(response => remember(ASSETS, req, response.clone(), MAX_ASSETS)).catch(() => {}));
    const cached = caches.open(ASSETS).then(cache => cache.match(req));
    // Search indexes use fresh data when online; immutable assets render immediately.
    event.respondWith(url.pathname.endsWith('.json')
      ? network.then(async response => response.ok ? response : (await cached) || response).catch(() => cached)
      : cached.then(response => response || network));
  }
});
