import { Info, Crown } from "lucide-react";
import { getUserProfile, getTodayPlannedWorkout } from "@/lib/storage";
import { usePremiumGate } from "@/components/PremiumPaywall";

interface NutritionGuidanceProps {
  targets: { calories: number; protein: number };
}

export function NutritionGuidance({ targets }: NutritionGuidanceProps) {
  const profile = getUserProfile();
  const coachProfile = profile?.coachProfile;
  const todayPlan = getTodayPlannedWorkout();
  const { isPremium } = usePremiumGate();
  
  const isRestDay = todayPlan?.isRestDay;
  const goal = coachProfile?.goal;
  
  // Generate contextual guidance based on goal
  const getCalorieReason = () => {
    if (!goal) {
      return "This target supports steady energy and recovery.";
    }
    
    switch (goal) {
      case 'weight-loss':
        return "This moderate deficit helps you lose fat while preserving muscle.";
      case 'muscle-gain':
        return "This slight surplus supports muscle growth without excess fat gain.";
      case 'leaner':
        return "This balanced target helps you get leaner while maintaining strength.";
      case 'healthier':
      default:
        return "This target supports your daily activity and overall health.";
    }
  };
  
  const getProteinReason = () => {
    const proteinPerKg = coachProfile?.weight 
      ? Math.round(targets.protein / coachProfile.weight * 10) / 10
      : null;
    
    if (proteinPerKg) {
      return `${proteinPerKg}g per kg of body weight supports muscle maintenance and recovery.`;
    }
    return "Adequate protein helps preserve muscle and keeps you feeling full.";
  };
  
  const getDayGuidance = () => {
    if (isRestDay) {
      return "Rest day: Focus on protein and recovery. You may feel less hungry—that's normal.";
    }
    return "Training day: Fuel up before and after your workout for best results.";
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4 text-info" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{getDayGuidance()}</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><span className="font-medium text-foreground">{targets.calories} cal:</span> {getCalorieReason()}</p>
            <p><span className="font-medium text-foreground">{targets.protein}g protein:</span> {getProteinReason()}</p>
          </div>
        </div>
      </div>
      
      {!isPremium() && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Premium members receive weekly adjustments based on progress.</span>
        </div>
      )}
    </div>
  );
}
