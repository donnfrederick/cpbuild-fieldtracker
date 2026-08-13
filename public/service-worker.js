const CACHE_NAME = 'cpBuild-cache-v1';
const GOOGLE_FONTS_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Encode+Sans:wght@400;500;600;700&display=swap';
const GOOGLE_FONTS_BASE = 'https://fonts.gstatic.com';

const cacheableUrls = [
  'InstallTracker/GetReadyTaskSummaryByUser',
  'LaborManager/GetReadyTasksSummary',
  'TaskSubmissionViewer/GetTaskSubmissionViewerDetails',
  'TaskSubmissionViewer/GetTaskSubmissionViewerDetailsBulkForOffline',
  'TaskSubmissionViewer/GetWorkHourSubmissions',
  'TaskSubmissionViewer/GetUnitLevelWorkHourSubmissionTypesByPhaseId',
  'TaskSubmissionViewer/UpdateUnitTask',
  'TaskSubmissionViewer/UpdateUnitByScope',
  'ClearInspection/UpdateDeficiency',
];

const SHELL_URLS = ['/', '/index.html'];

// ⬇️ Install: Pre-cache shell and assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');

  event.waitUntil(
    fetch('/sw-assets.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch sw-assets.json: ${res.status}`);
        return res.json();
      })
      .then((assetUrls) => {
        const filesToCache = [...SHELL_URLS, ...assetUrls, GOOGLE_FONTS_CSS_URL];
        return caches.open(CACHE_NAME).then((cache) => {
          console.log(`[SW] Caching ${filesToCache.length} assets (shell + static + fonts)`);
          return cache.addAll(filesToCache);
        });
      })
      .catch((err) => console.error('[SW] Failed to cache assets:', err))
  );
});

// ⬇️ Activate: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('🧹 [SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
});

// ⬇️ Fetch: Runtime cache handling
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 🚫 Skip handling certain API calls
  if (cacheableUrls.some((path) => url.pathname.includes(path))) return;
  if (request.method !== 'GET') return;

  // 🟢 NetworkFirst for HTML shell (navigation)
  if (request.mode === 'navigate' && url.origin === location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() => {
          console.warn('⚠️ [SW] Navigation fallback to cache:', request.url);
          return caches.match('/index.html').then((cached) => {
            if (cached) return cached;

            return new Response(
              `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Offline</title>
                  <style>
                    body {
                      font-family: sans-serif;
                      background: #f8f9fa;
                      color: #333;
                      text-align: center;
                      padding: 2rem;
                    }
                    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
                    p { font-size: 1rem; margin-bottom: 1rem; }
                    button {
                      font-size: 1rem;
                      padding: 0.5rem 1rem;
                      background: #007bff;
                      color: white;
                      border: none;
                      border-radius: 0.25rem;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <h1>You’re offline</h1>
                  <p>This page isn't cached yet or your connection was lost.</p>
                  <p>Once you're back online, reload the dashboard to continue.</p>
                  <button onclick="location.reload()">Reload Dashboard</button>
                </body>
                </html>
              `,
              {
                headers: { 'Content-Type': 'text/html' },
                status: 503,
                statusText: 'Service Unavailable',
              }
            );
          });
        })
    );
    return;
  }

  // 🟡 Google Fonts CSS
  if (request.url === GOOGLE_FONTS_CSS_URL) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // 🟡 Google Fonts files
  if (request.url.startsWith(GOOGLE_FONTS_BASE)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // 🟢 Static assets (JS, CSS, fonts, images)
  if (
    url.origin === location.origin &&
    (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/assets/'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          console.log('✅ [SW] Cached asset served:', request.url);
          return cached;
        }
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => {
            console.warn('⚠️ [SW] Asset failed to load and is not cached:', request.url);
          });
      })
    );
    return;
  }

  // 🟠 Default: CacheFirst fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        console.log('✅ [SW] Cached (default):', request.url);
        return cached;
      }
      return fetch(request)
        .then((response) => {
          console.log('🌐 [SW] Fetched (default):', request.url);
          return response;
        })
        .catch(() => {
          console.warn('⚠️ [SW] Offline and no cache match:', request.url);
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});
