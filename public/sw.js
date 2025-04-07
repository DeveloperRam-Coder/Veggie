const CACHE_NAME = 'veggie-cache-v1';
const DB_NAME = 'veggie-reminders';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico.png',
  '/placeholder.svg'
];

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Get reminders from IndexedDB
const getReminders = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Schedule a notification
const scheduleNotification = async (reminder) => {
  try {
    const now = new Date();
    const reminderTime = new Date();
    const [hours, minutes] = reminder.reminderTime.split(':');
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    // Use setTimeout with a wake lock for more reliable scheduling
    const scheduleWithWakeLock = async () => {
      try {
        // Attempt to acquire a wake lock if available
        let wakeLock = null;
        if ('wakeLock' in navigator) {
          try {
            wakeLock = await navigator.wakeLock.request('screen');
          } catch (err) {
            console.warn('Wake Lock error:', err);
          }
        }

        await self.registration.showNotification(
          `Time for ${reminder.label}`,
          {
            body: `It's ${reminder.reminderTime}. Time for your ${reminder.label.toLowerCase()}.`,
            icon: '/favicon.ico.png',
            badge: '/icon-192x192.png',
            tag: reminder.id,
            data: reminder,
            requireInteraction: true,
            renotify: true
          }
        );

        // Release wake lock after showing notification
        if (wakeLock) {
          await wakeLock.release();
        }
      } catch (error) {
        console.error('Error showing notification:', error);
        // Retry after a short delay if there's an error
        setTimeout(() => scheduleWithWakeLock(), 5000);
      }
    };

    setTimeout(scheduleWithWakeLock, timeUntilReminder);

    // Schedule advance warning if enabled
    if (reminder.advanceWarning) {
      const advanceTime = timeUntilReminder - (reminder.advanceWarning * 60 * 1000);
      if (advanceTime > 0) {
        setTimeout(async () => {
          try {
            await self.registration.showNotification(
              `Upcoming: ${reminder.label}`,
              {
                body: `${reminder.label} is coming up in ${reminder.advanceWarning} minutes.`,
                icon: '/favicon.ico.png',
                badge: '/icon-192x192.png',
                tag: `${reminder.id}-advance`,
                data: { ...reminder, isAdvanceWarning: true },
                requireInteraction: true
              }
            );
          } catch (error) {
            console.error('Error showing advance warning:', error);
          }
        }, advanceTime);
      }
    }
  } catch (error) {
    console.error('Error in scheduleNotification:', error);
  }
};

// Schedule all notifications
const scheduleAllNotifications = async () => {
  try {
    const reminders = await getReminders();
    reminders.forEach(reminder => {
      if (reminder.enabled) {
        scheduleNotification(reminder);
      }
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(syncReminders());
  }
});

// Handle periodic sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(syncReminders());
  }
});

// Sync reminders function
const syncReminders = async () => {
  try {
    const db = await openDB();
    const reminders = await getReminders();
    
    // Re-schedule all active reminders
    reminders.forEach((reminder) => {
      if (reminder.enabled) {
        scheduleNotification(reminder);
      }
    });
    
    // Process any failed notifications
    const failedNotifications = await getFailedNotifications();
    for (const failed of failedNotifications) {
      await scheduleNotification(failed.reminder);
    }
    
    // Clear processed failed notifications
    await clearFailedNotifications();
    
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'default',
      data: data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const reminder = event.notification.data;
  
  // Play sound if available
  if (reminder.soundId) {
    const context = new AudioContext();
    fetch(`/sounds/${reminder.soundId}.mp3`)
      .then(response => response.arrayBuffer())
      .then(buffer => context.decodeAudioData(buffer))
      .then(audioBuffer => {
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        source.start(0);
      })
      .catch(error => console.error('Error playing sound:', error));
  }
});

// Handle periodic sync
self.addEventListener('periodicsync', async (event) => {
  if (event.tag === 'reminders-sync') {
    try {
      const reminders = await getReminders();
      reminders.forEach(reminder => {
        if (reminder.enabled) {
          scheduleNotification(reminder);
        }
      });
    } catch (error) {
      console.error('Error in periodic sync:', error);
    }
  }
});

// Handle background sync fallback
self.addEventListener('sync', async (event) => {
  if (event.tag === 'reminders-sync') {
    try {
      const reminders = await getReminders();
      reminders.forEach(reminder => {
        if (reminder.enabled) {
          scheduleNotification(reminder);
        }
      });
    } catch (error) {
      console.error('Error in background sync:', error);
    }
  }
});

// Focus on existing window or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus on existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(scheduleAllNotifications());
  }
});

// Periodically check and reschedule notifications
setInterval(scheduleAllNotifications, 1000 * 60 * 60); // Check every hour

// Handle periodic sync for more reliable background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(scheduleAllNotifications());
  }
});

// Re-schedule notifications when service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      (async () => {
        try {
          // Register periodic sync with error handling
          if ('periodicSync' in self.registration) {
            const status = await navigator.permissions.query({
              name: 'periodic-background-sync'
            });
            
            if (status.state === 'granted') {
              await self.registration.periodicSync.register('reminders-sync', {
                minInterval: 60 * 60 * 1000 // Sync every hour
              });
              console.log('Periodic sync registered successfully');
            }
          }
          
          // Initial scheduling of notifications
          await scheduleAllNotifications();
        } catch (error) {
          console.error('Error in activate event:', error);
        }
      })()
    ])
  );
});

// Enhanced error handling for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(
      (async () => {
        try {
          await scheduleAllNotifications();
          console.log('Background sync completed successfully');
        } catch (error) {
          console.error('Error in background sync:', error);
          throw error; // Retry sync later
        }
      })()
    );
  }
});

// Periodically check and reschedule notifications
setInterval(scheduleAllNotifications, 1000 * 60 * 60); // Check every hour

// Handle periodic sync for more reliable background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminders-sync') {
    event.waitUntil(scheduleAllNotifications());
  }
});

// Re-schedule notifications when service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      scheduleAllNotifications()
    ])
  );
});