import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Utensils } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getMeals, getWorkouts, getUserProfile } from "@/lib/storage";
import { format, subDays, addDays, startOfDay, isSameDay } from "date-fns";

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const profile = getUserProfile();
  const targets = profile?.nutritionTargets ?? { calories: 2000, protein: 150 };

  const allMeals = getMeals();
  const allWorkouts = getWorkouts();

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  
  const dayMeals = useMemo(() => 
    allMeals.filter(m => m.date === dateString),
    [allMeals, dateString]
  );

  const dayWorkout = useMemo(() => 
    allWorkouts.find(w => w.date === dateString),
    [allWorkouts, dateString]
  );

  const dayTotals = useMemo(() => 
    dayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + (meal.protein ?? 0),
      }),
      { calories: 0, protein: 0 }
    ),
    [dayMeals]
  );

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)
    );
  };

  const isToday = isSameDay(selectedDate, new Date());
  const isFuture = selectedDate > new Date();

  // Generate week view
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasWorkout = allWorkouts.some(w => w.date === dateStr && w.completed);
      const hasMeals = allMeals.some(m => m.date === dateStr);
      days.push({ date, hasWorkout, hasMeals });
    }
    return days;
  }, [allMeals, allWorkouts]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader title="History" />

        {/* Week Overview */}
        <div className="flex justify-between gap-1 mb-6">
          {weekDays.map(({ date, hasWorkout, hasMeals }) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border hover:border-primary/50'
                }`}
              >
                <p className="text-xs opacity-70">{format(date, 'EEE')}</p>
                <p className="font-bold">{format(date, 'd')}</p>
                <div className="flex justify-center gap-1 mt-1">
                  {hasWorkout && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  )}
                  {hasMeals && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-nutrition-calories'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigateDay('prev')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="font-display font-bold text-lg">
              {isToday ? 'Today' : format(selectedDate, 'EEEE')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>

          <button 
            onClick={() => navigateDay('next')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            disabled={isToday}
          >
            <ChevronRight className={`w-5 h-5 ${isToday ? 'opacity-30' : ''}`} />
          </button>
        </div>

        {isFuture ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data for future dates</p>
          </div>
        ) : (
          <>
            {/* Day Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-nutrition-calories mb-2">
                  <Utensils className="w-4 h-4" />
                  <span className="text-sm font-medium">Nutrition</span>
                </div>
                <p className="text-2xl font-display font-bold">{dayTotals.calories}</p>
                <p className="text-xs text-muted-foreground">
                  / {targets.calories} calories
                </p>
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">{dayTotals.protein}g</span>
                    <span className="text-muted-foreground"> / {targets.protein}g protein</span>
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Dumbbell className="w-4 h-4" />
                  <span className="text-sm font-medium">Workout</span>
                </div>
                {dayWorkout ? (
                  <>
                    <p className="text-2xl font-display font-bold">{dayWorkout.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayWorkout.completed ? 'Completed' : 'In progress'}
                    </p>
                    <p className="text-sm mt-2">
                      {dayWorkout.exercises.length} exercises
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-display font-medium text-muted-foreground">Rest</p>
                    <p className="text-xs text-muted-foreground">No workout logged</p>
                  </>
                )}
              </div>
            </div>

            {/* Meals List */}
            {dayMeals.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide mb-3">
                  Meals
                </h3>
                <div className="space-y-2">
                  {dayMeals.map(meal => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border"
                    >
                      <span className="font-medium">{meal.name}</span>
                      <div className="text-right">
                        <span className="text-sm">{meal.calories} cal</span>
                        {meal.protein && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {meal.protein}g
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workout Details */}
            {dayWorkout && (
              <div>
                <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide mb-3">
                  Workout Details
                </h3>
                <div className="space-y-2">
                  {dayWorkout.exercises.map(ex => (
                    <div
                      key={ex.id}
                      className="p-3 bg-card rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ex.exercise.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {ex.sets.map((set, i) => (
                          <span
                            key={set.id}
                            className={`text-xs px-2 py-1 rounded ${
                              set.completed 
                                ? 'bg-primary-muted text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {set.reps}×{set.weight}kg
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dayMeals.length === 0 && !dayWorkout && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activity logged for this day</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
