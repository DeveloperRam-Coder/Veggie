
export interface MealReminder {
  id: string;
  mealTime: string;
  reminderTime: string; // Time in HH:MM format
  enabled: boolean;
  label: string;
  snoozeInterval?: number; // Minutes
  snoozed?: boolean;
  soundId?: string; // ID of the selected sound
  customSound?: {
    name: string;
    url: string;
  };
  // New timing options
  advanceWarning?: number; // Minutes before meal time
  repeat?: boolean; // Whether to repeat reminder
  repeatInterval?: number; // Minutes between repeats
  maxRepeats?: number; // Maximum number of repeats
}

export type ReminderTimeAdjustment = -30 | -15 | -5 | 0 | 5 | 15 | 30;

export interface ReminderSetting {
  id: string;
  key: string;
  value: string | number | boolean;
}
