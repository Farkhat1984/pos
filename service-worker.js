// Service Worker for POS Web App

// Cache name and files to cache
const CACHE_NAME = 'pos-web-app-v3'; // версия обновлена
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/main.html',
  '/pages/scan-invoice.html',
  '/pages/inventory.html',
  '/pages/product-create.html',
  '/pages/product-edit.html',
  '/pages/invoice-history.html',
  '/pages/analytics.html',
  '/css/theme.css',
  '/css/components.css',
  '/css/styles.css',
  '/js/app.js',
  '/js/api-client.js',
  '/js/auth.js',
  '/js/database.js',
  '/js/barcode-scanner.js',
  '/js/ui-controller.js',
  '/assets/logo.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Получаем базовый путь запроса без параметров
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Skip for API requests and external domains
  if (path.includes('/auth/') ||
    path.includes('/products/') ||
    !url.origin.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);

            // Возвращаем соответствующий ответ с правильной кодировкой
            if (event.request.destination === 'image') {
              // Для изображений возвращаем простой SVG
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2196F3"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="#FFFFFF" text-anchor="middle" dy=".3em">Офлайн</text></svg>',
                {
                  headers: { 'Content-Type': 'image/svg+xml; charset=UTF-8' }
                }
              );
            } else if (event.request.destination === 'document' ||
              event.request.destination === 'iframe' ||
              path.endsWith('.html')) {
              // Для HTML-страниц возвращаем страницу офлайн с корректной кодировкой
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Офлайн режим</title>
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      padding: 20px; 
                      text-align: center; 
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                    }
                    h1 { color: #2196F3; }
                    .btn {
                      background: #2196F3;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      margin-top: 20px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 16px;
                    }
                  </style>
                </head>
                <body>
                  <h1>Приложение работает в режиме офлайн</h1>
                  <p>Для правильной работы этой страницы необходимо подключение к интернету.</p>
                  <p>Пожалуйста, проверьте ваше интернет-соединение и повторите попытку.</p>
                  <button class="btn" onclick="window.location.reload()">Обновить страницу</button>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html; charset=UTF-8' }
                }
              );
            } else if (event.request.destination === 'script') {
              // Для скриптов возвращаем пустой скрипт
              return new Response(
                'console.log("Приложение работает в офлайн-режиме");',
                {
                  headers: { 'Content-Type': 'application/javascript; charset=UTF-8' }
                }
              );
            } else if (event.request.destination === 'style') {
              // Для CSS возвращаем минимальные стили
              return new Response(
                'body { font-family: Arial, sans-serif; }',
                {
                  headers: { 'Content-Type': 'text/css; charset=UTF-8' }
                }
              );
            } else {
              // Для всех остальных запросов возвращаем пустой ответ с кодом состояния
              return new Response('Офлайн режим', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
              });
            }
          });
      })
  );
});

// Остальной код без изменений
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'POS Web App', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});