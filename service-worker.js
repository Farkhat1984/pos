// Service Worker for POS Web App

// Cache name and files to cache
const CACHE_NAME = 'pos-web-app-v1';
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
  '/assets/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/zxing-js/0.18.6/zxing.min.js'
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
  // Skip for API requests that shouldn't be cached
  if (event.request.url.includes('/auth/') || 
      event.request.url.includes('/products/')) {
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
            // You can return a custom offline page here
          });
      })
  );
});

// Handle push notifications
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

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if a window is already open
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});