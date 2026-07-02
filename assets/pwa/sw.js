{{- /* Service Worker（Hugo 模板）——每次构建 VERSION 变，activate 清旧缓存 */ -}}
const VERSION = 'v{{ now.Unix }}';
const CACHE = 'vishine-' + VERSION;
const OFFLINE_URL = {{ ("offline.html" | relURL) | jsonify }};
const PRECACHE = [
  OFFLINE_URL,
  {{ ("android-chrome-192x192.png" | relURL) | jsonify }},
  {{ ("android-chrome-512x512.png" | relURL) | jsonify }}
];

// 安装：预缓存离线兜底页 + 图标（逐个缓存，单个缺失不致命），立即接管
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

// 激活：删除旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('vishine-') && k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return /\.(css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML 页面导航：network-first（保证看到最新文章）→ 缓存 → 离线兜底页
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // 静态资源 + Google Fonts：stale-while-revalidate（先给缓存、后台更新）
  if (isStaticAsset(url) || url.hostname.indexOf('fonts.g') !== -1) {
    event.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }
  // 其余请求：直连网络，不干预
});
