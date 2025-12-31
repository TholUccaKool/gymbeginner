import { useState, useMemo } from "react";
import { Check, Plus, Minus, ChevronRight, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  getWorkoutByDate, 
  saveWorkout, 
  getTodayDate, 
  generateId,
  DEFAULT_EXERCISES 
} from "@/lib/storage";
import { Workout, WorkoutType, WorkoutExercise, ExerciseSet } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES: { id: WorkoutType; label: string; emoji: string }[] = [
  { id: 'push', label: 'Push', emoji: '💪' },
  { id: 'pull', label: 'Pull', emoji: '🎯' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
  { id: 'full-body', label: 'Full Body', emoji: '⚡' },
  { id: 'rest', label: 'Rest Day', emoji: '😴' },
];

export default function WorkoutPage() {
  const [workout, setWorkout] = useState<Workout | null>(() => getWorkoutByDate(getTodayDate()));
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [isActive, setIsActive] = useState(false);

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

  const startWorkout = (type: WorkoutType) => {
    if (type === 'rest') {
      toast.success("Rest day! Take it easy 😴");
      return;
    }

    const exercises = DEFAULT_EXERCISES[type as keyof typeof DEFAULT_EXERCISES] || [];
    
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
          ? {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      ),
    };

    setWorkout(updated);
    saveWorkout(updated);
  };

  const updateSetValue = (
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight',
    delta: number
  ) => {
    if (!workout) return;

    const updated = {
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId
                  ? { ...s, [field]: Math.max(0, s[field] + delta) }
                  : s
              ),
            }
          : ex
      ),
    };

    setWorkout(updated);
    saveWorkout(updated);
  };

  const finishWorkout = () => {
    if (!workout) return;

    const finished = {
      ...workout,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    saveWorkout(finished);
    setWorkout(finished);
    setIsActive(false);
    toast.success("Workout complete! Great job 💪");
  };

  // Render workout type selection
  if (!workout && !selectedType) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader 
            title="Workout" 
            subtitle="What are you training today?"
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            {WORKOUT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => startWorkout(type.id)}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow transition-all text-left group"
              >
                <span className="text-3xl mb-3 block">{type.emoji}</span>
                <h3 className="font-semibold">{type.label}</h3>
                {type.id !== 'rest' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {DEFAULT_EXERCISES[type.id as keyof typeof DEFAULT_EXERCISES]?.length || 0} exercises
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Render completed workout
  if (workout?.completed) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Workout" />

          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-status-success/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-status-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Workout Complete!</h2>
            <p className="text-muted-foreground mb-1">{workout.name}</p>
            <p className="text-sm text-muted-foreground">
              {completedSets}/{totalSets} sets completed
            </p>

            <Button
              variant="outline"
              className="mt-8"
              onClick={() => setWorkout(null)}
            >
              Start Another Workout
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Render active workout
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-lg mx-auto px-4">
        <PageHeader 
          title={workout?.name ?? "Workout"} 
          subtitle={`${completedSets}/${totalSets} sets completed`}
        />

        <div className="space-y-4 mt-4">
          {workout?.exercises.map((ex, exIndex) => (
            <div
              key={ex.id}
              className="bg-card rounded-2xl border border-border overflow-hidden animate-slide-up"
              style={{ animationDelay: `${exIndex * 50}ms` }}
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">{ex.exercise.name}</h3>
                <p className="text-xs text-muted-foreground">{ex.exercise.muscleGroup}</p>
              </div>

              <div className="divide-y divide-border">
                {ex.sets.map((set, setIndex) => (
                  <div
                    key={set.id}
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors",
                      set.completed && "bg-primary-muted/50"
                    )}
                  >
                    <button
                      onClick={() => toggleSet(ex.id, set.id)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        set.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary"
                      )}
                    >
                      {set.completed && <Check className="w-4 h-4" />}
                    </button>

                    <span className="text-sm text-muted-foreground w-8">
                      Set {setIndex + 1}
                    </span>

                    {/* Reps control */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => updateSetValue(ex.id, set.id, 'reps', -1)}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {set.reps}
                      </span>
                      <button
                        onClick={() => updateSetValue(ex.id, set.id, 'reps', 1)}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-muted-foreground ml-1">reps</span>
                    </div>

                    {/* Weight control */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSetValue(ex.id, set.id, 'weight', -2.5)}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-12 text-center text-sm font-medium">
                        {set.weight}
                      </span>
                      <button
                        onClick={() => updateSetValue(ex.id, set.id, 'weight', 2.5)}
                        className="p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-muted-foreground ml-1">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Finish Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <div className="max-w-lg mx-auto">
            <Button 
              size="lg" 
              className="w-full h-14"
              onClick={finishWorkout}
            >
              Finish Workout
              <Check className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
