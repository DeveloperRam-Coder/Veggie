
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

// Schedule notifications with proper sound playback
export const scheduleNotifications = (): void => {
  // Clear any existing timeouts
  activeTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
  activeTimeouts = [];
  
  const reminders = getReminders().filter(r => r.enabled);
  
  if (Notification && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  
  // Schedule new notifications
  reminders.forEach(reminder => {
    const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    console.log(`Scheduling reminder for ${reminder.label} at ${reminderTime.toLocaleString()}, which is in ${Math.round(timeUntilReminder/60000)} minutes`);
    
    const timeoutId = window.setTimeout(() => {
      // Stop any currently playing sound first
      stopSound();
      
      // Find the sound and play for the full duration (default 30 seconds)
      const sound = availableSounds.find(s => s.id === reminder.soundId);
      if (sound) {
        console.log(`Playing sound for ${reminder.label} for ${sound.duration || 30} seconds`);
        playSound(sound.url, sound.duration || 30);
      }
      
      if (Notification.permission === "granted") {
        new Notification(`Time for ${reminder.label}`, {
          body: `It's ${reminder.reminderTime}. Time for your ${reminder.label.toLowerCase()}.`,
          icon: '/favicon.ico',
          silent: true // We'll handle the sound manually to ensure it plays
        });
      }
      
      // Reschedule this notification for tomorrow
      scheduleNotifications();
    }, timeUntilReminder);
    
    activeTimeouts.push(timeoutId);
  });
  
  // For debugging purposes
  console.log(`Scheduled ${reminders.length} reminders. Next check at ${new Date(Date.now() + 60000).toLocaleTimeString()}`);
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
