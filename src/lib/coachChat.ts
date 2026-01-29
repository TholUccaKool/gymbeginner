import { supabase } from "@/integrations/supabase/client";
import { 
  getUserProfile, 
  getMealsByDate, 
  getDailyNutritionTotals, 
  getTodayDate,
  getWorkoutByDate,
  saveMeal,
  saveWorkout,
  generateId
} from "./storage";
import { Meal, Workout } from "./types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: CoachAction[];
  pendingConfirmation?: boolean;
}

export interface CoachAction {
  type: "log_meal" | "skip_workout" | "move_workout" | "mark_rest_day" | "schedule_workout" | "none";
  data: Record<string, unknown>;
  confirmed?: boolean;
}

export interface CoachResponse {
  message: string;
  actions: CoachAction[];
  requiresConfirmation: boolean;
}

interface UserContext {
  nutritionTargets: { calories: number; protein: number };
  todayMeals: { name: string; calories: number; protein?: number }[];
  todayTotals: { calories: number; protein: number };
  workoutDays: number[];
  trainingDays: number;
  todayWorkout: { type: string; completed: boolean } | null;
  dayOfWeek: number;
  todayDate: string;
}

// Build context from current app state
function buildUserContext(): UserContext {
  const profile = getUserProfile();
  const todayDate = getTodayDate();
  const meals = getMealsByDate(todayDate);
  const totals = getDailyNutritionTotals(todayDate);
  const workout = getWorkoutByDate(todayDate);
  
  const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays ?? [];
  const trainingDays = profile?.trainingDays ?? profile?.coachProfile?.trainingDays ?? 3;
  
  return {
    nutritionTargets: profile?.nutritionTargets ?? { calories: 2000, protein: 150 },
    todayMeals: meals.map(m => ({ name: m.name, calories: m.calories, protein: m.protein })),
    todayTotals: { calories: totals.calories, protein: totals.protein },
    workoutDays,
    trainingDays,
    todayWorkout: workout ? { type: workout.type, completed: workout.completed } : null,
    dayOfWeek: new Date().getDay(),
    todayDate,
  };
}

// Send message to coach and get response
export async function sendMessageToCoach(
  messages: ChatMessage[]
): Promise<CoachResponse> {
  const userContext = buildUserContext();
  
  // Convert to API format (only role and content)
  const apiMessages = messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const { data, error } = await supabase.functions.invoke("coach-chat", {
    body: { messages: apiMessages, userContext },
  });

  if (error) {
    console.error("Coach chat error:", error);
    // Check for rate limit error
    if (error.message?.includes("429") || error.message?.toLowerCase().includes("rate limit")) {
      throw new Error("I'm getting too many requests right now. Please wait a moment and try again.");
    }
    throw new Error(error.message || "Failed to get coach response");
  }

  if (data?.error) {
    // Handle specific error types with friendly messages
    if (data.error.toLowerCase().includes("rate limit")) {
      throw new Error("I'm getting too many requests right now. Please wait a moment and try again.");
    }
    throw new Error(data.error);
  }

  return {
    message: data.message || "I'm sorry, I couldn't process that. Could you try again?",
    actions: data.actions || [],
    requiresConfirmation: data.requiresConfirmation ?? false,
  };
}

