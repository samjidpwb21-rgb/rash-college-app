// ============================================================================
// SERVICE WORKER FOR WEB PUSH NOTIFICATIONS
// ============================================================================
// Handles push events from the server when app is closed or tab is inactive
// Displays OS-level notifications and handles clicks

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push received:', event);

    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
            url: '/'
        }
    };

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            console.error('[Service Worker] Error parsing push data:', e);
        }
    }

    const options = {
        body: notificationData.body || notificationData.message,
        icon: notificationData.icon || '/icon-192.png',
        badge: notificationData.badge || '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: notificationData.link || notificationData.data?.url || '/',
            notificationId: notificationData.id
        },
        actions: [
            {
                action: 'open',
                title: 'View'
            },
            {
                action: 'close',
                title: 'Dismiss'
            }
        ],
        requireInteraction: false,
        tag: notificationData.type || 'notification'
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Default action: open the link
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (windowClients) {
                // Check if there's already a window/tab open
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Service worker activation with cache cleanup
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activated');
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((keys) =>
                Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                )
            ),
        ])
    );
});

// ============================================================================
// PWA CACHING STRATEGY (Added for installable PWA)
// ============================================================================

const CACHE_NAME = 'rash-college-pwa-v1';
const STATIC_ASSETS = [
    '/',
    '/login',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Service worker installation with static asset caching
self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installed');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.error('[Service Worker] Cache addAll error:', err);
            });
        })
    );
    self.skipWaiting();
});

// ============================================================================
// NETWORK-FIRST FETCH STRATEGY (Progressive Enhancement)
// ============================================================================
// Network-first fetch strategy for graceful offline support
self.addEventListener('fetch', function (event) {
    // Skip non-GET requests and API calls (preserve existing backend behavior)
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/api/')) return;
    if (event.request.url.includes('/auth/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache on network failure (offline mode)
                return caches.match(event.request);
            })
    );
});

