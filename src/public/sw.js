const CACHE_NAME = "storyyy-shell-v4";
const RUNTIME_CACHE = "storyyy-runtime-v4";
const BASE_PATH = new URL(self.registration.scope).pathname;
const withBasePath = (path) => `${BASE_PATH}${path}`.replace(/\/{2,}/g, "/");
const APP_SHELL = [
  withBasePath(""),
  withBasePath("index.html"),
  withBasePath("manifest.webmanifest"),
  withBasePath("favicon.png"),
  withBasePath("images/icon-192.png"),
  withBasePath("images/logo.png"),
  withBasePath("images/logo-story.png"),
  withBasePath("images/screenshot-narrow.png"),
  withBasePath("images/screenshot-wide.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => ![CACHE_NAME, RUNTIME_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, withBasePath("index.html")));
    return;
  }

  if (url.origin === "https://story-api.dicoding.dev" && request.method === "GET") {
    event.respondWith(networkFirst(request));
    return;
  }

  const shouldCacheAsset =
    isSameOrigin &&
    ["script", "style", "image", "font"].includes(request.destination);

  if (shouldCacheAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Storyyy",
    options: {
      body: "Ada story baru untuk dibaca.",
      icon: withBasePath("images/logo.png"),
      badge: withBasePath("images/logo.png"),
      data: { url: `${BASE_PATH}#/` },
    },
  };

  if (event.data) {
    const textPayload = event.data.text();

    try {
      const data = JSON.parse(textPayload);
      const notification = data?.notification || data?.data || data || {};
      const notificationOptions = notification.options || {};
      const notificationData = notificationOptions.data || notification.data || {};
      const storyId = notificationData.id || notification.id;

      payload = {
        title: notification.title || payload.title,
        options: {
          ...payload.options,
          ...notificationOptions,
          body:
            notificationOptions.body ||
            notification.body ||
            notification.message ||
            notification.payload ||
            payload.options.body,
          icon: notificationOptions.icon || withBasePath("images/logo.png"),
          badge: notificationOptions.badge || withBasePath("images/logo.png"),
          data: {
            ...notificationData,
            url: storyId
              ? `${BASE_PATH}#/story/${storyId}`
              : `${BASE_PATH}#/`,
          },
          actions: [
            {
              action: "open-story",
              title: "Open Story",
            },
          ],
        },
      };
    } catch (error) {
      payload = {
        ...payload,
        options: {
          ...payload.options,
          body: textPayload || payload.options.body,
        },
      };
    }
  }

  event.waitUntil(self.registration.showNotification(payload.title, payload.options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url ||
    (event.notification.data?.id
      ? `${BASE_PATH}#/story/${event.notification.data.id}`
      : `${BASE_PATH}#/`);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const origin = self.location.origin;
        const absoluteUrl = new URL(targetUrl, origin).href;
        const focusedClient = clientList.find((client) =>
          client.url.startsWith(origin),
        );

        if (focusedClient) {
          focusedClient.navigate(absoluteUrl);
          return focusedClient.focus();
        }

        return clients.openWindow(absoluteUrl);
      }),
  );
});

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    if (fallbackUrl) {
      return caches.match(fallbackUrl);
    }

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}
