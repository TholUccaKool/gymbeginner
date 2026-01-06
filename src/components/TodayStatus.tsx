import { Coffee, Dumbbell, Play, ArrowRight, Crown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserProfile, getTodayPlannedWorkout, getWorkoutByDate, getTodayDate, DEFAULT_EXERCISES, hasCoachAccess } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { WorkoutType } from "@/lib/types";

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

interface TodayStatusProps {
  onStartWorkout?: () => void;
}

export function TodayStatus({ onStartWorkout }: TodayStatusProps) {
  const navigate = useNavigate();
  const profile = getUserProfile();
  const todayPlan = getTodayPlannedWorkout();
  const existingWorkout = getWorkoutByDate(getTodayDate());
  const coachActive = hasCoachAccess();
  
  const hasSchedule = profile?.workoutDays?.length || profile?.coachProfile?.workoutDays?.length;
  
  // If workout already completed today
  if (existingWorkout?.completed) {
    const completedSets = existingWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const totalSets = existingWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    
    return (
      <div className="bg-card rounded-2xl border border-success/30 p-5 mb-6 shadow-sm animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display font-bold text-lg">{existingWorkout.name}</h3>
              <span className="text-xs text-success font-medium">Done</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {completedSets}/{totalSets} sets completed
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
          Great work! Focus on recovery and nutrition for the rest of today.
        </p>
      </div>
    );
  }
  
  // If no schedule set - free user with no plan
  if (!hasSchedule) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 mb-6 shadow-sm animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Dumbbell className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="flex-1">
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
    );
  }
  
  // Rest day
  if (todayPlan?.isRestDay) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 mb-6 shadow-sm animate-slide-up">
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
    );
  }
  
  // Workout day
  const workoutType = todayPlan?.type || 'full-body';
  const typeInfo = WORKOUT_TYPE_INFO[workoutType];
  const exerciseCount = (DEFAULT_EXERCISES[workoutType as keyof typeof DEFAULT_EXERCISES] || []).length;
  
  return (
    <div className="bg-card rounded-2xl border border-primary/20 p-5 mb-6 shadow-sm animate-slide-up">
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
  );
}