import { useMemo } from "react";
import { Dumbbell, Coffee, Check } from "lucide-react";
import { getUserProfile, getWorkoutByDate } from "@/lib/storage";
import { getSimulatedDate } from "@/lib/debugDate";
import { cn } from "@/lib/utils";

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayInfo {
  dayOfWeek: number;
  label: string;
  isToday: boolean;
  isPast: boolean;
  isWorkoutDay: boolean;
  isCompleted: boolean;
  date: string;
}

export function WeeklyBar() {
  const profile = getUserProfile();
  const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays ?? [];
  
  const weekDays = useMemo(() => {
    const today = getSimulatedDate();
    const todayDayOfWeek = today.getDay();

    // Get the start of the current week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - todayDayOfWeek);
    
    const days: DayInfo[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const workout = getWorkoutByDate(dateStr);
      
      days.push({
        dayOfWeek: i,
        label: DAY_LABELS[i],
        isToday: i === todayDayOfWeek,
        isPast: i < todayDayOfWeek,
        isWorkoutDay: workoutDays.includes(i),
        isCompleted: workout?.completed ?? false,
        date: dateStr,
      });
    }
    
    return days;
  }, [workoutDays]);
  
  const completedCount = weekDays.filter(d => d.isCompleted).length;
  const scheduledCount = workoutDays.length;

  return (
    <div className="bg-card/70 rounded-2xl border border-border/40 p-4 mb-6 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">This Week</p>
        <p className="text-xs text-muted-foreground">
          {completedCount}/{scheduledCount} workouts
        </p>
      </div>
      
      <div className="flex justify-between gap-1">
        {weekDays.map((day) => {
          // Determine the state of each day
          const showCompleted = day.isCompleted;
          const showMissed = day.isPast && day.isWorkoutDay && !day.isCompleted && !day.isToday;
          const showScheduled = day.isWorkoutDay && !day.isCompleted && !showMissed;
          const showRest = !day.isWorkoutDay;
          
          return (
            <div
              key={day.dayOfWeek}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-2 px-0.5 rounded-xl transition-all",
                day.isToday && "bg-primary/10 ring-2 ring-primary/30"
              )}
            >
              <span className={cn(
                "text-xs font-medium",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.label}
              </span>
              
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                showCompleted && "bg-success text-success-foreground",
                showMissed && "bg-destructive/15 text-destructive",
                showScheduled && "bg-primary/15 text-primary",
                showRest && "bg-secondary text-muted-foreground/50"
              )}>
                {showCompleted ? (
                  <Check className="w-4 h-4" />
                ) : showScheduled || showMissed ? (
                  <Dumbbell className="w-3.5 h-3.5" />
                ) : (
                  <Coffee className="w-3.5 h-3.5" />
                )}
              </div>
              
              {day.isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}