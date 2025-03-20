
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/providers/ThemeProvider';
import { ChartContainer } from './ui/chart';
import { Utensils, Dumbbell } from 'lucide-react';

interface NutritionSummaryProps {
  calories: number;
  protein: number;
  targetCalories?: number;
  targetProtein?: number;
}

const NutritionSummary = ({ 
  calories, 
  protein, 
  targetCalories = 3000, 
  targetProtein = 100 
}: NutritionSummaryProps) => {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const caloriePercentage = Math.min(Math.floor((calories / targetCalories) * 100), 100);
  const proteinPercentage = Math.min(Math.floor((protein / targetProtein) * 100), 100);
  
  const chartData = [
    { 
      name: 'Calories', 
      value: calories, 
      target: targetCalories, 
      percentage: caloriePercentage,
      color: isDark ? '#F59E0B80' : '#F59E0B'
    },
    { 
      name: 'Protein', 
      value: protein, 
      target: targetProtein, 
      percentage: proteinPercentage,
      color: isDark ? '#10B98180' : '#10B981'
    }
  ];
  
  const chartConfig = {
    calories: {
      label: 'Calories',
      theme: {
        light: '#F59E0B',
        dark: '#F59E0B80',
      },
    },
    protein: {
      label: 'Protein',
      theme: {
        light: '#10B981',
        dark: '#10B98180',
      },
    },
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Daily Nutrition Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-orange-500" />
                <span className="text-sm font-medium">Calories</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{calories} / {targetCalories} kcal</span>
            </div>
            <Progress value={caloriePercentage} className="h-2.5 bg-orange-100 dark:bg-orange-950" 
              style={{ "--progress-background": isDark ? "rgb(249, 115, 22, 0.7)" : "rgb(249, 115, 22)" } as React.CSSProperties} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-emerald-500" />
                <span className="text-sm font-medium">Protein</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{protein}g / {targetProtein}g</span>
            </div>
            <Progress value={proteinPercentage} className="h-2.5 bg-green-100 dark:bg-green-950" 
              style={{ "--progress-background": isDark ? "rgb(16, 185, 129, 0.7)" : "rgb(16, 185, 129)" } as React.CSSProperties} />
          </div>

          {!isMobile && (
            <div className="mt-6 h-[180px]">
              <ChartContainer
                config={chartConfig}
                className="p-4 mt-2 h-[180px] rounded-lg"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <XAxis 
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis
                      hide={true}
                      domain={[0, 'dataMax']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border/50 rounded-lg p-2 text-xs shadow-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-muted-foreground">
                                {data.value} / {data.target} {data.name === 'Calories' ? 'kcal' : 'g'}
                              </p>
                              <p className="text-foreground">{data.percentage}% of target</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]} 
                      barSize={50}
                      minPointSize={2}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="dark:opacity-80"
                        />
                      ))}
                      <LabelList 
                        dataKey="percentage" 
                        position="top" 
                        fill={isDark ? "#d1d5db" : "#4b5563"} 
                        formatter={(value: any) => `${value}%`}
                        className="text-xs font-medium"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionSummary;
