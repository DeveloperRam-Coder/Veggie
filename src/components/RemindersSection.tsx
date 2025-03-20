
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Bell, BellOff, Plus, Edit, Volume2, MoreHorizontal } from 'lucide-react';
import { MealReminder } from '@/types/reminder';
import { 
  getReminders, 
  initializeDefaultReminders, 
  scheduleNotifications,
  mealTimeLabels
} from '@/services/reminderService';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ReminderDialog from './ReminderDialog';
import { getMealTimeIcon } from '@/utils/mealIcons';
import { availableSounds, playSound } from '@/utils/sounds';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RemindersSection = () => {
  const [reminders, setReminders] = useState<MealReminder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MealReminder | undefined>(undefined);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initialize reminders if needed
    initializeDefaultReminders();
    loadReminders();
    
    // Request notification permission
    if (Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    
    // Schedule notifications
    scheduleNotifications();
    
    // Reload reminders when the dialog closes
    const reloadInterval = setInterval(loadReminders, 1000);
    return () => clearInterval(reloadInterval);
  }, []);
  
  const loadReminders = () => {
    const loadedReminders = getReminders();
    setReminders(loadedReminders);
  };

  const handleAddReminder = () => {
    setEditingReminder(undefined);
    setDialogOpen(true);
  };
  
  const handleEditReminder = (reminder: MealReminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

  const handlePlaySound = (soundId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundId) {
      const sound = availableSounds.find(s => s.id === soundId);
      if (sound) {
        playSound(sound.url, 5);
        toast({
          title: "Playing sound preview",
          description: `${sound.name} (5 second preview)`
        });
      }
    }
  };
  
  const toggleReminderEnabled = (reminder: MealReminder, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedReminder = {...reminder, enabled: !reminder.enabled};
    
    // Update the reminder in the services/database
    import('@/services/reminderService').then(({ updateReminder }) => {
      updateReminder(updatedReminder);
      loadReminders();
      
      toast({
        title: updatedReminder.enabled ? "Reminder enabled" : "Reminder disabled",
        description: `${reminder.label} has been ${updatedReminder.enabled ? 'enabled' : 'disabled'}`
      });
    });
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Meal Reminders</CardTitle>
          <Button size="sm" onClick={handleAddReminder} className="h-8">
            <Plus size={16} className="mr-1" />
            {!isMobile && "Add Reminder"}
          </Button>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const MealIcon = getMealTimeIcon(reminder.mealTime as any);
                const soundName = availableSounds.find(s => s.id === reminder.soundId)?.name || 'Default';
                
                return (
                  <div 
                    key={reminder.id}
                    className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleEditReminder(reminder)}
                  >
                    <div className="flex items-center">
                      <MealIcon size={18} className="mr-2 text-veggie-green dark:text-veggie-green/80" />
                      <div>
                        <h4 className="font-medium text-sm">{reminder.label}</h4>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock size={14} className="mr-1" />
                          {reminder.reminderTime}
                          {reminder.soundId && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-1 p-0" 
                              onClick={(e) => handlePlaySound(reminder.soundId, e)}
                            >
                              <Volume2 size={14} className="text-gray-500" />
                            </Button>
                          )}
                        </div>
                        {(reminder.advanceWarning || reminder.repeat) && (
                          <div className="flex gap-1 mt-1">
                            {reminder.advanceWarning > 0 && (
                              <Badge variant="outline" className="text-xs py-0 h-5">
                                {reminder.advanceWarning}m early
                              </Badge>
                            )}
                            {reminder.repeat && (
                              <Badge variant="outline" className="text-xs py-0 h-5">
                                Repeats {reminder.maxRepeats}x
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={reminder.enabled} 
                        onCheckedChange={(checked) => {
                          const updatedReminder = {...reminder, enabled: checked};
                          import('@/services/reminderService').then(({ updateReminder }) => {
                            updateReminder(updatedReminder);
                            loadReminders();
                            
                            toast({
                              title: checked ? "Reminder enabled" : "Reminder disabled",
                              description: `${reminder.label} has been ${checked ? 'enabled' : 'disabled'}`
                            });
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-veggie-green" 
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditReminder(reminder);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handlePlaySound(reminder.soundId, e)}>
                            <Volume2 className="mr-2 h-4 w-4" />
                            Test Sound
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => toggleReminderEnabled(reminder, e)}>
                            {reminder.enabled ? (
                              <>
                                <BellOff className="mr-2 h-4 w-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Bell className="mr-2 h-4 w-4" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400 italic">
              No reminders set. Add your first reminder!
            </p>
          )}
          
          <div className="mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-sm">
            <p className="flex items-start">
              <Bell className="mr-2 text-amber-500 shrink-0 mt-0.5" size={16} />
              <span>
                Meal reminders help you stay consistent with your eating schedule, which is important for healthy weight gain.
                Click on any reminder to edit or tap the sound icon to preview the alarm.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <ReminderDialog 
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          loadReminders();
          scheduleNotifications();
        }}
        editReminder={editingReminder}
      />
    </>
  );
};

export default RemindersSection;
