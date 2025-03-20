import { MealPlan, MealItem, MealTime, MealTimeSchedule } from '../types/meal';
import { defaultMealTimeSchedules } from './reminderService';

// LocalStorage keys
const MEAL_PLANS_KEY = 'veggie-gain-meal-plans';
const MEAL_ITEMS_KEY = 'veggie-gain-meal-items';

// Helper function to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get all meal plans from localStorage
export const getMealPlans = (): MealPlan[] => {
  const plansJson = localStorage.getItem(MEAL_PLANS_KEY);
  return plansJson ? JSON.parse(plansJson) : [];
};

// Get a single meal plan by ID
export const getMealPlanById = (id: string): MealPlan | undefined => {
  const plans = getMealPlans();
  return plans.find(plan => plan.id === id);
};

// Save a meal plan
export const saveMealPlan = (plan: Omit<MealPlan, 'id'>): MealPlan => {
  const plans = getMealPlans();
  const newPlan = {
    ...plan,
    id: generateId(),
  };
  
  plans.push(newPlan);
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans));
  return newPlan;
};

// Update an existing meal plan
export const updateMealPlan = (plan: MealPlan): boolean => {
  const plans = getMealPlans();
  const index = plans.findIndex(p => p.id === plan.id);
  
  if (index === -1) return false;
  
  plans[index] = plan;
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans));
  return true;
};

// Delete a meal plan
export const deleteMealPlan = (id: string): boolean => {
  const plans = getMealPlans();
  const filteredPlans = plans.filter(plan => plan.id !== id);
  
  if (filteredPlans.length === plans.length) return false;
  
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(filteredPlans));
  return true;
};

// Get all meal items
export const getMealItems = (): MealItem[] => {
  const itemsJson = localStorage.getItem(MEAL_ITEMS_KEY);
  return itemsJson ? JSON.parse(itemsJson) : [];
};

// Save a meal item
export const saveMealItem = (item: Omit<MealItem, 'id'>): MealItem => {
  const items = getMealItems();
  const newItem = {
    ...item,
    id: generateId(),
  };
  
  items.push(newItem);
  localStorage.setItem(MEAL_ITEMS_KEY, JSON.stringify(items));
  return newItem;
};

// Update a meal item
export const updateMealItem = (item: MealItem): boolean => {
  const items = getMealItems();
  const index = items.findIndex(i => i.id === item.id);
  
  if (index === -1) return false;
  
  items[index] = item;
  localStorage.setItem(MEAL_ITEMS_KEY, JSON.stringify(items));
  return true;
};

// Delete a meal item
export const deleteMealItem = (id: string): boolean => {
  const items = getMealItems();
  const filteredItems = items.filter(item => item.id !== id);
  
  if (filteredItems.length === items.length) return false;
  
  localStorage.setItem(MEAL_ITEMS_KEY, JSON.stringify(filteredItems));
  return true;
};

// Generate an empty meal plan for a given date
export const createEmptyMealPlan = (date: string): MealPlan => {
  // Create a meal plan with default time schedules
  const mealTimeSchedule: Record<MealTime, MealTimeSchedule> = {} as Record<MealTime, MealTimeSchedule>;
  
  // Initialize with default times
  Object.entries(defaultMealTimeSchedules).forEach(([key, value]) => {
    mealTimeSchedule[key as MealTime] = {
      time: value.time,
      label: value.label
    };
  });
  
  return {
    id: generateId(),
    date,
    mealTimeSchedule,
    meals: {
      morning: [],
      breakfast: [],
      midMorning: [],
      lunch: [],
      evening: [],
      dinner: [],
      beforeBed: []
    }
  };
};

// Add a meal item to a specific meal time in a plan
export const addMealToTimeSlot = (
  plan: MealPlan,
  mealTime: MealTime,
  mealItem: MealItem
): MealPlan => {
  const updatedPlan = { ...plan };
  updatedPlan.meals[mealTime] = [...updatedPlan.meals[mealTime], mealItem];
  return updatedPlan;
};

// Remove a meal item from a specific meal time in a plan
export const removeMealFromTimeSlot = (
  plan: MealPlan,
  mealTime: MealTime,
  mealItemId: string
): MealPlan => {
  const updatedPlan = { ...plan };
  updatedPlan.meals[mealTime] = updatedPlan.meals[mealTime].filter(
    item => item.id !== mealItemId
  );
  return updatedPlan;
};

