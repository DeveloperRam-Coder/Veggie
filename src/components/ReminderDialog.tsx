
import { useState, useEffect, useRef } from 'react';
import { MealReminder, ReminderTimeAdjustment } from '@/types/reminder';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Clock, Bell, BellOff, Volume2, VolumeX, Plus, Upload, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getReminders, 
  saveReminder, 
  updateReminder, 
  deleteReminder, 
  testReminderSound, 
  mealTimeLabels,
  adjustReminderTime
} from '@/services/reminderService';
import { availableSounds, playSound, stopSound, addCustomSound, SoundOption, getActiveSoundInfo } from '@/utils/sounds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editReminder?: MealReminder;
}

const timeAdjustments: ReminderTimeAdjustment[] = [-30, -15, -5, 0, 5, 15, 30];

const ReminderDialog = ({
  isOpen,
  onClose,
  editReminder
}: ReminderDialogProps) => {
  const [reminderTime, setReminderTime] = useState('08:00');
  const [enabled, setEnabled] = useState(true);
  const [mealTime, setMealTime] = useState('breakfast');
  const [label, setLabel] = useState('Breakfast Time');
  const [soundId, setSoundId] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [customSoundUrl, setCustomSoundUrl] = useState('');
  const [soundTab, setSoundTab] = useState('preset');
  const [advanceWarning, setAdvanceWarning] = useState<number>(0);
  const [repeat, setRepeat] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState<number>(5);
  const [maxRepeats, setMaxRepeats] = useState<number>(3);
  const [activeSound, setActiveSound] = useState<{ isPlaying: boolean, remainingSeconds: number }>({ isPlaying: false, remainingSeconds: 0 });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editReminder) {
      setReminderTime(editReminder.reminderTime);
      setEnabled(editReminder.enabled);
      setMealTime(editReminder.mealTime);
      setLabel(editReminder.label);
      setSoundId(editReminder.soundId || 'default');
      setAdvanceWarning(editReminder.advanceWarning || 0);
      setRepeat(editReminder.repeat || false);
      setRepeatInterval(editReminder.repeatInterval || 5);
      setMaxRepeats(editReminder.maxRepeats || 3);
    } else {
      setReminderTime('08:00');
      setEnabled(true);
      setMealTime('breakfast');
      setLabel('Breakfast Time');
      setSoundId('default');
      setAdvanceWarning(0);
      setRepeat(false);
      setRepeatInterval(5);
      setMaxRepeats(3);
    }
    
    // Reset custom sound form
    setCustomSoundName('');
    setCustomSoundUrl('');
    setSoundTab('preset');
    setShowAdvancedOptions(false);
  }, [editReminder, isOpen]);

  // Clean up audio when dialog closes
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);
  
  // Sound playback status update
  useEffect(() => {
    if (activeSound.isPlaying) {
      const interval = setInterval(() => {
        setActiveSound(getActiveSoundInfo());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [activeSound.isPlaying]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reminderData = {
      reminderTime,
      enabled,
      mealTime,
      label,
      soundId,
      advanceWarning,
      repeat,
      repeatInterval,
      maxRepeats
    };
    
    if (editReminder) {
      updateReminder({ ...reminderData, id: editReminder.id });
      toast({
        title: "Reminder updated",
        description: `Your reminder for ${label} has been updated.`
      });
    } else {
      saveReminder(reminderData);
      toast({
        title: "Reminder created",
        description: `Your reminder for ${label} has been created.`
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (editReminder) {
      deleteReminder(editReminder.id);
      toast({
        title: "Reminder deleted",
        description: `Your reminder for ${label} has been deleted.`
      });
      onClose();
    }
  };

  const handlePreviewSound = () => {
    testReminderSound(soundId);
    setActiveSound(getActiveSoundInfo());
  };

  const handleStopSound = () => {
    stopSound();
    setActiveSound({ isPlaying: false, remainingSeconds: 0 });
  };

  const handleAddCustomSound = () => {
    if (!customSoundName || !customSoundUrl) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and URL for your custom sound",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if URL is valid
      new URL(customSoundUrl);
      
      // Add the custom sound
      const newSound = addCustomSound(customSoundName, customSoundUrl);
      setSoundId(newSound.id);
      setSoundTab('preset');
      
      toast({
        title: "Custom sound added",
        description: `${customSoundName} has been added to your sound options`
      });
      
      // Reset the form
      setCustomSoundName('');
      setCustomSoundUrl('');
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid URL for your sound file",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only accept audio files
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (mp3, wav, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Create object URL for the uploaded file
    const objectUrl = URL.createObjectURL(file);
    setCustomSoundUrl(objectUrl);
    
    // Use filename if custom name is empty
    if (!customSoundName) {
      setCustomSoundName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleTimeAdjustment = (adjustment: ReminderTimeAdjustment) => {
    if (adjustment === 0) return;
    
    setReminderTime(prev => adjustReminderTime(prev, adjustment));
    
    toast({
      title: "Time adjusted",
      description: `Reminder time ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)} minutes`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editReminder ? 'Edit Reminder' : 'Add Reminder'}
          </DialogTitle>
          <DialogDescription>
            Set up reminders for your meal times.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Reminder Name</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Breakfast Time"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mealTime">Meal Type</Label>
            <Select value={mealTime} onValueChange={(value) => {
              setMealTime(value);
              if (!label || label === `${mealTimeLabels[mealTime as any]} Time`) {
                setLabel(`${mealTimeLabels[value as any]} Time`);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="midMorning">Mid-Morning Snack</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="evening">Evening Snack</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="beforeBed">Before Bed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <div className="flex items-center">
              <Clock className="mr-2 text-gray-500" size={20} />
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                required
                className="flex-1"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {timeAdjustments.map(minutes => (
                <Button 
                  key={minutes} 
                  type="button" 
                  variant={minutes === 0 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleTimeAdjustment(minutes)}
                  className={`${minutes === 0 ? 'bg-veggie-green hover:bg-green-600' : ''} h-8 px-2.5 py-1`}
                >
                  {minutes > 0 ? (
                    <span className="flex items-center">
                      <Plus size={14} className="mr-0.5" /> {minutes}m
                    </span>
                  ) : minutes < 0 ? (
                    <span className="flex items-center">
                      <Minus size={14} className="mr-0.5" /> {Math.abs(minutes)}m
                    </span>
                  ) : (
                    'Reset'
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="advancedOptions">Advanced Options</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="h-8 w-8 p-0"
              >
                {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>
            
            {showAdvancedOptions && (
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="advanceWarning" className="text-sm">Advance Warning</Label>
                      <Badge variant="outline">{advanceWarning} minutes</Badge>
                    </div>
                    <Slider
                      id="advanceWarning"
                      value={[advanceWarning]}
                      min={0}
                      max={30}
                      step={5}
                      onValueChange={(value) => setAdvanceWarning(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      Notify this many minutes before the actual meal time
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="repeat" className="text-sm">Repeat Reminder</Label>
                      <Switch
                        id="repeat"
                        checked={repeat}
                        onCheckedChange={setRepeat}
                      />
                    </div>
                    
                    {repeat && (
                      <div className="pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-4 mt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="repeatInterval" className="text-sm">Repeat Every</Label>
                            <Badge variant="outline">{repeatInterval} minutes</Badge>
                          </div>
                          <Slider
                            id="repeatInterval"
                            value={[repeatInterval]}
                            min={1}
                            max={15}
                            step={1}
                            onValueChange={(value) => setRepeatInterval(value[0])}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="maxRepeats" className="text-sm">Max Repeats</Label>
                            <Badge variant="outline">{maxRepeats} times</Badge>
                          </div>
                          <Slider
                            id="maxRepeats"
                            value={[maxRepeats]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(value) => setMaxRepeats(value[0])}
                          />
                          <p className="text-xs text-muted-foreground">
                            Will repeat up to {maxRepeats} times or until dismissed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Alert Sound</Label>
            <Tabs value={soundTab} onValueChange={setSoundTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Preset Sounds</TabsTrigger>
                <TabsTrigger value="custom">Custom Sound</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preset" className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Select value={soundId} onValueChange={setSoundId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select alert sound" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableSounds.filter(s => s.id !== 'custom' || s.url).map((sound) => (
                        <SelectItem key={sound.id} value={sound.id}>
                          {sound.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={handlePreviewSound}
                      className="shrink-0"
                      disabled={activeSound.isPlaying}
                    >
                      <Volume2 size={18} />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={handleStopSound}
                      className="shrink-0"
                      disabled={!activeSound.isPlaying}
                    >
                      <VolumeX size={18} />
                    </Button>
                  </div>
                </div>
                
                {activeSound.isPlaying && (
                  <div className="flex items-center space-x-2 mt-2 text-xs">
                    <span className="animate-pulse text-orange-500">●</span>
                    <span>Playing sound ({activeSound.remainingSeconds}s remaining)</span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">All alarms play for 30 seconds when triggered</p>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customSoundName">Sound Name</Label>
                  <Input
                    id="customSoundName"
                    value={customSoundName}
                    onChange={(e) => setCustomSoundName(e.target.value)}
                    placeholder="e.g., My Alarm Sound"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customSoundUrl">Sound URL</Label>
                  <Input
                    id="customSoundUrl"
                    value={customSoundUrl}
                    onChange={(e) => setCustomSoundUrl(e.target.value)}
                    placeholder="https://example.com/sound.mp3"
                  />
                </div>
                
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={triggerFileUpload}
                    className="flex-1"
                  >
                    <Upload size={16} className="mr-1" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleAddCustomSound}
                    className="flex-1"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Sound
                  </Button>
                </div>
                
                {customSoundUrl && (
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        playSound(customSoundUrl, 5);
                        setActiveSound(getActiveSoundInfo());
                      }}
                      disabled={activeSound.isPlaying}
                    >
                      <Volume2 size={16} className="mr-1" />
                      Preview
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleStopSound}
                      disabled={!activeSound.isPlaying}
                    >
                      <VolumeX size={16} className="mr-1" />
                      Stop
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Reminder</Label>
              <p className="text-sm text-muted-foreground">
                {enabled ? (
                  <span className="flex items-center text-green-600">
                    <Bell size={16} className="mr-1" />
                    Notifications enabled
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500">
                    <BellOff size={16} className="mr-1" />
                    Notifications disabled
                  </span>
                )}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            {editReminder && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editReminder ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
