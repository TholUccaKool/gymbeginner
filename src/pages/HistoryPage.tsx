import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Utensils, TrendingUp, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { getMeals, getWorkouts, getUserProfile } from "@/lib/storage";
import { workoutHasPR } from "@/lib/personalBests";
import { format, subDays, addDays, isSameDay } from "date-fns";

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

  const caloriePercent = Math.min((dayTotals.calories / targets.calories) * 100, 100);
  const proteinPercent = Math.min((dayTotals.protein / targets.protein) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-24 gradient-mesh">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader title="History" subtitle="Track your progress" />

        {/* Week Overview */}
        <div className="flex justify-between gap-1.5 mb-8">
          {weekDays.map(({ date, hasWorkout, hasMeals }, index) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-3 rounded-2xl transition-all duration-300 animate-slide-up ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-card border border-border/60 hover:border-primary/40 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <p className={`text-[10px] uppercase tracking-wide ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
                  {format(date, 'EEE')}
                </p>
                <p className="font-display font-bold text-lg">{format(date, 'd')}</p>
                <div className="flex justify-center gap-1.5 mt-1.5 h-2">
                  {hasWorkout && (
                    <div className={`w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  )}
                  {hasMeals && (
                    <div className={`w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-primary-foreground/70' : 'bg-nutrition-calories'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6 bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
          <button 
            onClick={() => navigateDay('prev')}
            className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-200 active:scale-95"
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
            className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-200 active:scale-95 disabled:opacity-30"
            disabled={isToday}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {isFuture ? (
          <div className="text-center py-16 text-muted-foreground animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="font-medium">No data for future dates</p>
            <p className="text-sm mt-1">Check back later!</p>
          </div>
        ) : (
          <>
            {/* Day Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm interactive-card animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-nutrition-calories/10 flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-nutrition-calories" />
                  </div>
                  <span className="text-sm font-medium">Nutrition</span>
                </div>
                <p className="text-3xl font-display font-bold">{dayTotals.calories}</p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-nutrition-calories rounded-full transition-all duration-500"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  / {targets.calories} calories
                </p>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-sm">
                    <span className="font-semibold text-nutrition-protein">{dayTotals.protein}g</span>
                    <span className="text-muted-foreground"> / {targets.protein}g protein</span>
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm interactive-card animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Workout</span>
                </div>
                {dayWorkout ? (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-display font-bold">{dayWorkout.name}</p>
                      {dayWorkout.completed && workoutHasPR(dayWorkout) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wide">
                          <Trophy className="w-3 h-3" />
                          PR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dayWorkout.completed ? (
                        <span className="text-status-success font-medium">Completed</span>
                      ) : (
                        'In progress'
                      )}
                    </p>
                    <p className="text-sm mt-3 pt-3 border-t border-border/50">
                      <span className="font-semibold">{dayWorkout.exercises.length}</span>
                      <span className="text-muted-foreground"> exercises</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-display font-medium text-muted-foreground">Rest Day</p>
                    <p className="text-xs text-muted-foreground mt-1">No workout logged</p>
                    <p className="text-sm mt-3 pt-3 border-t border-border/50 text-muted-foreground">
                      Recovery is key
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Meals List */}
            {dayMeals.length > 0 && (
              <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider mb-3 px-1">
                  Meals
                </h3>
                <div className="space-y-2">
                  {dayMeals.map((meal, index) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${(index + 3) * 40}ms` }}
                    >
                      <span className="font-medium">{meal.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{meal.calories} cal</span>
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
              <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider mb-3 px-1">
                  Workout Details
                </h3>
                <div className="space-y-2">
                  {dayWorkout.exercises.map((ex, index) => (
                    <div
                      key={ex.id}
                      className="p-4 bg-card rounded-xl border border-border/60 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{ex.exercise.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {ex.sets.map((set, i) => (
                          <span
                            key={set.id}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              set.completed 
                                ? 'bg-primary-muted text-primary' 
                                : 'bg-secondary text-muted-foreground'
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
              <div className="text-center py-16 text-muted-foreground animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <p className="font-medium">No activity logged</p>
                <p className="text-sm mt-1">This day is still empty</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}