const CACHE_NAME = 'fitness-tracker-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/db-config.js',
  '/js/db-service.js',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For API requests, always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response - one to return, one to cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle offline sync for workout data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

// Function to sync workouts when back online
async function syncWorkouts() {
  // This would be implemented to sync localStorage data with PostgreSQL
  // when the user comes back online
  console.log('Syncing workouts with PostgreSQL server');
  
  try {
    // Get the pending workouts from localStorage
    const pendingWorkouts = JSON.parse(localStorage.getItem('pendingWorkouts') || '[]');
    
    if (pendingWorkouts.length === 0) {
      return;
    }
    
    console.log(`Found ${pendingWorkouts.length} pending workouts to sync`);
    
    // In a real implementation, this would make API calls to sync the workouts
    // For now, we'll just log the sync attempt
    console.log('Workout sync would happen here');
  } catch (error) {
    console.error('Error syncing workouts:', error);
  }
}
