
import {
  Sunrise,
  Coffee,
  Apple,
  Salad,
  Pizza,
  Sandwich,
  Soup,
  Moon,
  LucideIcon
} from 'lucide-react';
import { MealTime } from '@/types/meal';

export const getMealTimeIcon = (mealTime: MealTime): LucideIcon => {
  switch (mealTime) {
    case 'morning':
      return Sunrise;
    case 'breakfast':
      return Coffee;
    case 'midMorning':
      return Apple;
    case 'lunch':
      return Salad;
    case 'evening':
      return Sandwich;
    case 'dinner':
      return Pizza;
    case 'beforeBed':
      return Moon;
    default:
      return Soup;
  }
};

export const getMealItemIcon = (name: string): LucideIcon => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('milk') || lowerName.includes('shake'))
    return Coffee;
  if (lowerName.includes('fruit') || lowerName.includes('banana') || lowerName.includes('apple'))
    return Apple;
  if (lowerName.includes('salad') || lowerName.includes('vegetable'))
    return Salad;
  if (lowerName.includes('paratha') || lowerName.includes('sandwich') || lowerName.includes('bread'))
    return Sandwich;
  if (lowerName.includes('curry') || lowerName.includes('soup') || lowerName.includes('dal'))
    return Soup;
  
  // Default
  return Salad;
};