// Update meal time schedule
export const updateMealTimeSchedule = (
  plan: MealPlan,
  mealTime: MealTime,
  schedule: MealTimeSchedule
): MealPlan => {
  const updatedPlan = { ...plan };
  
  // Ensure mealTimeSchedule exists
  if (!updatedPlan.mealTimeSchedule) {
    updatedPlan.mealTimeSchedule = {} as Record<MealTime, MealTimeSchedule>;
    
    // Initialize with defaults if creating for the first time
    Object.entries(defaultMealTimeSchedules).forEach(([key, value]) => {
      updatedPlan.mealTimeSchedule[key as MealTime] = {
        time: value.time,
        label: value.label
      };
    });
  }
  
  // Update the specific meal time schedule
  updatedPlan.mealTimeSchedule[mealTime] = schedule;
  return updatedPlan;
};

// Get today's meal plan or create a new one if it doesn't exist
export const getTodaysMealPlan = (): MealPlan => {
  const today = new Date().toISOString().split('T')[0];
  const plans = getMealPlans();
  const todayPlan = plans.find(plan => plan.date === today);
  
  if (todayPlan) return todayPlan;
  
  // Create and save a new plan for today
  const newPlan = createEmptyMealPlan(today);
  const plans2 = [...plans, newPlan];
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans2));
  return newPlan;
};

// Initialize with sample data if nothing exists
export const initializeSampleData = (forceReinit?: boolean): void => {
  // Only initialize if no data exists or if forceReinit is true
  if (forceReinit || (getMealPlans().length === 0 && getMealItems().length === 0)) {
    // Sample meal items
    const sampleItems: Omit<MealItem, 'id'>[] = [
      { name: 'Glass of Milk', description: 'Full-fat milk', calories: 150, protein: 8 },
      { name: 'Soaked Almonds', description: '10-12 almonds', calories: 80, protein: 3 },
      { name: 'Banana', description: '1 medium banana', calories: 105, protein: 1.3 },
      { name: 'Stuffed Paratha', description: 'With paneer filling', calories: 250, protein: 8 },
      { name: 'Bowl of Curd', description: '1 cup yogurt', calories: 150, protein: 8 },
      { name: 'Mixed Nuts', description: 'Almonds, walnuts, cashews', calories: 170, protein: 6 },
      { name: 'Fresh Fruit Juice', description: '1 glass mango juice', calories: 130, protein: 1 },
      { name: 'Rice with Dal', description: '1 bowl each', calories: 350, protein: 10 },
      { name: 'Chapati with Ghee', description: '1 chapati', calories: 120, protein: 3 },
      { name: 'Vegetable Curry', description: 'Mixed vegetables', calories: 150, protein: 5 },
      { name: 'Poha with Peanuts', description: '1 bowl', calories: 280, protein: 8 },
      { name: 'Banana Shake', description: 'With full-fat milk', calories: 200, protein: 5 },
      { name: 'Paneer Curry', description: '1 bowl', calories: 300, protein: 15 },
      { name: 'Bowl of Salad', description: 'Fresh vegetables', calories: 50, protein: 2 },
      { name: 'Warm Milk', description: '1 glass before bed', calories: 150, protein: 8 },
      { name: 'Dates', description: '1-2 dates', calories: 60, protein: 0.5 }
    ];
    
    // Save sample items
    sampleItems.forEach(item => saveMealItem(item));
    
    // Create sample meal plan for today
    const today = new Date().toISOString().split('T')[0];
    const samplePlan = createEmptyMealPlan(today);
    
    // Get saved items with IDs
    const savedItems = getMealItems();
    
    // Add items to meal plan
    if (savedItems.length >= 16) {
      samplePlan.meals.morning = [savedItems[0], savedItems[1], savedItems[2]];
      samplePlan.meals.breakfast = [savedItems[3], savedItems[4]];
      samplePlan.meals.midMorning = [savedItems[5], savedItems[6]];
      samplePlan.meals.lunch = [savedItems[7], savedItems[8], savedItems[9]];
      samplePlan.meals.evening = [savedItems[10], savedItems[11]];
      samplePlan.meals.dinner = [savedItems[12], savedItems[8], savedItems[13]];
      samplePlan.meals.beforeBed = [savedItems[14], savedItems[15]];
      
      // Save the sample plan
      const plans = [samplePlan];
      localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans));
    }
  }
};
