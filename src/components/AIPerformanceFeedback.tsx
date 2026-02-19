import { useMemo } from "react";
import { Brain, Dumbbell, Flame, TrendingUp, Award } from "lucide-react";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { getWorkouts, getMeals, getUserProfile, getCoachMemory, getExerciseHistory } from "@/lib/storage";
import { getSimulatedDate } from "@/lib/debugDate";

interface AIPerformanceFeedbackProps {
  onUpgrade?: () => void;
}

interface WeeklyInsight {
  title: string;
  body: string;
  type: 'strength' | 'nutrition' | 'consistency' | 'achievement';
}

function generateWeeklyInsights(): WeeklyInsight[] {
  const profile = getUserProfile();
  const workouts = getWorkouts();
  const meals = getMeals();
  const exerciseHistory = getExerciseHistory();
  const memory = getCoachMemory();
  const today = getSimulatedDate();

  // Get this week's data
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const thisWeekWorkouts = workouts.filter(w => w.date >= weekStartStr && w.completed);
  const thisWeekMeals = meals.filter(m => m.date >= weekStartStr);

  const insights: WeeklyInsight[] = [];

  // Workout volume analysis
  if (thisWeekWorkouts.length > 0) {
    const totalSets = thisWeekWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0), 0
    );
    const totalWeight = thisWeekWorkouts.reduce(
      (acc, w) => acc + w.exercises.reduce(
        (a, e) => a + e.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0), 0
      ), 0
    );

    insights.push({
      title: `${totalSets} sets completed`,
      body: totalWeight > 0 
        ? `You moved ${Math.round(totalWeight).toLocaleString()}kg total volume this week. ${totalSets >= 15 ? 'Great training density!' : 'Try to add a few more sets next week.'}`
        : `${thisWeekWorkouts.length} workout${thisWeekWorkouts.length > 1 ? 's' : ''} done so far. Keep it up!`,
      type: 'strength',
    });
  }

  // Nutrition consistency
  if (thisWeekMeals.length > 0) {
    const targets = profile?.nutritionTargets ?? { calories: 2000, protein: 150 };
    const daysTracked = new Set(thisWeekMeals.map(m => m.date)).size;
    const avgCalories = Math.round(
      thisWeekMeals.reduce((sum, m) => sum + m.calories, 0) / Math.max(daysTracked, 1)
    );
    const calorieDiff = avgCalories - targets.calories;

    insights.push({
      title: `Avg ${avgCalories} cal/day`,
      body: Math.abs(calorieDiff) < 100 
        ? `Right on target! You tracked ${daysTracked} day${daysTracked > 1 ? 's' : ''} this week.`
        : calorieDiff > 0
          ? `About ${calorieDiff} cal over target on average. Small adjustments can help.`
          : `About ${Math.abs(calorieDiff)} cal under target. Make sure you're fueling your workouts.`,
      type: 'nutrition',
    });
  }

  // Progress detection from exercise history
  const historyEntries = Object.values(exerciseHistory);
  const recentPRs = historyEntries.filter(h => {
    const lastUsed = new Date(h.lastUsedAt);
    return lastUsed >= weekStart && h.allSetsCompleted && h.suggestedWeight > h.lastWeight;
  });

  if (recentPRs.length > 0) {
    insights.push({
      title: `${recentPRs.length} exercise${recentPRs.length > 1 ? 's' : ''} progressed`,
      body: `You're ready to increase weight on ${recentPRs.slice(0, 2).map(p => p.exerciseName).join(' and ')}. Progressive overload is working.`,
      type: 'achievement',
    });
  }

  // Streak/consistency
  if (memory) {
    const streak = memory.currentWorkoutStreak;
    if (streak >= 3) {
      insights.push({
        title: `${streak} workout streak`,
        body: 'Consistency is the #1 predictor of results. You\'re building a strong habit.',
        type: 'consistency',
      });
    }
  }

  // Fallback if no insights
  if (insights.length === 0) {
    insights.push({
      title: 'Getting started',
      body: 'Complete a workout and log some meals this week to get personalized insights.',
      type: 'consistency',
    });
  }

  return insights;
}

const INSIGHT_ICONS = {
  strength: Dumbbell,
  nutrition: Flame,
  consistency: TrendingUp,
  achievement: Award,
};

const INSIGHT_COLORS = {
  strength: 'text-primary bg-primary/10',
  nutrition: 'text-nutrition-calories bg-nutrition-calories/10',
  consistency: 'text-accent bg-accent/10',
  achievement: 'text-amber-500 bg-amber-500/10',
};

export function AIPerformanceFeedback({ onUpgrade }: AIPerformanceFeedbackProps) {
  const insights = useMemo(generateWeeklyInsights, []);

  const content = (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">AI Performance Feedback</h3>
          <p className="text-[10px] text-muted-foreground">This week's training insights</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = INSIGHT_ICONS[insight.type];
          const colorClass = INSIGHT_COLORS[insight.type];
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary/40 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mb-4 animate-slide-up">
      <ProFeatureGate
        featureId="ai_performance_feedback"
        lockedPreview={content}
        onUpgrade={onUpgrade}
      >
        {content}
      </ProFeatureGate>
    </div>
  );
}
