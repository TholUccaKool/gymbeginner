import { supabase } from "@/integrations/supabase/client";
import {
  getUserProfile,
  getMealsByDate,
  getDailyNutritionTotals,
  getTodayDate,
  getWorkoutByDate,
  saveMeal,
  saveWorkout,
  generateId,
  getCoachMemory
} from "./storage";
import { getPersonalizedExercises } from "./workoutTemplates";
import { Meal, Workout } from "./types";
import { emitDataUpdated } from "./events";
import { getSimulatedDate, getSimulatedTodayDate } from "./debugDate";

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

interface CoachMemorySummary {
  currentWorkoutStreak: number;
  longestWorkoutStreak: number;
  currentNutritionStreak: number;
  nutritionDaysLast7: number;
  missedWorkoutsLast14: number;
  daysSinceLastWeeklyReview: number | null;
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
  coachMemorySummary?: CoachMemorySummary;
}

// Count how many days between two YYYY-MM-DD date strings
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
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

  const memory = getCoachMemory();
  let coachMemorySummary: CoachMemorySummary | undefined;

  if (memory) {
    const simToday = getSimulatedTodayDate();
    const nutritionDaysLast7 = memory.nutritionDays.filter(
      d => daysBetween(d.date, simToday) <= 7
    ).length;
    const missedWorkoutsLast14 = memory.missedWorkouts.filter(
      d => daysBetween(d.date, simToday) <= 14
    ).length;
    const daysSinceLastWeeklyReview = memory.lastWeeklyReview
      ? daysBetween(memory.lastWeeklyReview, simToday)
      : null;

    coachMemorySummary = {
      currentWorkoutStreak: memory.currentWorkoutStreak,
      longestWorkoutStreak: memory.longestWorkoutStreak,
      currentNutritionStreak: memory.currentNutritionStreak,
      nutritionDaysLast7,
      missedWorkoutsLast14,
      daysSinceLastWeeklyReview,
    };
  }

  return {
    nutritionTargets: profile?.nutritionTargets ?? { calories: 2000, protein: 150 },
    todayMeals: meals.map(m => ({ name: m.name, calories: m.calories, protein: m.protein })),
    todayTotals: { calories: totals.calories, protein: totals.protein },
    workoutDays,
    trainingDays,
    todayWorkout: workout ? { type: workout.type, completed: workout.completed } : null,
    dayOfWeek: getSimulatedDate().getDay(),
    todayDate,
    ...(coachMemorySummary && { coachMemorySummary }),
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
        
        // Get user profile for personalization
        const profile = getUserProfile();
        const experienceLevel = profile?.experienceLevel || 'new';
        const trainingDays = profile?.trainingDays ?? profile?.coachProfile?.trainingDays ?? 3;
        
        // Use personalized template
        const workoutType = (scheduleData.workoutType || 'full-body') as 'push' | 'pull' | 'legs' | 'full-body' | 'upper' | 'lower';
        const template = getPersonalizedExercises(workoutType, experienceLevel, trainingDays);
        
        const WORKOUT_NAMES: Record<string, string> = {
          push: 'Push Day',
          pull: 'Pull Day',
          legs: 'Leg Day',
          'full-body': 'Full Body',
          upper: 'Upper Body',
          lower: 'Lower Body',
        };
        
        // Create exercises with personalized sets
        const exercises = template.exercises.map(ex => ({
          id: generateId(),
          exercise: ex,
          sets: Array.from({ length: template.setsPerExercise }, () => ({
            id: generateId(),
            reps: template.repsPerSet,
            weight: 0,
            completed: false,
          })),
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
        
        // Emit data update so UI refreshes
        emitDataUpdated();
        
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
