import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Dumbbell, Play, ArrowRight, Crown, CheckCircle2, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getUserProfile, 
  getTodayPlannedWorkout, 
  getWorkoutByDate, 
  getTodayDate, 
  DEFAULT_EXERCISES, 
  hasCoachAccess,
  getWorkouts,
  getMeals
} from "@/lib/storage";
import { getSimulatedDate } from "@/lib/debugDate";
import { WorkoutType } from "@/lib/types";
import { cn } from "@/lib/utils";

const WORKOUT_TYPE_INFO: Record<WorkoutType, { label: string; emoji: string; reason: string }> = {
  push: { label: 'Push Day', emoji: '💪', reason: 'Chest, shoulders, and triceps work together in pressing movements.' },
  pull: { label: 'Pull Day', emoji: '🎯', reason: 'Back and biceps work together in pulling movements.' },
  legs: { label: 'Leg Day', emoji: '🦵', reason: 'Strong legs are the foundation for everything else.' },
  'full-body': { label: 'Full Body', emoji: '⚡', reason: 'Efficient training that hits all major muscle groups.' },
  upper: { label: 'Upper Body', emoji: '🏋️', reason: 'Chest, back, shoulders, and arms in one session.' },
  lower: { label: 'Lower Body', emoji: '🦿', reason: 'Quads, hamstrings, and glutes for a strong base.' },
  custom: { label: 'Custom Workout', emoji: '✨', reason: 'Your personalized training session.' },
  rest: { label: 'Rest Day', emoji: '😴', reason: 'Recovery is when your muscles grow.' },
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TodayStatusProps {
  onStartWorkout?: () => void;
}

export function TodayStatus({ onStartWorkout }: TodayStatusProps) {
  const navigate = useNavigate();
  const profile = getUserProfile();
  const todayPlan = getTodayPlannedWorkout();
  const existingWorkout = getWorkoutByDate(getTodayDate());
  const coachActive = hasCoachAccess();
  const dayOfWeek = getSimulatedDate().getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  
  const hasSchedule = profile?.workoutDays?.length || profile?.coachProfile?.workoutDays?.length;
  
  // Calculate weekly progress
  const weeklyStats = useMemo(() => {
    const workouts = getWorkouts();
    const meals = getMeals();
    const today = getSimulatedDate();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays ?? [];
    const trainingDays = profile?.trainingDays ?? profile?.coachProfile?.trainingDays ?? 3;
    
    // Count completed workouts this week
    let completedWorkouts = 0;
    let missedWorkouts = 0;
    
    for (let i = 0; i <= today.getDay(); i++) {
      if (workoutDays.includes(i)) {
        const dateStr = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const workout = workouts.find(w => w.date === dateStr && w.completed);
        if (workout) {
          completedWorkouts++;
        } else if (i < today.getDay()) {
          // Only count as missed if it's a past day
          missedWorkouts++;
        }
      }
    }
    
    // Count days with meals logged this week
    const daysWithMeals = new Set<string>();
    meals.forEach(meal => {
      const mealDate = new Date(meal.date);
      if (mealDate >= startOfWeek && mealDate <= today) {
        daysWithMeals.add(meal.date);
      }
    });
    
    return {
      completedWorkouts,
      missedWorkouts,
      totalWorkoutsThisWeek: trainingDays,
      daysTracked: daysWithMeals.size,
      dayOfWeek: today.getDay() + 1, // 1-7
    };
  }, [profile]);
  
  // If workout already completed today
  if (existingWorkout?.completed) {
    const completedSets = existingWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const totalSets = existingWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    
    return (
      <div className="space-y-3 mb-6 animate-slide-up">
        <div className="bg-card rounded-2xl border border-status-success/30 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-status-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-status-success" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted-foreground">{dayName}</span>
                <span className="text-[10px] font-medium text-status-success bg-status-success/10 px-1.5 py-0.5 rounded-full">Done</span>
              </div>
              <h3 className="font-display font-bold text-lg">{existingWorkout.name}</h3>
              <p className="text-sm text-muted-foreground">
                {completedSets}/{totalSets} sets completed
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
            Great work! Focus on recovery and nutrition for the rest of today.
          </p>
        </div>
        
        <WeeklyProgressBar stats={weeklyStats} />
      </div>
    );
  }
  
  // If no schedule set - free user with no plan
  if (!hasSchedule) {
    return (
      <div className="space-y-3 mb-6 animate-slide-up">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">{dayName}</span>
              <h3 className="font-display font-bold text-lg">Ready to train?</h3>
              <p className="text-sm text-muted-foreground">
                Track your workout whenever you're ready.
              </p>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate('/workout')}
              className="gap-2 shrink-0"
            >
              Start <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Prompt to set up schedule */}
        <div className="bg-card rounded-2xl border border-dashed border-border p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-0.5">Set up your schedule</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Pick which days you want to train so we can track your progress.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>
                Go to Settings <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Rest day
  if (todayPlan?.isRestDay) {
    return (
      <div className="space-y-3 mb-6 animate-slide-up">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Coffee className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {coachActive && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Scheduled rest</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">{dayName}</span>
              <h3 className="font-display font-bold text-lg">Rest Day</h3>
              <p className="text-sm text-muted-foreground">
                Your muscles recover and grow during rest. Take it easy today.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Light walking or stretching is fine.
            </p>
            <button 
              onClick={() => navigate('/workout')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Train anyway →
            </button>
          </div>
        </div>
        
        <WeeklyProgressBar stats={weeklyStats} />
      </div>
    );
  }
  
  // Workout day
  const workoutType = todayPlan?.type || 'full-body';
  const typeInfo = WORKOUT_TYPE_INFO[workoutType];
  const exerciseCount = (DEFAULT_EXERCISES[workoutType as keyof typeof DEFAULT_EXERCISES] || []).length;
  
  return (
    <div className="space-y-3 mb-6 animate-slide-up">
      <div className="bg-card rounded-2xl border border-primary/20 p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-2xl">{typeInfo.emoji}</span>
          </div>
          <div className="flex-1">
            {coachActive && (
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Today's workout</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">{dayName}</span>
            <h3 className="font-display font-bold text-lg">{typeInfo.label}</h3>
            <p className="text-sm text-muted-foreground">
              {exerciseCount} exercises · ~45 min
            </p>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          {typeInfo.reason}
        </p>
        
        <Button 
          size="xl" 
          className="w-full shadow-lg shadow-primary/20 glow-primary"
          onClick={() => navigate('/workout')}
        >
          <Play className="w-5 h-5 mr-2" /> Start Workout
        </Button>
      </div>
      
      <WeeklyProgressBar stats={weeklyStats} />
    </div>
  );
}

// Weekly Progress Bar Component
function WeeklyProgressBar({ stats }: { stats: { completedWorkouts: number; missedWorkouts: number; totalWorkoutsThisWeek: number; daysTracked: number; dayOfWeek: number } }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">This Week</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-secondary/50 rounded-xl">
          <p className={cn(
            "text-lg font-bold",
            stats.completedWorkouts > 0 ? "text-primary" : "text-muted-foreground"
          )}>
            {stats.completedWorkouts}/{stats.totalWorkoutsThisWeek}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Workouts</p>
        </div>
        
        <div className="text-center p-2 bg-secondary/50 rounded-xl">
          <p className={cn(
            "text-lg font-bold",
            stats.daysTracked > 0 ? "text-nutrition-calories" : "text-muted-foreground"
          )}>
            {stats.daysTracked}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Tracked</p>
        </div>
        
        <div className="text-center p-2 bg-secondary/50 rounded-xl">
          <p className="text-lg font-bold text-muted-foreground">
            Day {stats.dayOfWeek}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">of Week</p>
        </div>
      </div>
      
      {stats.missedWorkouts > 0 && (
        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/60">
          {stats.missedWorkouts} scheduled workout{stats.missedWorkouts > 1 ? 's' : ''} missed this week — that's okay, just keep going.
        </p>
      )}
    </div>
  );
}