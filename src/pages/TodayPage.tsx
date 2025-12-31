import { useState, useMemo } from "react";
import { Plus, X, Search, Flame, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  getUserProfile, 
  getMealsByDate, 
  saveMeal, 
  deleteMeal,
  getDailyNutritionTotals,
  getTodayDate,
  generateId,
  COMMON_FOODS 
} from "@/lib/storage";
import { Meal } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TodayPage() {
  const [meals, setMeals] = useState<Meal[]>(() => getMealsByDate(getTodayDate()));
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const profile = getUserProfile();
  const targets = profile?.nutritionTargets ?? { calories: 2000, protein: 150 };
  const totals = useMemo(() => getDailyNutritionTotals(getTodayDate()), [meals]);

  const caloriesProgress = Math.min((totals.calories / targets.calories) * 100, 100);
  const proteinProgress = Math.min((totals.protein / targets.protein) * 100, 100);
  const caloriesRemaining = targets.calories - totals.calories;
  const proteinRemaining = targets.protein - totals.protein;

  const filteredFoods = COMMON_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMeal = () => {
    if (!mealName || !mealCalories) {
      toast.error('Please enter meal name and calories');
      return;
    }

    const meal: Meal = {
      id: generateId(),
      date: getTodayDate(),
      name: mealName,
      calories: parseInt(mealCalories),
      protein: mealProtein ? parseInt(mealProtein) : undefined,
      createdAt: new Date().toISOString(),
    };

    saveMeal(meal);
    setMeals(getMealsByDate(getTodayDate()));
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setIsAddingMeal(false);
    setShowSuggestions(true);
    toast.success('Meal added');
  };

  const handleQuickAdd = (food: typeof COMMON_FOODS[0]) => {
    setMealName(food.name);
    setMealCalories(food.calories.toString());
    setMealProtein(food.protein.toString());
    setShowSuggestions(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMeal(mealId);
    setMeals(getMealsByDate(getTodayDate()));
    toast.success('Meal removed');
  };

  // Smart adjustment suggestion
  const showAdjustment = caloriesRemaining < -200;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader 
          title="Today" 
          subtitle={new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        />

        {/* Progress Rings */}
        <div className="flex justify-center gap-8 py-6">
          <div className="text-center">
            <ProgressRing 
              progress={caloriesProgress} 
              size={100}
              progressClassName="stroke-nutrition-calories"
            >
              <div>
                <Flame className="w-5 h-5 mx-auto text-nutrition-calories mb-0.5" />
                <span className="text-xs text-muted-foreground">cal</span>
              </div>
            </ProgressRing>
            <div className="mt-3">
              <p className="font-display font-bold text-lg">{totals.calories}</p>
              <p className="text-xs text-muted-foreground">
                {caloriesRemaining > 0 ? `${caloriesRemaining} left` : `${Math.abs(caloriesRemaining)} over`}
              </p>
            </div>
          </div>

          <div className="text-center">
            <ProgressRing 
              progress={proteinProgress} 
              size={100}
              progressClassName="stroke-nutrition-protein"
            >
              <div>
                <Beef className="w-5 h-5 mx-auto text-nutrition-protein mb-0.5" />
                <span className="text-xs text-muted-foreground">prot</span>
              </div>
            </ProgressRing>
            <div className="mt-3">
              <p className="font-display font-bold text-lg">{totals.protein}g</p>
              <p className="text-xs text-muted-foreground">
                {proteinRemaining > 0 ? `${proteinRemaining}g left` : 'Target hit!'}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Adjustment */}
        {showAdjustment && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6 animate-slide-up">
            <p className="text-sm">
              <span className="font-medium">No stress!</span> You're {Math.abs(caloriesRemaining)} calories over. 
              Consider a lighter day tomorrow or a longer walk.
            </p>
          </div>
        )}

        {/* Meals List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">Meals</h2>
            <span className="text-xs text-muted-foreground">{meals.length} logged</span>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No meals logged yet</p>
              <p className="text-sm">Tap + to add your first meal</p>
            </div>
          ) : (
            meals.map(meal => (
              <div 
                key={meal.id}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border animate-fade-in"
              >
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {meal.calories} cal {meal.protein && `· ${meal.protein}g protein`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Meal Dialog */}
        <Dialog open={isAddingMeal} onOpenChange={setIsAddingMeal}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-14">
              <Plus className="w-5 h-5 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add Meal</DialogTitle>
            </DialogHeader>

            {showSuggestions && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search common foods..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredFoods.slice(0, 8).map(food => (
                    <button
                      key={food.name}
                      onClick={() => handleQuickAdd(food)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-sm">{food.name}</p>
                        <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{food.calories}</p>
                        <p className="text-xs text-muted-foreground">{food.protein}g</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    Or enter manually →
                  </button>
                </div>
              </div>
            )}

            {!showSuggestions && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meal-name">Meal name</Label>
                  <Input
                    id="meal-name"
                    placeholder="e.g., Chicken with rice"
                    value={mealName}
                    onChange={e => setMealName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="500"
                      value={mealCalories}
                      onChange={e => setMealCalories(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="30"
                      value={mealProtein}
                      onChange={e => setMealProtein(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowSuggestions(true);
                      setMealName('');
                      setMealCalories('');
                      setMealProtein('');
                    }}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleAddMeal}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <BottomNav />
    </div>
  );
}
