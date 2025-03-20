
import { useState } from 'react';
import { MealTime, MealItem } from '../types/meal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

interface MealSuggestionsProps {
  onAddSuggestion: (mealTime: MealTime, item: Omit<MealItem, 'id'>) => void;
}

const highProteinOptions: Record<string, Omit<MealItem, 'id'>[]> = {
  breakfast: [
    {
      name: 'Greek Yogurt Parfait',
      description: 'Greek yogurt with honey and granola',
      calories: 300,
      protein: 20
    },
    {
      name: 'Tofu Scramble',
      description: 'Scrambled tofu with vegetables and spices',
      calories: 250,
      protein: 18
    },
    {
      name: 'Protein Smoothie',
      description: 'Protein powder, banana, milk and peanut butter',
      calories: 400,
      protein: 30
    }
  ],
  lunch: [
    {
      name: 'Lentil Soup',
      description: 'Hearty lentil soup with vegetables',
      calories: 350,
      protein: 22
    },
    {
      name: 'Paneer Wrap',
      description: 'Whole wheat wrap with paneer tikka filling',
      calories: 420,
      protein: 24
    },
    {
      name: 'Chickpea Salad',
      description: 'Mixed greens with chickpeas and tahini dressing',
      calories: 380,
      protein: 18
    }
  ],
  dinner: [
    {
      name: 'Bean Curry',
      description: 'Rajma curry with steamed rice',
      calories: 450,
      protein: 26
    },
    {
      name: 'Paneer Makhani',
      description: 'Paneer in rich tomato gravy with naan',
      calories: 550,
      protein: 28
    },
    {
      name: 'Vegetable Quinoa Bowl',
      description: 'Quinoa with roasted vegetables and tofu',
      calories: 420,
      protein: 22
    }
  ],
  snacks: [
    {
      name: 'Protein Bars',
      description: 'Homemade protein bars with nuts and seeds',
      calories: 200,
      protein: 15
    },
    {
      name: 'Cottage Cheese',
      description: 'Cottage cheese with fruit and honey',
      calories: 180,
      protein: 14
    },
    {
      name: 'Edamame',
      description: 'Steamed edamame with sea salt',
      calories: 120,
      protein: 12
    }
  ]
};

const highCalorieOptions: Record<string, Omit<MealItem, 'id'>[]> = {
  breakfast: [
    {
      name: 'Avocado Toast',
      description: 'Whole grain toast with avocado and eggs',
      calories: 450,
      protein: 15
    },
    {
      name: 'Nut Butter Oatmeal',
      description: 'Oats cooked with almond milk and nut butter',
      calories: 500,
      protein: 12
    },
    {
      name: 'Cheese Paratha',
      description: 'Stuffed cheese paratha with butter',
      calories: 550,
      protein: 16
    }
  ],
  lunch: [
    {
      name: 'Loaded Potato',
      description: 'Baked potato with cheese, sour cream, and beans',
      calories: 650,
      protein: 18
    },
    {
      name: 'Nut Burger',
      description: 'Homemade nut and bean burger with avocado',
      calories: 600,
      protein: 20
    },
    {
      name: 'Coconut Curry',
      description: 'Rich coconut curry with rice and vegetables',
      calories: 580,
      protein: 14
    }
  ],
  dinner: [
    {
      name: 'Stuffed Bell Peppers',
      description: 'Bell peppers with rice, cheese, and beans',
      calories: 520,
      protein: 18
    },
    {
      name: 'Creamy Pasta',
      description: 'Pasta with cashew cream sauce and vegetables',
      calories: 680,
      protein: 16
    },
    {
      name: 'Vegetarian Poutine',
      description: 'Fries with gravy and cheese curds',
      calories: 750,
      protein: 20
    }
  ],
  snacks: [
    {
      name: 'Trail Mix',
      description: 'Nuts, seeds, dried fruit, and dark chocolate',
      calories: 280,
      protein: 8
    },
    {
      name: 'Chocolate Milkshake',
      description: 'Full-fat milk with chocolate and ice cream',
      calories: 450,
      protein: 12
    },
    {
      name: 'Cheese and Crackers',
      description: 'Assorted cheeses with whole grain crackers',
      calories: 350,
      protein: 10
    }
  ]
};

const getMealTimeFromCategory = (category: string): MealTime => {
  switch (category) {
    case 'breakfast':
      return 'breakfast';
    case 'lunch':
      return 'lunch';
    case 'dinner':
      return 'dinner';
    case 'snacks':
      if (Math.random() > 0.5) {
        return 'midMorning';
      } else {
        return 'evening';
      }
    default:
      return 'breakfast';
  }
};

const MealSuggestions = ({ onAddSuggestion }: MealSuggestionsProps) => {
  const [activeTab, setActiveTab] = useState('highProtein');

  const handleAddSuggestion = (category: string, item: Omit<MealItem, 'id'>) => {
    const mealTime = getMealTimeFromCategory(category);
    onAddSuggestion(mealTime, item);
  };

  const renderMealCategory = (
    category: string, 
    items: Omit<MealItem, 'id'>[]
  ) => (
    <div className="mb-4">
      <h3 className="text-md font-medium capitalize mb-2">{category}</h3>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
            <div>
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
              <div className="text-xs mt-1">
                <span className="text-orange-600 mr-2">{item.calories} cal</span>
                <span className="text-green-600">{item.protein}g protein</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => handleAddSuggestion(category, item)}
              className="h-7 w-7 p-0"
            >
              <Plus size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Meal Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="highProtein" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="highProtein" className="flex-1">High Protein</TabsTrigger>
            <TabsTrigger value="highCalorie" className="flex-1">High Calorie</TabsTrigger>
          </TabsList>
          
          <TabsContent value="highProtein" className="mt-0">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(highProteinOptions).map(([category, items]) => (
                renderMealCategory(category, items)
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="highCalorie" className="mt-0">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(highCalorieOptions).map(([category, items]) => (
                renderMealCategory(category, items)
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MealSuggestions;
