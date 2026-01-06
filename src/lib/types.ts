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
  // Training schedule (for experienced users or set during onboarding)
  trainingDays?: number; // per week
  workoutDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Premium subscription status
  isPremium?: boolean;
  // Coach trial tracking
  coachTrialStart?: string; // ISO date when coach plan was generated
  coachTrialExpired?: boolean; // Explicitly set when trial ends
}

export interface CoachProfile {
  goal: 'healthier' | 'leaner' | 'muscle-gain' | 'weight-loss';
  physiqueStyle: 'athletic' | 'lean' | 'superhero' | 'toned';
  age: number;
  height: number; // cm
  weight: number; // kg
  trainingDays: number; // per week
  workoutDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
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

// Coach Memory - tracks user behavior for adaptive coaching
export interface CoachMemory {
  id: string;
  // Weekly stats
  missedWorkouts: MissedWorkout[];
  nutritionDays: NutritionDay[];
  // Streaks
  currentWorkoutStreak: number;
  longestWorkoutStreak: number;
  currentNutritionStreak: number; // Days hitting protein target
  // Last review date
  lastWeeklyReview?: string;
  updatedAt: string;
}

export interface MissedWorkout {
  date: string;
  scheduledType: WorkoutType;
  reason?: string;
}

export interface NutritionDay {
  date: string;
  targetCalories: number;
  actualCalories: number;
  targetProtein: number;
  actualProtein: number;
  hitCalorieTarget: boolean;
  hitProteinTarget: boolean;
}

// Weekly Review - coach analysis and adjustments
export interface WeeklyReview {
  id: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  createdAt: string;
  
  // Summary stats
  workoutsScheduled: number;
  workoutsCompleted: number;
  avgCalories: number;
  avgProtein: number;
  calorieConsistency: number; // percentage of days within target
  proteinConsistency: number;
  
  // Coach decision
  adjustmentType: 'none' | 'calories' | 'protein' | 'both' | 'volume';
  previousCalories?: number;
  newCalories?: number;
  previousProtein?: number;
  newProtein?: number;
  
  // Plain language explanation
  summary: string;
  recommendation: string;
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

// Exercise Progression History
export interface ExerciseHistory {
  exerciseName: string; // Key by exercise name for consistency
  lastWeight: number;
  lastReps: number;
  allSetsCompleted: boolean; // Did user complete all sets last time?
  lastUsedAt: string; // ISO date
  suggestedWeight: number; // Next suggested weight (with progression if applicable)
}
