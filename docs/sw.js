const CACHE_NAME = "storyyy-shell-v2";
const RUNTIME_CACHE = "storyyy-runtime-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
  "/images/icon-192.png",
  "/images/logo.png",
  "/images/logo-story.png",
  "/images/screenshot-narrow.png",
  "/images/screenshot-wide.png",
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
    event.respondWith(networkFirst(request, "/index.html"));
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
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      data: { url: "/#/" },
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        options: {
          ...payload.options,
          ...(data.options || {}),
          icon: data.options?.icon || "/images/logo.png",
          badge: data.options?.badge || "/images/logo.png",
          data: {
            ...(data.options?.data || {}),
            url: data.options?.data?.id
              ? `/#/story/${data.options.data.id}`
              : "/#/",
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
      console.error("Invalid push payload:", error);
    }
  }

  event.waitUntil(self.registration.showNotification(payload.title, payload.options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url ||
    (event.notification.data?.id ? `/#/story/${event.notification.data.id}` : "/#/");

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
