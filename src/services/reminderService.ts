
import { MealReminder } from "@/types/reminder";
import { availableSounds, playSound, stopSound } from "@/utils/sounds";
import { MealPlan, MealTime } from "@/types/meal";

// Local storage key
const REMINDERS_KEY = 'veggie-gain-reminders';
// Helper function to generate ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get all reminders
export const getReminders = (): MealReminder[] => {
  const remindersJson = localStorage.getItem(REMINDERS_KEY);
  return remindersJson ? JSON.parse(remindersJson) : [];
};

// Save a reminder
export const saveReminder = (reminder: Omit<MealReminder, 'id'>): MealReminder => {
  const reminders = getReminders();
  const newReminder = {
    ...reminder,
    id: generateId(),
  };
  
  reminders.push(newReminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  
  // Reschedule notifications immediately after saving
  setTimeout(() => scheduleNotifications(), 100);
  return newReminder;
};

// Update a reminder
export const updateReminder = (reminder: MealReminder): boolean => {
  const reminders = getReminders();
  const index = reminders.findIndex(r => r.id === reminder.id);
  
  if (index === -1) return false;
  
  reminders[index] = reminder;
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  
  // Reschedule notifications immediately after updating
  setTimeout(() => scheduleNotifications(), 100);
  return true;
};

// Delete a reminder
export const deleteReminder = (id: string): boolean => {
  const reminders = getReminders();
  const filteredReminders = reminders.filter(reminder => reminder.id !== id);
  
  if (filteredReminders.length === reminders.length) return false;
  
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(filteredReminders));
  
  // Reschedule notifications after deletion
  setTimeout(() => scheduleNotifications(), 100);
  return true;
};

// Default meal time schedules
export const defaultMealTimeSchedules: Record<MealTime, { time: string, label: string }> = {
  morning: { time: '07:00', label: 'Morning' },
  breakfast: { time: '08:00', label: 'Breakfast' },
  midMorning: { time: '11:00', label: 'Mid-Morning Snack' },
  lunch: { time: '13:00', label: 'Lunch' },
  evening: { time: '16:00', label: 'Evening Snack' },
  dinner: { time: '20:00', label: 'Dinner' },
  beforeBed: { time: '22:00', label: 'Before Bed' }
};

// Meal time to display name mapping
export const mealTimeLabels: Record<MealTime, string> = {
  morning: 'Morning',
  breakfast: 'Breakfast',
  midMorning: 'Mid-Morning Snack',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner',
  beforeBed: 'Before Bed'
};

// Generate reminders based on meal plan with custom time scheduling
export const generateRemindersFromMealPlan = (mealPlan: MealPlan): void => {
  const existingReminders = getReminders();
  let changed = false;
  
  // Check each meal time in the plan
  Object.entries(mealPlan.meals).forEach(([mealTime, meals]) => {
    if (meals.length === 0) return; // Skip empty meal times
    
    const mealTimeKey = mealTime as MealTime;
    // Check if a reminder already exists for this meal time
    const existingReminder = existingReminders.find(r => r.mealTime === mealTimeKey);
    
    // Get the scheduled time for this meal (use custom time from mealPlan if available)
    const mealTimeSchedule = mealPlan.mealTimeSchedule?.[mealTimeKey] || 
                            defaultMealTimeSchedules[mealTimeKey];
    
    if (!existingReminder) {
      // Create a new reminder for this meal time
      const newReminder: Omit<MealReminder, 'id'> = {
        mealTime: mealTimeKey,
        reminderTime: mealTimeSchedule.time,
        enabled: true,
        label: `${mealTimeSchedule.label} Time`,
        soundId: 'default'
      };
      
      saveReminder(newReminder);
      changed = true;
    } else if (existingReminder.reminderTime !== mealTimeSchedule.time) {
      // Update the reminder time to match the new meal time schedule
      updateReminder({
        ...existingReminder,
        reminderTime: mealTimeSchedule.time
      });
      changed = true;
    }
  });
  
  if (changed) {
    // Reschedule all notifications if we added any new reminders
    scheduleNotifications();
  }
};

// Initialize default reminders if none exist
export const initializeDefaultReminders = (): void => {
  if (getReminders().length === 0) {
    const defaultReminders: Omit<MealReminder, 'id'>[] = [
      { mealTime: 'breakfast', reminderTime: '08:00', enabled: true, label: 'Breakfast Time', soundId: 'default' },
      { mealTime: 'lunch', reminderTime: '13:00', enabled: true, label: 'Lunch Time', soundId: 'gentle' },
      { mealTime: 'dinner', reminderTime: '20:00', enabled: true, label: 'Dinner Time', soundId: 'kitchen' },
    ];
    
    defaultReminders.forEach(reminder => saveReminder(reminder));
  }
};

// Track active notification timeouts
let activeTimeouts: number[] = [];

// Schedule notifications with proper sound playback and wake lock support
export const scheduleNotifications = async (): Promise<void> => {
  try {
    // Clear any existing timeouts
    activeTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
    activeTimeouts = [];
    
    const reminders = getReminders().filter(r => r.enabled);
    
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Request notification permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }
    }

    // Register service worker for offline support
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      await navigator.serviceWorker.ready;
      
      // Store reminders in IndexedDB for offline access
      const db = await openDatabase();
      const transaction = db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      
      // Clear existing reminders
      await store.clear();
      
      // Store each reminder
      for (const reminder of reminders) {
        await store.add(reminder);
      }
      
      // Register periodic sync if available
      if ('periodicSync' in registration) {
        try {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName
          });
          
          if (status.state === 'granted') {
            await registration.periodicSync.register('reminders-sync', {
              minInterval: 60 * 60 * 1000 // Sync every hour
            });
          }
        } catch (err) {
          console.warn('Periodic sync not available:', err);
          // Fallback to regular sync
          if ('sync' in registration) {
            await registration.sync.register('reminders-sync');
          }
        }
      }
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  } catch (error) {
    console.error('Error in scheduleNotifications:', error);
    setTimeout(() => scheduleNotifications(), 5000);
  }
};

// Helper function to open IndexedDB with improved error handling and schema versioning
const openDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('veggie-reminders', 2); // Increment version for schema updates
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      
      // Add error handler for database-level errors
      db.onerror = (event) => {
        console.error('Database error:', (event.target as IDBDatabase).onerror);
      };
      
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Handle schema updates
      if (!db.objectStoreNames.contains('reminders')) {
        const store = db.createObjectStore('reminders', { keyPath: 'id' });
        
        // Add indexes for better query performance
        store.createIndex('mealTime', 'mealTime', { unique: false });
        store.createIndex('enabled', 'enabled', { unique: false });
        store.createIndex('reminderTime', 'reminderTime', { unique: false });
      }
      
      // Add new object store for failed notifications
      if (!db.objectStoreNames.contains('failed_notifications')) {
        db.createObjectStore('failed_notifications', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onblocked = () => {
      console.warn('Database upgrade blocked. Please close other tabs using the app.');
    };
  });
};

// Function to test sound immediately
export const testReminderSound = (soundId: string): void => {
  stopSound(); // Stop any currently playing sound
  const sound = availableSounds.find(s => s.id === soundId);
  if (sound) {
    // Only play for 5 seconds during preview (not the full 30 seconds)
    playSound(sound.url, 5);
  }
};

// Helper function to convert 24h time string to Date object
export const timeStringToDate = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper function to format Date as HH:MM
export const formatTimeString = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Adjust reminder time by minutes
export const adjustReminderTime = (timeString: string, minutesToAdd: number): string => {
  const date = timeStringToDate(timeString);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return formatTimeString(date);
};
