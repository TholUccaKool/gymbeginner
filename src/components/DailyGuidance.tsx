import { MessageSquare, Crown, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { getUserProfile, getTodayPlannedWorkout, getWorkoutByDate, getTodayDate, hasCoachAccess, getDaysLeftInTrial } from "@/lib/storage";
import { usePremiumGate } from "@/components/PremiumPaywall";

interface DailyGuidanceProps {
  onShowPaywall?: () => void;
}

export function DailyGuidance({ onShowPaywall }: DailyGuidanceProps) {
  const profile = getUserProfile();
  const coachProfile = profile?.coachProfile;
  const todayPlan = getTodayPlannedWorkout();
  const existingWorkout = getWorkoutByDate(getTodayDate());
  const { isPremium } = usePremiumGate();
  
  const hasAccess = hasCoachAccess();
  const daysLeft = getDaysLeftInTrial();
  const isRestDay = todayPlan?.isRestDay;
  const workoutComplete = existingWorkout?.completed;
  const goal = coachProfile?.goal;
  
  // Generate today's focus message
  const getTodayFocus = (): string => {
    if (workoutComplete) {
      return "Your workout is done. Focus on recovery and hitting your protein target.";
    }
    
    if (isRestDay) {
      switch (goal) {
        case 'weight-loss':
        case 'leaner':
          return "Rest day. You might feel less hungry—listen to your body but stay close to your targets.";
        case 'muscle-gain':
          return "Rest day. Your muscles are recovering and growing. Protein is especially important today.";
        default:
          return "Rest day. Take it easy and let your body recover. Light movement is fine.";
      }
    }
    
    // Training day
    switch (goal) {
      case 'weight-loss':
      case 'leaner':
        return "Training day. Fuel your workout with carbs beforehand, and prioritize protein after.";
      case 'muscle-gain':
        return "Training day. Push hard today—this is when progress happens. Eat well to support your workout.";
      default:
        return "Training day. Give your workout your best effort, then refuel with good nutrition.";
    }
  };
  
  // What happens if user skips or trains anyway
  const getConsequenceMessage = (): string => {
    if (workoutComplete) {
      return "Tomorrow is a new day. Rest well tonight.";
    }
    
    if (isRestDay) {
      return "Want to train anyway? That's fine—just don't overdo it. Recovery matters.";
    }
    
    return "If you skip today, try to make it up soon. Consistency beats perfection.";
  };
  
  // Why this day exists
  const getDayReason = (): string => {
    if (isRestDay) {
      return "Rest days let your body repair and grow stronger. They're not wasted days—they're essential.";
    }
    
    const workoutType = todayPlan?.type;
    switch (workoutType) {
      case 'push':
        return "Push day targets chest, shoulders, and triceps. These muscles work together in pressing movements.";
      case 'pull':
        return "Pull day targets back and biceps. These muscles work together in pulling movements.";
      case 'legs':
        return "Leg day builds your foundation. Strong legs support everything else.";
      case 'full-body':
        return "Full-body training hits everything at once—efficient and effective.";
      case 'upper':
        return "Upper body day hits chest, back, shoulders, and arms in one session.";
      case 'lower':
        return "Lower body day focuses on quads, hamstrings, and glutes.";
      default:
        return "Today's workout is designed to fit your schedule and goals.";
    }
  };
  
  // Trial banner
  if (!isPremium() && hasAccess && daysLeft > 0 && daysLeft <= 7) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">{getTodayFocus()}</p>
            <p className="text-xs text-muted-foreground">{getDayReason()}</p>
            <p className="text-xs text-muted-foreground italic">{getConsequenceMessage()}</p>
            
            <div className="flex items-center gap-2 pt-2 border-t border-border/60 mt-3">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your coaching trial
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Trial expired - show static message
  if (!hasAccess && profile?.coachTrialStart) {
    return (
      <div className="bg-secondary/50 border border-border/60 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Your trial has ended</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your targets are now static. You can still track everything normally.
            </p>
            
            <button 
              onClick={onShowPaywall}
              className="flex items-center gap-2 mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              Continue receiving weekly adjustments and coaching →
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Premium or active trial - full guidance
  if (hasAccess) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">{getTodayFocus()}</p>
            <p className="text-xs text-muted-foreground">{getDayReason()}</p>
            <p className="text-xs text-muted-foreground italic">{getConsequenceMessage()}</p>
          </div>
        </div>
        
        {isPremium() && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Your coach reviews your progress every week and adjusts targets as needed.</span>
          </div>
        )}
      </div>
    );
  }
  
  // No coach access and no trial started - show basic message
  return (
    <div className="bg-secondary/50 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isRestDay ? "Rest day" : "Training day"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isRestDay 
              ? "Take it easy and recover."
              : "Time to put in the work."}
          </p>
        </div>
      </div>
    </div>
  );
}