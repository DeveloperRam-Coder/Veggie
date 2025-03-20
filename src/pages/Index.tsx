import { useState, useEffect } from 'react';
import { MealItem, MealPlan, MealTime, MealTimeSchedule, DEFAULT_MEAL_TIME_LABELS } from '../types/meal';
import { 
  getTodaysMealPlan, 
  updateMealPlan, 
  initializeSampleData,
  addMealToTimeSlot,
  removeMealFromTimeSlot,
  updateMealTimeSchedule
} from '../services/mealPlannerService';
import MealTimeSection from '../components/MealTimeSection';
import MealItemDialog from '../components/MealItemDialog';
import NutritionSummaryCards from '../components/NutritionSummaryCards';
import MealSuggestions from '../components/MealSuggestions';
import RemindersSection from '../components/RemindersSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  UtensilsCrossed, 
  Calendar, 
  Plus, 
  Save, 
  RefreshCw, 
  Filter, 
  Bell,
  Download,
  Settings
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { 
  scheduleNotifications,
  generateRemindersFromMealPlan,
  mealTimeLabels
} from '@/services/reminderService';
import { exportMealPlanToPdf } from '@/utils/exportUtils';

type MealTimeFilter = MealTime | 'all';

const Index = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMealTime, setCurrentMealTime] = useState<MealTime>('breakfast');
  const [editingItem, setEditingItem] = useState<MealItem | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'meals' | 'suggestions' | 'reminders'>('meals');
  const [mealTimeFilter, setMealTimeFilter] = useState<MealTimeFilter>('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const totalCalories = mealPlan
    ? Object.values(mealPlan.meals).flatMap(meals => 
        meals.reduce((sum, item) => sum + item.calories, 0)
      ).reduce((a, b) => a + b, 0)
    : 0;

  const totalProtein = mealPlan
    ? Object.values(mealPlan.meals).flatMap(meals => 
        meals.reduce((sum, item) => sum + item.protein, 0)
      ).reduce((a, b) => a + b, 0)
    : 0;

  useEffect(() => {
    try {
      console.log("Initializing sample data...");
      initializeSampleData();
      
      console.log("Getting today's meal plan...");
      const plan = getTodaysMealPlan();
      console.log("Retrieved meal plan:", plan);
      setMealPlan(plan);
      
      console.log("Scheduling notifications...");
      scheduleNotifications();
    } catch (error) {
      console.error("Error in initialization effect:", error);
      // If there's an error, try to reinitialize with a basic plan
      initializeSampleData(true); // Force reinitialize
      const plan = getTodaysMealPlan();
      setMealPlan(plan);
    }
  }, []);
  
  useEffect(() => {
    if (mealPlan) {
      try {
        console.log("Generating reminders from meal plan:", mealPlan);
        generateRemindersFromMealPlan(mealPlan);
      } catch (error) {
        console.error("Error generating reminders:", error);
      }
    }
  }, [mealPlan]);

  const handleAddItem = (mealTime: MealTime) => {
    setCurrentMealTime(mealTime);
    setEditingItem(undefined);
    setDialogOpen(true);
  };

  const handleEditItem = (mealTime: MealTime, item: MealItem) => {
    setCurrentMealTime(mealTime);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = (mealTime: MealTime, itemId: string) => {
    if (!mealPlan) return;
    
    const updatedPlan = removeMealFromTimeSlot(mealPlan, mealTime, itemId);
    setMealPlan(updatedPlan);
    updateMealPlan(updatedPlan);
    
    toast({
      title: "Meal item removed",
      description: "The meal item has been removed from your plan."
    });
  };

  const handleSaveItem = (item: Omit<MealItem, 'id'>, mealTime: MealTime, itemId?: string) => {
    if (!mealPlan) return;
    
    let updatedPlan = mealPlan;
    if (itemId) {
      updatedPlan = removeMealFromTimeSlot(mealPlan, mealTime, itemId);
    }
    
    const newItem: MealItem = {
      ...item,
      id: itemId || `${Date.now()}`
    };
    
    updatedPlan = addMealToTimeSlot(updatedPlan, mealTime, newItem);
    setMealPlan(updatedPlan);
    updateMealPlan(updatedPlan);
    setDialogOpen(false);
    
    toast({
      title: itemId ? "Meal item updated" : "Meal item added",
      description: `The meal item has been ${itemId ? 'updated in' : 'added to'} your plan.`
    });
  };

  const handleAddSuggestion = (mealTime: MealTime, item: Omit<MealItem, 'id'>) => {
    handleSaveItem(item, mealTime);
    setActiveTab('meals');
    
    const label = mealTimeLabels[mealTime] || DEFAULT_MEAL_TIME_LABELS[mealTime] || mealTime;
    
    toast({
      title: "Suggestion added",
      description: `${item.name} added to ${label}`
    });
  };

  const handleSavePlan = () => {
    if (mealPlan) {
      updateMealPlan(mealPlan);
      toast({
        title: "Meal plan saved",
        description: "Your meal plan has been saved successfully."
      });
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    initializeSampleData();
    const plan = getTodaysMealPlan();
    setMealPlan(plan);
    
    toast({
      title: "Data reset",
      description: "Your meal planner has been reset to the sample data."
    });
  };
  
  const handleExportPDF = () => {
    if (!mealPlan) return;
    
    exportMealPlanToPdf(mealPlan, { calories: totalCalories, protein: totalProtein });
    
    toast({
      title: "Exporting meal plan",
      description: "Your meal plan is being exported as a PDF."
    });
  };

  const handleUpdateMealTimeSchedule = (mealTime: MealTime, schedule: MealTimeSchedule) => {
    if (!mealPlan) return;
    
    const updatedPlan = updateMealTimeSchedule(mealPlan, mealTime, schedule);
    setMealPlan(updatedPlan);
    updateMealPlan(updatedPlan);
    
    toast({
      title: "Meal time updated",
      description: `${schedule.label} has been scheduled for ${schedule.time}`
    });
  };

  const getMealSections = () => {
    if (!mealPlan) return null;

    const mealTimes = mealTimeFilter === 'all' 
      ? Object.keys(mealPlan.mealTimeSchedule) as MealTime[]
      : [mealTimeFilter];

    return mealTimes.map((mealTime) => (
      <MealTimeSection
        key={mealTime}
        title={mealPlan.mealTimeSchedule[mealTime].label}
        mealTime={mealTime}
        schedule={mealPlan.mealTimeSchedule[mealTime]}
        items={mealPlan.meals[mealTime] || []}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onUpdateSchedule={handleUpdateMealTimeSchedule}
      />
    ));
  };

  if (!mealPlan) {
    return <div className="flex justify-center items-center h-screen">Loading meal plan data...</div>;
  }

  return (
    <div className="container px-4 py-4 sm:py-8 mx-auto max-w-6xl transition-colors duration-300">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <UtensilsCrossed className="mr-2 text-veggie-green" />
              Veggie Gain-o-Meter
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
              Your high-calorie vegetarian meal planner for healthy weight gain
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <ThemeToggle />
            
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center text-xs md:text-sm h-8 md:h-9">
              <Download size={16} className="mr-1 md:mr-2" />
              {isMobile ? '' : 'Export'}
            </Button>
            
            <Button variant="outline" onClick={handleResetData} className="flex items-center text-xs md:text-sm h-8 md:h-9">
              <RefreshCw size={16} className="mr-1 md:mr-2" />
              {isMobile ? 'Reset' : 'Reset Data'}
            </Button>
            
            <Button onClick={handleSavePlan} className="bg-veggie-green hover:bg-green-600 flex items-center text-xs md:text-sm h-8 md:h-9">
              <Save size={16} className="mr-1 md:mr-2" />
              {isMobile ? 'Save' : 'Save Plan'}
            </Button>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-veggie-light to-white dark:from-green-900/20 dark:to-gray-800/40">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center">
                <Calendar className="mr-2 text-veggie-green" />
                <h2 className="text-sm md:text-lg font-medium">{new Date(mealPlan.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              </div>
              
              <div className="flex gap-2">
                <Badge className="bg-veggie-orange text-white hover:bg-orange-600 dark:bg-orange-700 dark:hover:bg-orange-600">
                  {totalCalories} calories
                </Badge>
                <Badge className="bg-veggie-purple text-white hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600">
                  {totalProtein}g protein
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <NutritionSummaryCards 
        calories={totalCalories} 
        protein={totalProtein} 
      />

      {isMobile && (
        <Tabs defaultValue="meals" value={activeTab} onValueChange={(value) => setActiveTab(value as 'meals' | 'suggestions' | 'reminders')} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="meals" className="flex-1">Meal Plan</TabsTrigger>
            <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
            <TabsTrigger value="reminders" className="flex-1">
              <Bell size={16} className="mr-1" />
              Reminders
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <main className={isMobile ? "" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {(!isMobile || activeTab === 'meals') && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Your Meal Plan</h3>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Filter size={14} />
                      <span className="ml-1">Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuCheckboxItem
                      checked={mealTimeFilter === 'all'}
                      onCheckedChange={() => setMealTimeFilter('all')}
                    >
                      All Meals
                    </DropdownMenuCheckboxItem>
                    {(Object.keys(mealPlan.mealTimeSchedule) as MealTime[]).map((time) => (
                      <DropdownMenuCheckboxItem
                        key={time}
                        checked={mealTimeFilter === time}
                        onCheckedChange={() => setMealTimeFilter(time)}
                      >
                        {mealPlan.mealTimeSchedule[time].label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
              </div>
            </div>
            
            {getMealSections()}
            
            <div className="mt-6 p-4 bg-veggie-light dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-900">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Tips for Healthy Weight Gain</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <ArrowRight size={16} className="mr-1 mt-1 text-veggie-green flex-shrink-0" />
                  <span>Focus on nutrient-dense foods like nuts, seeds, whole grains.</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={16} className="mr-1 mt-1 text-veggie-green flex-shrink-0" />
                  <span>Add healthy fats like ghee, olive oil, or avocados to meals.</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={16} className="mr-1 mt-1 text-veggie-green flex-shrink-0" />
                  <span>Include protein-rich foods with each meal (legumes, dairy, tofu).</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={16} className="mr-1 mt-1 text-veggie-green flex-shrink-0" />
                  <span>Stay consistent with your eating schedule for best results.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {(!isMobile || activeTab === 'suggestions') && (
          <div>
            <MealSuggestions onAddSuggestion={handleAddSuggestion} />
          </div>
        )}
        
        {(!isMobile || activeTab === 'reminders') && (
          <div>
            <RemindersSection />
          </div>
        )}
      </main>

      <MealItemDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveItem}
        mealTime={currentMealTime}
        editItem={editingItem}
      />
    </div>
  );
};

export default Index;
