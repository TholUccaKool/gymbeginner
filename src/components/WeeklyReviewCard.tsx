import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, X, Crown, Dumbbell, Flame, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  shouldShowWeeklyReview, 
  generateWeeklyReview, 
  getLatestWeeklyReview,
  hasCoachAccess,
  getUserProfile
} from "@/lib/storage";
import { WeeklyReview } from "@/lib/types";

interface WeeklyReviewCardProps {
  onDismiss?: () => void;
  onShowPaywall?: () => void;
}

export function WeeklyReviewCard({ onDismiss, onShowPaywall }: WeeklyReviewCardProps) {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (!hasCoachAccess()) return;
    
    if (shouldShowWeeklyReview()) {
      const newReview = generateWeeklyReview();
      setReview(newReview);
    } else {
      // Show most recent review if it's from the last 24 hours
      const latest = getLatestWeeklyReview();
      if (latest) {
        const reviewDate = new Date(latest.createdAt);
        const now = new Date();
        const hoursSinceReview = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceReview < 24) {
          setReview(latest);
        }
      }
    }
  }, []);
  
  if (dismissed || !review) return null;
  
  const profile = getUserProfile();
  const isPremium = profile?.isPremium;
  
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  
  const getAdjustmentIcon = () => {
    if (review.adjustmentType === 'none') {
      return <Minus className="w-4 h-4" />;
    }
    if (review.newCalories && review.previousCalories) {
      return review.newCalories > review.previousCalories 
        ? <TrendingUp className="w-4 h-4 text-green-500" />
        : <TrendingDown className="w-4 h-4 text-amber-500" />;
    }
    return <Minus className="w-4 h-4" />;
  };
  
  const completionRate = review.workoutsScheduled > 0 
    ? Math.round((review.workoutsCompleted / review.workoutsScheduled) * 100) 
    : 0;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-5 mb-6 shadow-sm animate-scale-in relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors z-10"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            {getAdjustmentIcon()}
          </div>
          <div>
            <h3 className="font-display font-bold">Weekly Review</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(review.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(review.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold">{review.workoutsCompleted}/{review.workoutsScheduled}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workouts</p>
          </div>
          
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-nutrition-calories" />
            </div>
            <p className="text-lg font-bold">{review.calorieConsistency}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cal target</p>
          </div>
          
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Beef className="w-3.5 h-3.5 text-nutrition-protein" />
            </div>
            <p className="text-lg font-bold">{review.proteinConsistency}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein</p>
          </div>
        </div>
        
        {/* Summary */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium">{review.summary}</p>
          <p className="text-sm text-muted-foreground">{review.recommendation}</p>
        </div>
        
        {/* Adjustment notice */}
        {review.adjustmentType !== 'none' && isPremium && (
          <div className="bg-primary/10 rounded-xl p-3 mb-4">
            <p className="text-sm font-medium flex items-center gap-2">
              {getAdjustmentIcon()}
              {review.newCalories && review.previousCalories && (
                <span>
                  Calories adjusted: {review.previousCalories} → {review.newCalories}
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Premium upsell for non-premium users */}
        {!isPremium && review.adjustmentType !== 'none' && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Your coach recommends a change
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Premium members receive automatic adjustments based on their progress.
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={onShowPaywall}
            >
              Continue with coaching →
            </Button>
          </div>
        )}
        
        {/* Done button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2"
          onClick={handleDismiss}
        >
          Got it
        </Button>
      </div>
    </div>
  );
}