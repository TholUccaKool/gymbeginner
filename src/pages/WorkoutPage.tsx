import { useState, useMemo } from "react";
import { Check, Plus, Minus, Coffee, Dumbbell, Calendar, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  getWorkoutByDate, 
  saveWorkout, 
  getTodayDate, 
  generateId,
  DEFAULT_EXERCISES,
  getUserProfile,
  getTodayPlannedWorkout
} from "@/lib/storage";
import { Workout, WorkoutType, WorkoutExercise } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES: { id: WorkoutType; label: string; emoji: string }[] = [
  { id: 'push', label: 'Push', emoji: '💪' },
  { id: 'pull', label: 'Pull', emoji: '🎯' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
  { id: 'full-body', label: 'Full Body', emoji: '⚡' },
  { id: 'upper', label: 'Upper Body', emoji: '🏋️' },
  { id: 'lower', label: 'Lower Body', emoji: '🦿' },
  { id: 'rest', label: 'Rest Day', emoji: '😴' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutPage() {
  const [workout, setWorkout] = useState<Workout | null>(() => getWorkoutByDate(getTodayDate()));
  const [isActive, setIsActive] = useState(false);
  
  const profile = getUserProfile();
  const isCoachUser = profile?.experienceLevel === 'new' && profile?.coachProfile;
  const todayPlan = getTodayPlannedWorkout();
  const dayName = DAY_NAMES[new Date().getDay()];

  const completedSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    );
  }, [workout]);

  const totalSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [workout]);

  const getExercisesForType = (type: WorkoutType) => {
    if (type === 'upper') {
      return [...(DEFAULT_EXERCISES.push || []), ...(DEFAULT_EXERCISES.pull || []).slice(0, 2)];
    }
    if (type === 'lower') {
      return DEFAULT_EXERCISES.legs || [];
    }
    return DEFAULT_EXERCISES[type as keyof typeof DEFAULT_EXERCISES] || [];
  };

  const startWorkout = (type: WorkoutType) => {
    if (type === 'rest') {
      toast.success("Rest day! Take it easy 😴");
      return;
    }
    const exercises = getExercisesForType(type);
    const workoutExercises: WorkoutExercise[] = exercises.map(ex => ({
      id: generateId(),
      exercise: ex,
      sets: Array.from({ length: 3 }, () => ({
        id: generateId(),
        reps: 10,
        weight: 0,
        completed: false,
      })),
    }));
    const newWorkout: Workout = {
      id: generateId(),
      date: getTodayDate(),
      type,
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      exercises: workoutExercises,
      completed: false,
    };
    setWorkout(newWorkout);
    setIsActive(true);
    saveWorkout(newWorkout);
  };

  const toggleSet = (exerciseId: string, setId: string) => {
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s) }
          : ex
      ),
    };
    setWorkout(updated);
    saveWorkout(updated);
  };

  const updateSetValue = (exerciseId: string, setId: string, field: 'reps' | 'weight', delta: number) => {
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: Math.max(0, s[field] + delta) } : s) }
          : ex
      ),
    };
    setWorkout(updated);
    saveWorkout(updated);
  };

  const finishWorkout = () => {
    if (!workout) return;
    const finished = { ...workout, completed: true, completedAt: new Date().toISOString() };
    saveWorkout(finished);
    setWorkout(finished);
    setIsActive(false);
    toast.success("Workout complete! Great job 💪");
  };

  if (isCoachUser && todayPlan?.isRestDay && !workout && !isActive) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Rest Day" subtitle={dayName} />
          <div className="mt-8 text-center animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <Coffee className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Today is Rest Day</h2>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Recovery is just as important as training.</p>
            <Button variant="outline" size="lg" onClick={() => setIsActive(true)} className="gap-2">
              <Dumbbell className="w-4 h-4" /> Train Anyway
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isCoachUser && todayPlan && !todayPlan.isRestDay && !workout) {
    const plannedType = todayPlan.type;
    const typeInfo = WORKOUT_TYPES.find(t => t.id === plannedType);
    const exercises = getExercisesForType(plannedType);
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Today's Workout" subtitle={dayName} />
          <div className="mt-4 animate-slide-up">
            <div className="bg-card rounded-3xl border border-border/60 p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                  <span className="text-3xl">{typeInfo?.emoji}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your plan for today</p>
                  <h2 className="text-2xl font-display font-bold">{typeInfo?.label}</h2>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4" /> {exercises.length} exercises</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> ~45 min</span>
              </div>
              <Button size="xl" className="w-full shadow-lg shadow-primary/20" onClick={() => startWorkout(plannedType)}>
                <Play className="w-5 h-5 mr-2" /> Start Workout
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!workout && (isActive || !isCoachUser)) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Workout" subtitle="What are you training today?" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {WORKOUT_TYPES.map((type, index) => (
              <button
                key={type.id}
                onClick={() => startWorkout(type.id)}
                className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left animate-slide-up active:scale-[0.98]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className="text-3xl mb-3 block">{type.emoji}</span>
                <h3 className="font-semibold">{type.label}</h3>
                {type.id !== 'rest' && <p className="text-xs text-muted-foreground mt-1">{getExercisesForType(type.id).length} exercises</p>}
              </button>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (workout?.completed) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Workout" />
          <div className="text-center py-12 animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-status-success/10 flex items-center justify-center mx-auto mb-6 glow">
              <Trophy className="w-12 h-12 text-status-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Workout Complete!</h2>
            <p className="text-muted-foreground">{workout.name} · {completedSets}/{totalSets} sets</p>
            <Button variant="outline" size="lg" className="mt-8" onClick={() => setWorkout(null)}>Start Another</Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 gradient-mesh">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader title={workout?.name ?? "Workout"} subtitle={`${completedSets}/${totalSets} sets completed`} />
        <div className="space-y-4 mt-4">
          {workout?.exercises.map((ex, exIndex) => (
            <div key={ex.id} className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: `${exIndex * 50}ms` }}>
              <div className="p-4 border-b border-border/60">
                <h3 className="font-semibold">{ex.exercise.name}</h3>
                <p className="text-xs text-muted-foreground">{ex.exercise.muscleGroup}</p>
              </div>
              <div className="divide-y divide-border/60">
                {ex.sets.map((set, setIndex) => (
                  <div key={set.id} className={cn("flex items-center gap-3 p-3.5 transition-colors", set.completed && "bg-primary-muted/50")}>
                    <button onClick={() => toggleSet(ex.id, set.id)} className={cn("w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all", set.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary")}>
                      {set.completed && <Check className="w-4 h-4" />}
                    </button>
                    <span className="text-sm text-muted-foreground w-10">Set {setIndex + 1}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => updateSetValue(ex.id, set.id, 'reps', -1)} className="p-2 rounded-lg hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                      <span className="w-10 text-center text-sm font-medium">{set.reps}</span>
                      <button onClick={() => updateSetValue(ex.id, set.id, 'reps', 1)} className="p-2 rounded-lg hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                      <span className="text-xs text-muted-foreground ml-1">reps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSetValue(ex.id, set.id, 'weight', -2.5)} className="p-2 rounded-lg hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                      <span className="w-12 text-center text-sm font-medium">{set.weight}</span>
                      <button onClick={() => updateSetValue(ex.id, set.id, 'weight', 2.5)} className="p-2 rounded-lg hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                      <span className="text-xs text-muted-foreground ml-1">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto">
            <Button size="xl" className="w-full shadow-lg shadow-primary/20" onClick={finishWorkout}>
              Finish Workout <Check className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}