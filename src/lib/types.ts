// User Profile
export interface UserProfile {
  id: string;
  experienceLevel: 'experienced' | 'new';
  createdAt: string;
  onboardingComplete: boolean;
  // AI Coach data (for new users)
  coachProfile?: CoachProfile;
  // Nutrition targets
  nutritionTargets: NutritionTargets;
}

export interface CoachProfile {
  goal: 'healthier' | 'leaner' | 'muscle-gain' | 'weight-loss';
  physiqueStyle: 'athletic' | 'lean' | 'superhero' | 'toned';
  age: number;
  height: number; // cm
  weight: number; // kg
  trainingDays: number; // per week
  equipment?: 'full-gym' | 'home-basic' | 'bodyweight';
  injuries?: string;
  dietPreference?: 'no-restriction' | 'vegetarian' | 'vegan' | 'keto';
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

// Meals
export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: string;
}

// Common foods for suggestions
export interface FoodSuggestion {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

// Workouts
export type WorkoutType = 'push' | 'pull' | 'legs' | 'full-body' | 'upper' | 'lower' | 'custom' | 'rest';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  name: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  completedAt?: string;
  duration?: number; // minutes
  notes?: string;
}

// Weekly plan (for AI Coach generated plans)
export interface WeeklyPlan {
  id: string;
  weekStart: string; // YYYY-MM-DD
  days: DayPlan[];
  createdAt: string;
}

export interface DayPlan {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  workoutType: WorkoutType;
  workout?: Workout;
}

// Daily summary
export interface DailyLog {
  date: string;
  meals: Meal[];
  workout?: Workout;
  nutritionTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Smart adjustment suggestions
export interface AdjustmentSuggestion {
  type: 'daily' | 'weekly';
  message: string;
  suggestedCalories?: number;
  suggestedProtein?: number;
}
