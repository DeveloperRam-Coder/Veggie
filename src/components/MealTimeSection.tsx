
import { useState } from 'react';
import { MealItem, MealTime, MealTimeSchedule } from '../types/meal';
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMealTimeIcon } from '@/utils/mealIcons';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface MealTimeSectionProps {
  title: string;
  mealTime: MealTime;
  items: MealItem[];
  schedule: MealTimeSchedule;
  onAddItem: (mealTime: MealTime) => void;
  onEditItem: (mealTime: MealTime, item: MealItem) => void;
  onDeleteItem: (mealTime: MealTime, itemId: string) => void;
  onUpdateSchedule: (mealTime: MealTime, schedule: MealTimeSchedule) => void;
}

const getMealTimeColor = (mealTime: MealTime): string => {
  switch (mealTime) {
    case 'morning':
    case 'breakfast':
      return 'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800';
    case 'midMorning':
    case 'lunch':
      return 'bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800';
    case 'evening':
    case 'dinner':
      return 'bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-800';
    case 'beforeBed':
      return 'bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800';
    default:
      return 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700';
  }
};

const MealTimeSection = ({
  title,
  mealTime,
  items,
  schedule,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateSchedule
}: MealTimeSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [editingTime, setEditingTime] = useState(schedule.time);
  const [editingLabel, setEditingLabel] = useState(schedule.label);
  const isMobile = useIsMobile();
  const borderColorClass = getMealTimeColor(mealTime);
  const { toast } = useToast();
  
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
  const MealIcon = getMealTimeIcon(mealTime);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const openTimeDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTime(schedule.time);
    setEditingLabel(schedule.label);
    setTimeDialogOpen(true);
  };
  
  const saveTimeSchedule = () => {
    onUpdateSchedule(mealTime, {
      time: editingTime,
      label: editingLabel
    });
    
    toast({
      title: "Schedule updated",
      description: `${editingLabel} has been scheduled for ${formatTimeForDisplay(editingTime)}`
    });
    
    setTimeDialogOpen(false);
  };
  
  const formatTimeForDisplay = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return time;
    }
  };

  return (
    <>
      <Card className={`mb-4 border-l-4 ${borderColorClass} transition-colors duration-200`}>
        <CardHeader className="py-3 cursor-pointer" onClick={toggleExpanded}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center">
              {expanded ? <ChevronUp size={18} className="mr-2" /> : <ChevronDown size={18} className="mr-2" />}
              <MealIcon className="mr-2 text-veggie-green dark:text-veggie-green/80" size={18} />
              <span className="mr-3">{schedule.label}</span>
              <Badge 
                variant="outline" 
                className="ml-2 bg-blue-50 dark:bg-blue-950/50 cursor-pointer hover:bg-blue-100"
                onClick={openTimeDialog}
              >
                <Clock size={12} className="mr-1" />
                {formatTimeForDisplay(schedule.time)}
              </Badge>
            </CardTitle>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onAddItem(mealTime);
              }}
              className="h-8 px-2"
            >
              <Plus size={18} />
              <span className="ml-1">{isMobile ? '' : 'Add'}</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/50 whitespace-nowrap">
              {totalCalories} calories
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 whitespace-nowrap">
              {totalProtein}g protein
            </Badge>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="py-0">
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                    <div className="mb-2 sm:mb-0">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                      <div className="flex gap-2 mt-1 sm:hidden">
                        <span className="text-xs text-orange-600 dark:text-orange-400">{item.calories} cal</span>
                        <span className="text-xs text-green-600 dark:text-green-400">{item.protein}g protein</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onEditItem(mealTime, item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onDeleteItem(mealTime, item.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400 italic">No items added yet</p>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Time Schedule Dialog */}
      <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Meal Time</DialogTitle>
            <DialogDescription>
              Adjust the schedule for this meal. Reminders will update automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mealLabel">Meal Name</Label>
              <Input
                id="mealLabel"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="e.g., Breakfast"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealTime">Scheduled Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 text-gray-500" size={20} />
                <Input
                  id="mealTime"
                  type="time"
                  value={editingTime}
                  onChange={(e) => setEditingTime(e.target.value)}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Reminders for this meal will adjust to the new time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTimeSchedule}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealTimeSection;
