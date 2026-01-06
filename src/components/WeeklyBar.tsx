import { useMemo } from "react";
import { Dumbbell, Coffee } from "lucide-react";
import { getUserProfile, getWorkoutByDate } from "@/lib/storage";
import { cn } from "@/lib/utils";

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayInfo {
  dayOfWeek: number;
  label: string;
  name: string;
  isToday: boolean;
  isWorkoutDay: boolean;
  isCompleted: boolean;
  date: string;
}

export function WeeklyBar() {
  const profile = getUserProfile();
  const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays ?? [];
  
  const weekDays = useMemo(() => {
    const today = new Date();
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
        name: DAY_NAMES[i],
        isToday: i === todayDayOfWeek,
        isWorkoutDay: workoutDays.includes(i),
        isCompleted: workout?.completed ?? false,
        date: dateStr,
      });
    }
    
    return days;
  }, [workoutDays]);
  
  const workoutCount = workoutDays.length;
  const restCount = 7 - workoutCount;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 mb-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">This Week</p>
        <p className="text-xs text-muted-foreground">
          {workoutCount} training · {restCount} rest
        </p>
      </div>
      
      <div className="flex justify-between gap-1">
        {weekDays.map((day) => (
          <div
            key={day.dayOfWeek}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all",
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
              day.isWorkoutDay 
                ? day.isCompleted 
                  ? "bg-success text-success-foreground" 
                  : "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground/60"
            )}>
              {day.isWorkoutDay ? (
                <Dumbbell className="w-3.5 h-3.5" />
              ) : (
                <Coffee className="w-3.5 h-3.5" />
              )}
            </div>
            
            {day.isToday && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
