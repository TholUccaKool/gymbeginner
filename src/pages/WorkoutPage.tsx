import { useState, useMemo } from "react";
import { Check, Plus, Minus, Coffee, Dumbbell, Calendar, Play, Trophy, Search, X, Sparkles, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  getWorkoutByDate, 
  saveWorkout, 
  getTodayDate, 
  generateId,
  DEFAULT_EXERCISES,
  ALL_EXERCISES,
  getUserProfile,
  getTodayPlannedWorkout,
  recordCompletedWorkout
} from "@/lib/storage";
import { Workout, WorkoutType, WorkoutExercise, Exercise } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES: { id: WorkoutType; label: string; emoji: string }[] = [
  { id: 'push', label: 'Push', emoji: '💪' },
  { id: 'pull', label: 'Pull', emoji: '🎯' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
  { id: 'full-body', label: 'Full Body', emoji: '⚡' },
  { id: 'upper', label: 'Upper Body', emoji: '🏋️' },
  { id: 'lower', label: 'Lower Body', emoji: '🦿' },
  { id: 'custom', label: 'Custom', emoji: '✨' },
  { id: 'rest', label: 'Rest Day', emoji: '😴' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Group exercises by muscle group
const EXERCISE_GROUPS = ALL_EXERCISES.reduce((acc, ex) => {
  if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
  acc[ex.muscleGroup].push(ex);
  return acc;
}, {} as Record<string, typeof ALL_EXERCISES>);

// Sortable exercise item component
function SortableExerciseItem({ exercise, onRemove }: { exercise: Exercise; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all",
        isDragging && "opacity-50 scale-105 shadow-lg z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5 opacity-70" />
      </button>
      <span className="flex-1">{exercise.name}</span>
      <button
        onClick={onRemove}
        className="hover:bg-primary-foreground/20 rounded p-0.5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function WorkoutPage() {
  const [workout, setWorkout] = useState<Workout | null>(() => getWorkoutByDate(getTodayDate()));
  const [isActive, setIsActive] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
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

  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return EXERCISE_GROUPS;
    const search = exerciseSearch.toLowerCase();
    const filtered: Record<string, typeof ALL_EXERCISES> = {};
    Object.entries(EXERCISE_GROUPS).forEach(([group, exercises]) => {
      const matching = exercises.filter(ex => 
        ex.name.toLowerCase().includes(search) || 
        ex.muscleGroup.toLowerCase().includes(search)
      );
      if (matching.length > 0) filtered[group] = matching;
    });
    return filtered;
  }, [exerciseSearch]);

  const getExercisesForType = (type: WorkoutType) => {
    if (type === 'upper') {
      return [...(DEFAULT_EXERCISES.push || []), ...(DEFAULT_EXERCISES.pull || []).slice(0, 2)];
    }
    if (type === 'lower') {
      return DEFAULT_EXERCISES.legs || [];
    }
    return DEFAULT_EXERCISES[type as keyof typeof DEFAULT_EXERCISES] || [];
  };

  const handleWorkoutTypeClick = (type: WorkoutType) => {
    if (type === 'custom') {
      setShowCustomBuilder(true);
      return;
    }
    startWorkout(type);
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === exercise.id);
      if (exists) return prev.filter(e => e.id !== exercise.id);
      return [...prev, exercise];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const startCustomWorkout = () => {
    if (selectedExercises.length === 0) {
      toast.error("Select at least one exercise");
      return;
    }
    
    const workoutExercises: WorkoutExercise[] = selectedExercises.map(ex => ({
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
      type: 'custom',
      name: 'Custom Workout',
      exercises: workoutExercises,
      completed: false,
    };
    
    setWorkout(newWorkout);
    setIsActive(true);
    saveWorkout(newWorkout);
    setShowCustomBuilder(false);
    setSelectedExercises([]);
    setExerciseSearch("");
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
    
    // Record in coach memory
    recordCompletedWorkout();
    
    toast.success("Workout complete! Great job 💪");
  };

  // Custom workout builder dialog
  const CustomBuilderDialog = (
    <Dialog open={showCustomBuilder} onOpenChange={setShowCustomBuilder}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Build Custom Workout
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedExercises.length > 0 && (
          <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm font-medium mb-2 text-primary flex items-center gap-2">
              Selected ({selectedExercises.length})
              <span className="text-xs font-normal text-primary/70">• Drag to reorder</span>
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedExercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {selectedExercises.map(ex => (
                    <SortableExerciseItem
                      key={ex.id}
                      exercise={ex}
                      onRemove={() => toggleExerciseSelection(ex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="flex-1 min-h-0 -mx-6 px-6 overflow-y-auto overscroll-contain touch-pan-y">
          <div className="space-y-4 pb-4 pr-2">
            {Object.entries(filteredExercises).map(([group, exercises]) => (
              <div key={group}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</h4>
                <div className="space-y-1">
                  {exercises.map(ex => {
                    const isSelected = selectedExercises.some(s => s.id === ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => toggleExerciseSelection(ex)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                          isSelected 
                            ? "bg-primary/10 border border-primary/30" 
                            : "bg-secondary/50 hover:bg-secondary border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium">{ex.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button 
            size="lg" 
            className="w-full" 
            onClick={startCustomWorkout}
            disabled={selectedExercises.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Workout ({selectedExercises.length} exercises)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isCoachUser && todayPlan?.isRestDay && !workout && !isActive) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Rest Day" subtitle={dayName} />
          <div className="mt-8 text-center animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <Coffee className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Take It Easy Today</h2>
            <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
              Your muscles grow during rest, not during workouts. Recovery is essential.
            </p>
            <div className="bg-card rounded-2xl border border-border/60 p-4 mb-8 text-left max-w-xs mx-auto">
              <p className="text-sm font-medium mb-2">Good rest day ideas:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Light walk or stretching</li>
                <li>• Focus on hitting protein target</li>
                <li>• Get 7-8 hours of sleep</li>
              </ul>
            </div>
            <Button variant="outline" size="lg" onClick={() => setIsActive(true)} className="gap-2">
              <Dumbbell className="w-4 h-4" /> Train Anyway
            </Button>
          </div>
        </div>
        <BottomNav />
        {CustomBuilderDialog}
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4" /> {exercises.length} exercises</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> ~45 min</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                This workout follows your training split and targets {plannedType.replace('-', ' ')} muscles.
              </p>
              <Button size="xl" className="w-full shadow-lg shadow-primary/20" onClick={() => startWorkout(plannedType)}>
                <Play className="w-5 h-5 mr-2" /> Start Workout
              </Button>
            </div>
            
            <button
              onClick={() => setShowCustomBuilder(true)}
              className="w-full p-4 rounded-2xl bg-card/50 border border-dashed border-border/60 hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 text-center"
            >
              <span className="text-muted-foreground">or </span>
              <span className="font-medium text-accent">build a custom workout</span>
            </button>
          </div>
        </div>
        <BottomNav />
        {CustomBuilderDialog}
      </div>
    );
  }

  if (!workout && (isActive || !isCoachUser)) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Workout" subtitle="Pick a workout to get started" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {WORKOUT_TYPES.map((type, index) => (
              <button
                key={type.id}
                onClick={() => handleWorkoutTypeClick(type.id)}
                className={cn(
                  "p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left animate-slide-up active:scale-[0.98]",
                  type.id === 'custom' && "border-dashed hover:border-accent/40 hover:bg-accent/5"
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className="text-3xl mb-3 block">{type.emoji}</span>
                <h3 className="font-semibold">{type.label}</h3>
                {type.id === 'custom' && <p className="text-xs text-accent mt-1">Build your own</p>}
                {type.id !== 'rest' && type.id !== 'custom' && <p className="text-xs text-muted-foreground mt-1">{getExercisesForType(type.id).length} exercises</p>}
              </button>
            ))}
          </div>
        </div>
        <BottomNav />
        {CustomBuilderDialog}
      </div>
    );
  }

  if (workout?.completed) {
    return (
      <div className="min-h-screen bg-background pb-24 gradient-mesh">
        <div className="max-w-lg mx-auto px-4">
          <PageHeader title="Workout" />
          <div className="text-center py-12 animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-6 glow">
              <Trophy className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Workout Complete!</h2>
            <p className="text-muted-foreground mb-2">{workout.name} · {completedSets}/{totalSets} sets</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Great work! Remember to refuel with protein and stay hydrated.
            </p>
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
        <div className="space-y-4 mt-4 pb-24">
          {workout?.exercises.map((ex, exIndex) => (
            <div key={ex.id} className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: `${exIndex * 50}ms` }}>
              <div className="p-4 border-b border-border/60">
                <h3 className="font-semibold">{ex.exercise.name}</h3>
                <p className="text-xs text-muted-foreground">{ex.exercise.muscleGroup}</p>
              </div>
              <div className="divide-y divide-border/60">
                {ex.sets.map((set, setIndex) => (
                  <div key={set.id} className={cn("p-3 transition-colors", set.completed && "bg-primary-muted/50")}>
                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                      <button onClick={() => toggleSet(ex.id, set.id)} className={cn("w-8 h-8 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all", set.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary")}>
                        {set.completed && <Check className="w-4 h-4" />}
                      </button>
                      <span className="text-sm text-muted-foreground shrink-0">Set {setIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0 justify-center bg-secondary/50 rounded-lg py-1">
                        <button onClick={() => updateSetValue(ex.id, set.id, 'reps', -1)} className="p-1.5 rounded-lg hover:bg-secondary active:scale-95 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-8 text-center text-sm font-medium">{set.reps}</span>
                        <button onClick={() => updateSetValue(ex.id, set.id, 'reps', 1)} className="p-1.5 rounded-lg hover:bg-secondary active:scale-95 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs text-muted-foreground">reps</span>
                      </div>
                      <div className="flex items-center gap-1 flex-1 min-w-0 justify-center bg-secondary/50 rounded-lg py-1">
                        <button onClick={() => updateSetValue(ex.id, set.id, 'weight', -2.5)} className="p-1.5 rounded-lg hover:bg-secondary active:scale-95 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-10 text-center text-sm font-medium">{set.weight}</span>
                        <button onClick={() => updateSetValue(ex.id, set.id, 'weight', 2.5)} className="p-1.5 rounded-lg hover:bg-secondary active:scale-95 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>
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
