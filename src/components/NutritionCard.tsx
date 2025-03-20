
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NutritionCardProps {
  title: string;
  value: number;
  target: number;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
  className?: string;
}

const NutritionCard = ({
  title,
  value,
  target,
  unit,
  icon,
  colorClass,
  className
}: NutritionCardProps) => {
  const percentage = Math.min(Math.floor((value / target) * 100), 100);
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={cn("p-2 rounded-md mr-2", colorClass)}>
              {icon}
            </div>
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <span className="text-sm font-bold">
            {percentage}%
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
            <div 
              className={cn("h-2.5 rounded-full", colorClass)}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{value} {unit}</span>
            <span>{target} {unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionCard;
