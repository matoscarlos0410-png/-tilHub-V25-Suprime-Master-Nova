/* =========================================================
   ÚTILHUB V25
   SERVICE WORKER — NOVA FLOW
   ========================================================= */

const CACHE_NAME = "utilhub-v25-nova-flow-v1";

const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest"
];

/* =========================================================
   INSTALACIÓN
   ========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("ÚtilHub V25: error durante instalación:", error);
      })
  );
});

/* =========================================================
   ACTIVACIÓN
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName.startsWith("utilhub-")
            ) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        );
      })
      .then(() => self.clients.claim())
      .catch((error) => {
        console.error("ÚtilHub V25: error durante activación:", error);
      })
  );
});

/* =========================================================
   PETICIONES
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  /* Solo GET */
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* No interferir con APIs externas */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * NAVEGACIÓN:
   * Primero intenta Internet.
   * Si falla, utiliza index.html guardado.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put("./index.html", copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match("./index.html");
        })
    );

    return;
  }

  /*
   * ARCHIVOS LOCALES:
   * Primero busca en caché.
   * Si no existe, intenta descargarlos.
   */
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (
              response &&
              response.ok &&
              response.type === "basic"
            ) {
              const copy = response.clone();

              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }

            return response;
          });
      })
      .catch(() => {
        /*
         * Si falla una petición de recurso,
         * simplemente dejamos que el navegador
         * maneje el error.
         */
        return Response.error();
      })
  );
});

/* =========================================================
   MENSAJES DESDE ÚTILHUB
   ========================================================= */

self.addEventListener("message", (event) => {
  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

/* =========================================================
   CONTROL DE ERRORES
   ========================================================= */

self.addEventListener("error", (event) => {
  console.error(
    "ÚtilHub V25 Service Worker:",
    event.error || event.message
  );
});

self.addEventListener("unhandledrejection", (event) => {
  console.error(
    "ÚtilHub V25 Service Worker Promise:",
    event.reason
  );
});
