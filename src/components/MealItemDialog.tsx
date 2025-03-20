
import { useState, useEffect } from 'react';
import { MealItem, MealTime } from '../types/meal';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface MealItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MealItem, 'id'>, mealTime: MealTime, itemId?: string) => void;
  mealTime: MealTime;
  editItem?: MealItem;
}

const MealItemDialog = ({
  isOpen,
  onClose,
  onSave,
  mealTime,
  editItem
}: MealItemDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description);
      setCalories(editItem.calories.toString());
      setProtein(editItem.protein.toString());
    } else {
      setName('');
      setDescription('');
      setCalories('');
      setProtein('');
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const item = {
        name,
        description,
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0
      };
      
      onSave(item, mealTime, editItem?.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Edit Meal Item' : 'Add Meal Item'}
          </DialogTitle>
          <DialogDescription>
            Enter the details for this meal item.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Meal Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Glass of Milk"
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Full-fat milk, 200ml"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g., 150"
                min="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="e.g., 8"
                step="0.1"
                min="0"
                required
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MealItemDialog;
