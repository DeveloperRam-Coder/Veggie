
import { Utensils, Dumbbell } from 'lucide-react';
import NutritionCard from '@/components/NutritionCard';
import { useTheme } from '@/providers/ThemeProvider';

interface NutritionSummaryCardsProps {
  calories: number;
  protein: number;
  targetCalories?: number;
  targetProtein?: number;
  className?: string;
}

const NutritionSummaryCards = ({
  calories,
  protein,
  targetCalories = 3000,
  targetProtein = 100,
  className
}: NutritionSummaryCardsProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 ${className}`}>
      <NutritionCard
        title="Daily Calories"
        value={calories}
        target={targetCalories}
        unit="kcal"
        icon={<Utensils size={16} className="text-white" />}
        colorClass={isDark ? "bg-orange-500/80" : "bg-orange-500"}
      />
      
      <NutritionCard
        title="Daily Protein"
        value={protein}
        target={targetProtein}
        unit="g"
        icon={<Dumbbell size={16} className="text-white" />}
        colorClass={isDark ? "bg-emerald-500/80" : "bg-emerald-500"}
      />
    </div>
  );
};

export default NutritionSummaryCards;