// Apply confirmed actions to app state
export function applyCoachAction(action: CoachAction): { success: boolean; message: string } {
  try {
    switch (action.type) {
      case "log_meal": {
        const mealData = action.data as { name: string; calories: number; protein?: number };
        const meal: Meal = {
          id: generateId(),
          date: getTodayDate(),
          name: mealData.name,
          calories: mealData.calories,
          protein: mealData.protein,
          createdAt: new Date().toISOString(),
        };
        saveMeal(meal);
        return { success: true, message: `Logged: ${mealData.name} (${mealData.calories} cal)` };
      }

      case "skip_workout": {
        const skipData = action.data as { date: string; reason?: string };
        const workout = getWorkoutByDate(skipData.date);
        if (workout) {
          workout.completed = false;
          workout.notes = skipData.reason ? `Skipped: ${skipData.reason}` : "Skipped";
          saveWorkout(workout);
        }
        return { success: true, message: "Workout marked as skipped" };
      }

      case "move_workout": {
        const moveData = action.data as { fromDate: string; toDate: string };
        const fromWorkout = getWorkoutByDate(moveData.fromDate);
        const toWorkout = getWorkoutByDate(moveData.toDate);
        
        if (fromWorkout && !fromWorkout.completed) {
          // Create new workout on target date
          const newWorkout: Workout = {
            ...fromWorkout,
            id: generateId(),
            date: moveData.toDate,
          };
          saveWorkout(newWorkout);
          
          // Mark original as rest day
          fromWorkout.type = 'rest';
          fromWorkout.name = 'Rest Day (Moved)';
          saveWorkout(fromWorkout);
          
          return { success: true, message: `Workout moved to ${moveData.toDate}` };
        }
        return { success: false, message: "Could not move workout" };
      }

      case "mark_rest_day": {
        const restData = action.data as { date: string };
        const workout = getWorkoutByDate(restData.date);
        if (workout) {
          workout.type = 'rest';
          workout.name = 'Rest Day';
          saveWorkout(workout);
        }
        return { success: true, message: "Day marked as rest day" };
      }

      case "schedule_workout": {
        const scheduleData = action.data as { 
          date: string; 
          workoutType?: string; 
          reason?: string 
        };
        
        // Check if there's already a workout for this date
        const existingWorkout = getWorkoutByDate(scheduleData.date);
        
        if (existingWorkout && existingWorkout.completed) {
          // Already completed - just acknowledge
          return { success: true, message: "Workout already recorded for this day" };
        }
        
        // Import default exercises for the workout type
        const workoutType = (scheduleData.workoutType || 'full-body') as 'push' | 'pull' | 'legs' | 'full-body' | 'upper' | 'lower';
        
        // Dynamic import to avoid circular dependency - use inline DEFAULT_EXERCISES reference
        const DEFAULT_EXERCISES_MAP: Record<string, Array<{ id: string; name: string; muscleGroup: string }>> = {
          push: [
            { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
            { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
            { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Upper Chest' },
            { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
            { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
          ],
          pull: [
            { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
            { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
            { id: 'pull-ups', name: 'Pull-ups', muscleGroup: 'Lats' },
            { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Rear Delts' },
            { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Biceps' },
          ],
          legs: [
            { id: 'squat', name: 'Squat', muscleGroup: 'Quads' },
            { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
            { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
            { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Hamstrings' },
            { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
          ],
          'full-body': [
            { id: 'squat', name: 'Squat', muscleGroup: 'Quads' },
            { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
            { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
            { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
            { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back/Legs' },
          ],
          upper: [
            { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
            { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
            { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
            { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Biceps' },
            { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
          ],
          lower: [
            { id: 'squat', name: 'Squat', muscleGroup: 'Quads' },
            { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
            { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
            { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },
            { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
          ],
        };
        
        const exerciseTemplates = DEFAULT_EXERCISES_MAP[workoutType] || DEFAULT_EXERCISES_MAP['full-body'];
        
        const WORKOUT_NAMES: Record<string, string> = {
          push: 'Push Day',
          pull: 'Pull Day',
          legs: 'Leg Day',
          'full-body': 'Full Body',
          upper: 'Upper Body',
          lower: 'Lower Body',
        };
        
        // Create exercises with default sets
        const exercises = exerciseTemplates.map(ex => ({
          id: generateId(),
          exercise: ex,
          sets: [
            { id: generateId(), reps: 10, weight: 0, completed: false },
            { id: generateId(), reps: 10, weight: 0, completed: false },
            { id: generateId(), reps: 10, weight: 0, completed: false },
          ],
        }));
        
        const newWorkout: Workout = {
          id: existingWorkout?.id || generateId(),
          date: scheduleData.date,
          type: workoutType,
          name: WORKOUT_NAMES[workoutType] || 'Workout',
          exercises,
          completed: false,
          notes: scheduleData.reason || 'Added via AI Coach',
        };
        
        saveWorkout(newWorkout);
        return { success: true, message: `${WORKOUT_NAMES[workoutType]} scheduled for today` };
      }

      case "none":
      default:
        return { success: true, message: "" };
    }
  } catch (error) {
    console.error("Error applying action:", error);
    return { success: false, message: "Failed to apply change" };
  }
}

// Generate a unique message ID
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
