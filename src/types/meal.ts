
export type MealTime = 'morning' | 'breakfast' | 'midMorning' | 'lunch' | 'evening' | 'dinner' | 'beforeBed';

export interface MealItem {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
}

export interface MealTimeSchedule {
  time: string; // In HH:MM format
  label: string;
}

export interface MealPlan {
  id: string;
  date: string;
  mealTimeSchedule: Record<MealTime, MealTimeSchedule>;
  meals: Record<MealTime, MealItem[]>;
}

// Default meal time labels for reference
export const DEFAULT_MEAL_TIME_LABELS: Record<MealTime, string> = {
  morning: 'Morning Snack',
  breakfast: 'Breakfast',
  midMorning: 'Mid-Morning Snack',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner',
  beforeBed: 'Before Bed Snack'
};
