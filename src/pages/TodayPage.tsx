import { useState, useMemo } from "react";
import { Plus, X, Search, Flame, Beef, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumPaywall, usePremiumGate } from "@/components/PremiumPaywall";
import { WeeklyBar } from "@/components/WeeklyBar";
import { TodayStatus } from "@/components/TodayStatus";
import { NutritionGuidance } from "@/components/NutritionGuidance";
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
  const { showPaywall, setShowPaywall, paywallFeature, isPremium } = usePremiumGate();
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
    toast.success('Meal logged');
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

  // Smart adjustment suggestion (Premium feature)
  const showAdjustment = caloriesRemaining < -200 && isPremium();

  return (
    <div className="min-h-screen bg-background pb-24 gradient-mesh">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader 
          title="Today" 
          subtitle={new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        />

        {/* Weekly Overview */}
        <WeeklyBar />

        {/* Today's Primary Action */}
        <TodayStatus />

        {/* Progress Rings */}
        <div className="flex justify-center gap-10 py-6 animate-scale-in">
          <div className="text-center">
            <div className="relative">
              <ProgressRing 
                progress={caloriesProgress} 
                size={100}
                strokeWidth={8}
                progressClassName="stroke-nutrition-calories"
              >
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-nutrition-calories/10 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-nutrition-calories" />
                  </div>
                </div>
              </ProgressRing>
            </div>
            <div className="mt-3">
              <p className="font-display font-bold text-xl">{totals.calories}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {caloriesRemaining > 0 ? `${caloriesRemaining} left` : `${Math.abs(caloriesRemaining)} over`}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="relative">
              <ProgressRing 
                progress={proteinProgress} 
                size={100}
                strokeWidth={8}
                progressClassName="stroke-nutrition-protein"
              >
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-nutrition-protein/10 flex items-center justify-center">
                    <Beef className="w-4 h-4 text-nutrition-protein" />
                  </div>
                </div>
              </ProgressRing>
            </div>
            <div className="mt-3">
              <p className="font-display font-bold text-xl">{totals.protein}g</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {proteinRemaining > 0 ? `${proteinRemaining}g left` : 'Target hit!'}
              </p>
            </div>
          </div>
        </div>

        {/* Nutrition Guidance */}
        <NutritionGuidance targets={targets} />

        {/* Smart Adjustment */}
        {showAdjustment && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6 animate-slide-up flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Don't stress!</p>
              <p className="text-sm text-muted-foreground">
                You're {Math.abs(caloriesRemaining)} calories over. Consider a lighter day tomorrow or a longer walk.
              </p>
            </div>
          </div>
        )}

        {/* Meals List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Logged Meals</h2>
            <span className="text-xs text-muted-foreground">{meals.length} today</span>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="font-medium">No meals logged yet</p>
              <p className="text-sm mt-1">Track what you eat to hit your targets</p>
            </div>
          ) : (
            meals.map((meal, index) => (
              <div 
                key={meal.id}
                className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/60 shadow-sm animate-slide-up hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {meal.calories} cal {meal.protein && `· ${meal.protein}g protein`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
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
            <Button size="xl" className="w-full shadow-lg shadow-primary/20 glow-primary">
              <Plus className="w-5 h-5 mr-2" />
              Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Meal</DialogTitle>
            </DialogHeader>

            {showSuggestions && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search common foods..."
                    className="pl-11 h-12 rounded-xl"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
                  {filteredFoods.slice(0, 8).map(food => (
                    <button
                      key={food.name}
                      onClick={() => handleQuickAdd(food)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-secondary transition-all duration-200 text-left active:scale-[0.98]"
                    >
                      <div>
                        <p className="font-medium text-sm">{food.name}</p>
                        <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{food.calories}</p>
                        <p className="text-xs text-muted-foreground">{food.protein}g</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Or enter manually →
                  </button>
                </div>
              </div>
            )}

            {!showSuggestions && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="meal-name" className="text-sm font-medium">Meal name</Label>
                  <Input
                    id="meal-name"
                    placeholder="e.g., Chicken with rice"
                    value={mealName}
                    onChange={e => setMealName(e.target.value)}
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calories" className="text-sm font-medium">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="500"
                      value={mealCalories}
                      onChange={e => setMealCalories(e.target.value)}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein" className="text-sm font-medium">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="30"
                      value={mealProtein}
                      onChange={e => setMealProtein(e.target.value)}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
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
                  <Button size="lg" className="flex-1" onClick={handleAddMeal}>
                    Log Meal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={setShowPaywall} 
        feature={paywallFeature}
      />

      <BottomNav />
    </div>
  );
}
