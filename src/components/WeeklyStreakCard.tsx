import { useMemo } from "react";
import { Flame, Zap, Trophy } from "lucide-react";
import { getWorkouts, getUserProfile } from "@/lib/storage";
import { getSimulatedDate } from "@/lib/debugDate";
import { cn } from "@/lib/utils";

/**
 * Calculates weekly streak: how many consecutive weeks the user
 * completed at least 1 workout (going backwards from this week).
 */
function calculateWeeklyStreak(): { current: number; best: number; thisWeekDone: boolean } {
  const workouts = getWorkouts().filter(w => w.completed);
  if (workouts.length === 0) return { current: 0, best: 0, thisWeekDone: false };

  const today = getSimulatedDate();
  
  // Get start of current week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Build a set of week-start dates that have at least one completed workout
  const weeksWithWorkouts = new Set<string>();
  workouts.forEach(w => {
    const workoutDate = new Date(w.date + 'T12:00:00');
    const weekStart = getWeekStart(workoutDate);
    weeksWithWorkouts.add(weekStart.toISOString().split('T')[0]);
  });

  const currentWeekStart = getWeekStart(today);
  const thisWeekDone = weeksWithWorkouts.has(currentWeekStart.toISOString().split('T')[0]);

  // Count streak going backwards
  let streak = 0;
  let checkWeek = new Date(currentWeekStart);

  // If current week has no workout yet, start checking from last week
  if (!thisWeekDone) {
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  while (weeksWithWorkouts.has(checkWeek.toISOString().split('T')[0])) {
    streak++;
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  // Add current week if it has a workout
  if (thisWeekDone) streak++;

  // Calculate best streak by scanning all weeks
  const sortedWeeks = Array.from(weeksWithWorkouts).sort();
  let best = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedWeeks.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedWeeks[i - 1]);
      const curr = new Date(sortedWeeks[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      tempStreak = diffDays === 7 ? tempStreak + 1 : 1;
    }
    best = Math.max(best, tempStreak);
  }

  return { current: streak, best: Math.max(best, streak), thisWeekDone };
}

export function WeeklyStreakCard() {
  const { current, best, thisWeekDone } = useMemo(calculateWeeklyStreak, []);

  if (current === 0 && !thisWeekDone) {
    return null; // Don't show if no streak and no workout this week
  }

  const milestones = [2, 4, 8, 12, 24, 52];
  const nextMilestone = milestones.find(m => m > current) ?? current + 4;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 mb-4 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            current >= 4 
              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-md" 
              : "bg-primary/10"
          )}>
            {current >= 8 ? (
              <Trophy className={cn("w-5 h-5", current >= 4 ? "text-white" : "text-primary")} />
            ) : (
              <Flame className={cn("w-5 h-5", current >= 4 ? "text-white" : "text-primary")} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl">{current}</span>
              <span className="text-sm font-medium text-muted-foreground">week streak</span>
              {current >= 4 && <Zap className="w-3.5 h-3.5 text-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {thisWeekDone 
                ? "On fire this week! Keep going." 
                : "Complete a workout to continue your streak."}
            </p>
          </div>
        </div>
        
        {best > current && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</p>
            <p className="font-display font-bold text-lg text-muted-foreground">{best}</p>
          </div>
        )}
      </div>

      {/* Progress toward next milestone */}
      {current > 0 && current < nextMilestone && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{nextMilestone - current} weeks to {nextMilestone}-week milestone</span>
            <span>{Math.round((current / nextMilestone) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(current / nextMilestone) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
