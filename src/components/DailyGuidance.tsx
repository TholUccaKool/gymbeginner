import { MessageSquare, Crown, Calendar, TrendingUp, Lightbulb } from "lucide-react";
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
  
  // Generate today's focus message - calm and encouraging
  const getTodayFocus = (): string => {
    if (workoutComplete) {
      return "You've done the work. Now let your body recover.";
    }
    
    if (isRestDay) {
      switch (goal) {
        case 'weight-loss':
        case 'leaner':
          return "Rest day. Stay active with a light walk if you feel like it.";
        case 'muscle-gain':
          return "Rest day. Your muscles are recovering and growing right now.";
        default:
          return "Rest day. Take it easy and let your body recharge.";
      }
    }
    
    // Training day
    switch (goal) {
      case 'weight-loss':
      case 'leaner':
        return "Training day. Move your body, feel good, get stronger.";
      case 'muscle-gain':
        return "Training day. Push yourself—this is where progress happens.";
      default:
        return "Training day. Show up, put in the work, and trust the process.";
    }
  };
  
  // Gentle suggestion, not a warning
  const getTip = (): string => {
    if (workoutComplete) {
      return "Prioritize protein and sleep tonight.";
    }
    
    if (isRestDay) {
      return "Light stretching or a short walk can help recovery.";
    }
    
    return "Warm up properly and focus on form over weight.";
  };
  
  // Trial banner with days remaining
  if (!isPremium() && hasAccess && daysLeft > 0 && daysLeft <= 7) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">{getTodayFocus()}</p>
            <p className="text-xs text-muted-foreground">{getTip()}</p>
            
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/40">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your free trial
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Trial expired - gentle nudge, not restriction
  if (!hasAccess && profile?.coachTrialStart) {
    return (
      <div className="bg-secondary/50 border border-border/60 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Your plan is now fixed</p>
            <p className="text-xs text-muted-foreground">
              You can still track everything. Your targets just won't adjust automatically.
            </p>
            
            <button 
              onClick={onShowPaywall}
              className="flex items-center gap-2 mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              Get ongoing coaching and adjustments →
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Premium or active trial - show guidance
  if (hasAccess) {
    return (
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">{getTodayFocus()}</p>
            <p className="text-xs text-muted-foreground">{getTip()}</p>
          </div>
        </div>
        
        {isPremium() && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Your targets adjust based on your progress each week.</span>
          </div>
        )}
      </div>
    );
  }
  
  // No coach access and no trial - simple, helpful message
  return (
    <div className="bg-secondary/30 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {isRestDay ? "Rest day" : "Training day"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRestDay 
              ? "Take it easy. Recovery is part of the process."
              : "Ready when you are. Consistency is what matters most."}
          </p>
        </div>
      </div>
    </div>
  );
}