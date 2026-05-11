import { UserProfile, Meal, Workout, WeeklyPlan, FoodSuggestion, WorkoutType, CoachMemory, WeeklyReview, NutritionDay, ExerciseHistory } from './types';
import { emitProfileUpdated } from './events';
import { getSimulatedDate } from './debugDate';

const STORAGE_KEYS = {
  USER_PROFILE: 'fittrack_user_profile',
  MEALS: 'fittrack_meals',
  WORKOUTS: 'fittrack_workouts',
  WEEKLY_PLANS: 'fittrack_weekly_plans',
  COACH_MEMORY: 'fittrack_coach_memory',
  WEEKLY_REVIEWS: 'fittrack_weekly_reviews',
  EXERCISE_HISTORY: 'fittrack_exercise_history',
} as const;

// Generic storage helpers
const getItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
};

// User Profile
export const getUserProfile = (): UserProfile | null => {
  return getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
};

export const saveUserProfile = (profile: UserProfile): void => {
  setItem(STORAGE_KEYS.USER_PROFILE, profile);
  // Emit event so UI components can react immediately
  emitProfileUpdated();
};

export const hasCompletedOnboarding = (): boolean => {
  const profile = getUserProfile();
  return profile?.onboardingComplete ?? false;
};

// Meals
export const getMeals = (): Meal[] => {
  return getItem<Meal[]>(STORAGE_KEYS.MEALS) ?? [];
};

export const getMealsByDate = (date: string): Meal[] => {
  const meals = getMeals();
  return meals.filter(meal => meal.date === date);
};

export const saveMeal = (meal: Meal): void => {
  const meals = getMeals();
  meals.push(meal);
  setItem(STORAGE_KEYS.MEALS, meals);
};

export const updateMeal = (meal: Meal): void => {
  const meals = getMeals();
  const index = meals.findIndex(m => m.id === meal.id);
  if (index !== -1) {
    meals[index] = meal;
    setItem(STORAGE_KEYS.MEALS, meals);
  }
};

export const deleteMeal = (mealId: string): void => {
  const meals = getMeals();
  const filtered = meals.filter(m => m.id !== mealId);
  setItem(STORAGE_KEYS.MEALS, filtered);
};

// Workouts
export const getWorkouts = (): Workout[] => {
  return getItem<Workout[]>(STORAGE_KEYS.WORKOUTS) ?? [];
};

export const getWorkoutByDate = (date: string): Workout | null => {
  const workouts = getWorkouts();
  return workouts.find(w => w.date === date) ?? null;
};

export const saveWorkout = (workout: Workout): void => {
  const workouts = getWorkouts();
  const existingIndex = workouts.findIndex(w => w.id === workout.id);
  if (existingIndex !== -1) {
    workouts[existingIndex] = workout;
  } else {
    workouts.push(workout);
  }
  setItem(STORAGE_KEYS.WORKOUTS, workouts);
};

export const deleteWorkout = (workoutId: string): void => {
  const workouts = getWorkouts();
  const filtered = workouts.filter(w => w.id !== workoutId);
  setItem(STORAGE_KEYS.WORKOUTS, filtered);
};

// Weekly Plans
export const getWeeklyPlans = (): WeeklyPlan[] => {
  return getItem<WeeklyPlan[]>(STORAGE_KEYS.WEEKLY_PLANS) ?? [];
};

export const getCurrentWeeklyPlan = (): WeeklyPlan | null => {
  const plans = getWeeklyPlans();
  return plans.length > 0 ? plans[plans.length - 1] : null;
};

export const saveWeeklyPlan = (plan: WeeklyPlan): void => {
  const plans = getWeeklyPlans();
  plans.push(plan);
  setItem(STORAGE_KEYS.WEEKLY_PLANS, plans);
};

// Get today's planned workout based on user's training schedule
export const getTodayPlannedWorkout = (): { type: WorkoutType; isRestDay: boolean } | null => {
  const profile = getUserProfile();
  const dayOfWeek = getSimulatedDate().getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check for user-selected workout days (both experienced and new users)
  const workoutDays = profile?.workoutDays ?? profile?.coachProfile?.workoutDays;
  const trainingDays = profile?.trainingDays ?? profile?.coachProfile?.trainingDays;
  
  if (!workoutDays || !trainingDays) return null;
  
  // Check if today is a workout day
  const isWorkoutDay = workoutDays.includes(dayOfWeek);
  
  if (!isWorkoutDay) {
    return { type: 'rest', isRestDay: true };
  }
  
  // Generate workout type based on position in the week
  const workoutRotations: Record<number, WorkoutType[]> = {
    1: ['full-body'],
    2: ['full-body', 'full-body'],
    3: ['push', 'pull', 'legs'],
    4: ['push', 'pull', 'legs', 'upper'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full-body'],
  };
  
  const rotation = workoutRotations[trainingDays] || workoutRotations[3];
  
  // Find which workout in the rotation today is
  const sortedWorkoutDays = [...workoutDays].sort((a, b) => a - b);
  const workoutIndex = sortedWorkoutDays.indexOf(dayOfWeek);
  
  return { 
    type: rotation[workoutIndex % rotation.length], 
    isRestDay: false 
  };
};

// Calculate daily nutrition totals
export const getDailyNutritionTotals = (date: string) => {
  const meals = getMealsByDate(date);
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + (meal.protein ?? 0),
      carbs: acc.carbs + (meal.carbs ?? 0),
      fat: acc.fat + (meal.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get today's date in YYYY-MM-DD format
// Uses simulated date if debug mode is active
export const getTodayDate = (): string => {
  // Import dynamically to avoid circular dependency
  const offset = localStorage.getItem('fittrack_debug_date_offset');
  if (offset && (import.meta.env.DEV || localStorage.getItem('fittrack_debug_enabled') === 'true')) {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(offset, 10));
    return date.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

// Common food database for suggestions
export const COMMON_FOODS: FoodSuggestion[] = [
  { name: 'Chicken Breast', servingSize: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Beef (Lean)', servingSize: '100g', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: 'Salmon', servingSize: '100g', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Eggs', servingSize: '2 large', calories: 140, protein: 12, carbs: 1, fat: 10 },
  { name: 'Greek Yogurt', servingSize: '170g', calories: 100, protein: 17, carbs: 6, fat: 1 },
  { name: 'White Rice', servingSize: '1 cup cooked', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { name: 'Brown Rice', servingSize: '1 cup cooked', calories: 215, protein: 5, carbs: 45, fat: 2 },
  { name: 'Oatmeal', servingSize: '1 cup cooked', calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: 'Bread (Whole Wheat)', servingSize: '2 slices', calories: 160, protein: 8, carbs: 28, fat: 2 },
  { name: 'Banana', servingSize: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Apple', servingSize: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: 'Broccoli', servingSize: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1 },
  { name: 'Sweet Potato', servingSize: '1 medium', calories: 103, protein: 2, carbs: 24, fat: 0 },
  { name: 'Avocado', servingSize: '1/2', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Almonds', servingSize: '28g (23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: 'Protein Shake', servingSize: '1 scoop + water', calories: 120, protein: 25, carbs: 3, fat: 1 },
  { name: 'Pasta', servingSize: '1 cup cooked', calories: 220, protein: 8, carbs: 43, fat: 1 },
  { name: 'Pizza (1 slice)', servingSize: '1 large slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
  { name: 'Burger', servingSize: '1 regular', calories: 450, protein: 25, carbs: 40, fat: 20 },
  { name: 'Ice Cream', servingSize: '1/2 cup', calories: 140, protein: 2, carbs: 16, fat: 7 },
];

// Default workout templates
export const DEFAULT_EXERCISES = {
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
};

// All available exercises for custom workouts
export const ALL_EXERCISES = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-bench', name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { id: 'decline-bench', name: 'Decline Bench Press', muscleGroup: 'Chest' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'flat-db-press', name: 'Flat Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'decline-db-press', name: 'Decline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'chest-fly', name: 'Chest Fly', muscleGroup: 'Chest' },
  { id: 'incline-fly', name: 'Incline Dumbbell Fly', muscleGroup: 'Chest' },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'Chest' },
  { id: 'push-ups', name: 'Push-ups', muscleGroup: 'Chest' },
  { id: 'diamond-pushups', name: 'Diamond Push-ups', muscleGroup: 'Chest' },
  { id: 'wide-pushups', name: 'Wide Push-ups', muscleGroup: 'Chest' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'Chest' },
  { id: 'pec-deck', name: 'Pec Deck Machine', muscleGroup: 'Chest' },
  { id: 'chest-dips', name: 'Chest Dips', muscleGroup: 'Chest' },
  { id: 'smith-bench', name: 'Smith Machine Bench Press', muscleGroup: 'Chest' },
  { id: 'landmine-press', name: 'Landmine Press', muscleGroup: 'Chest' },
  
  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroup: 'Back' },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'pendlay-row', name: 'Pendlay Row', muscleGroup: 'Back' },
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back' },
  { id: 'pull-ups', name: 'Pull-ups', muscleGroup: 'Back' },
  { id: 'chin-ups', name: 'Chin-ups', muscleGroup: 'Back' },
  { id: 'wide-grip-pullups', name: 'Wide Grip Pull-ups', muscleGroup: 'Back' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'close-grip-pulldown', name: 'Close Grip Pulldown', muscleGroup: 'Back' },
  { id: 'seated-row', name: 'Seated Cable Row', muscleGroup: 'Back' },
  { id: 'chest-supported-row', name: 'Chest Supported Row', muscleGroup: 'Back' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'Back' },
  { id: 'meadows-row', name: 'Meadows Row', muscleGroup: 'Back' },
  { id: 'straight-arm-pulldown', name: 'Straight Arm Pulldown', muscleGroup: 'Back' },
  { id: 'rack-pulls', name: 'Rack Pulls', muscleGroup: 'Back' },
  { id: 'good-mornings', name: 'Good Mornings', muscleGroup: 'Back' },
  { id: 'hyperextensions', name: 'Hyperextensions', muscleGroup: 'Back' },
  { id: 'inverted-row', name: 'Inverted Row', muscleGroup: 'Back' },
  
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'seated-ohp', name: 'Seated Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'dumbbell-ohp', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { id: 'push-press', name: 'Push Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', muscleGroup: 'Shoulders' },
  { id: 'reverse-fly', name: 'Reverse Fly', muscleGroup: 'Shoulders' },
  { id: 'rear-delt-row', name: 'Rear Delt Row', muscleGroup: 'Shoulders' },
  { id: 'upright-row', name: 'Upright Row', muscleGroup: 'Shoulders' },
  { id: 'shrugs', name: 'Barbell Shrugs', muscleGroup: 'Shoulders' },
  { id: 'db-shrugs', name: 'Dumbbell Shrugs', muscleGroup: 'Shoulders' },
  { id: 'behind-neck-press', name: 'Behind Neck Press', muscleGroup: 'Shoulders' },
  { id: 'landmine-lateral', name: 'Landmine Lateral Raise', muscleGroup: 'Shoulders' },
  
  // Biceps
  { id: 'bicep-curl', name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { id: 'incline-curl', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps' },
  { id: 'concentration-curl', name: 'Concentration Curl', muscleGroup: 'Biceps' },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'Biceps' },
  { id: 'spider-curl', name: 'Spider Curl', muscleGroup: 'Biceps' },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', muscleGroup: 'Biceps' },
  { id: 'reverse-curl', name: 'Reverse Curl', muscleGroup: 'Biceps' },
  { id: 'zottman-curl', name: 'Zottman Curl', muscleGroup: 'Biceps' },
  { id: 'drag-curl', name: 'Drag Curl', muscleGroup: 'Biceps' },
  { id: '21s', name: '21s', muscleGroup: 'Biceps' },
  
  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { id: 'rope-pushdown', name: 'Rope Pushdown', muscleGroup: 'Triceps' },
  { id: 'skull-crushers', name: 'Skull Crushers', muscleGroup: 'Triceps' },
  { id: 'close-grip-bench', name: 'Close Grip Bench Press', muscleGroup: 'Triceps' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Triceps' },
  { id: 'overhead-extension', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { id: 'cable-overhead-ext', name: 'Cable Overhead Extension', muscleGroup: 'Triceps' },
  { id: 'kickbacks', name: 'Tricep Kickbacks', muscleGroup: 'Triceps' },
  { id: 'diamond-pushups-tri', name: 'Diamond Push-ups', muscleGroup: 'Triceps' },
  { id: 'bench-dips', name: 'Bench Dips', muscleGroup: 'Triceps' },
  { id: 'jm-press', name: 'JM Press', muscleGroup: 'Triceps' },
  { id: 'tate-press', name: 'Tate Press', muscleGroup: 'Triceps' },
  
  // Quads
  { id: 'squat', name: 'Back Squat', muscleGroup: 'Quads' },
  { id: 'front-squat', name: 'Front Squat', muscleGroup: 'Quads' },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroup: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroup: 'Quads' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'Quads' },
  { id: 'walking-lunges', name: 'Walking Lunges', muscleGroup: 'Quads' },
  { id: 'reverse-lunges', name: 'Reverse Lunges', muscleGroup: 'Quads' },
  { id: 'bulgarian-split', name: 'Bulgarian Split Squat', muscleGroup: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },
  { id: 'sissy-squat', name: 'Sissy Squat', muscleGroup: 'Quads' },
  { id: 'step-ups', name: 'Step Ups', muscleGroup: 'Quads' },
  { id: 'box-squat', name: 'Box Squat', muscleGroup: 'Quads' },
  { id: 'pause-squat', name: 'Pause Squat', muscleGroup: 'Quads' },
  { id: 'smith-squat', name: 'Smith Machine Squat', muscleGroup: 'Quads' },
  { id: 'belt-squat', name: 'Belt Squat', muscleGroup: 'Quads' },
  
  // Hamstrings
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', muscleGroup: 'Hamstrings' },
  { id: 'single-leg-rdl', name: 'Single Leg RDL', muscleGroup: 'Hamstrings' },
  { id: 'leg-curl', name: 'Lying Leg Curl', muscleGroup: 'Hamstrings' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings' },
  { id: 'nordic-curl', name: 'Nordic Curl', muscleGroup: 'Hamstrings' },
  { id: 'glute-ham-raise', name: 'Glute Ham Raise', muscleGroup: 'Hamstrings' },
  { id: 'cable-pull-through', name: 'Cable Pull Through', muscleGroup: 'Hamstrings' },
  { id: 'db-romanian-deadlift', name: 'Dumbbell RDL', muscleGroup: 'Hamstrings' },
  
  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'barbell-hip-thrust', name: 'Barbell Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'single-leg-hip-thrust', name: 'Single Leg Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { id: 'cable-kickback', name: 'Cable Kickback', muscleGroup: 'Glutes' },
  { id: 'donkey-kicks', name: 'Donkey Kicks', muscleGroup: 'Glutes' },
  { id: 'fire-hydrants', name: 'Fire Hydrants', muscleGroup: 'Glutes' },
  { id: 'frog-pumps', name: 'Frog Pumps', muscleGroup: 'Glutes' },
  { id: 'sumo-squat', name: 'Sumo Squat', muscleGroup: 'Glutes' },
  { id: 'hip-abduction', name: 'Hip Abduction Machine', muscleGroup: 'Glutes' },
  
  // Calves
  { id: 'calf-raise', name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'Calves' },
  { id: 'leg-press-calf', name: 'Leg Press Calf Raise', muscleGroup: 'Calves' },
  { id: 'donkey-calf-raise', name: 'Donkey Calf Raise', muscleGroup: 'Calves' },
  { id: 'single-leg-calf', name: 'Single Leg Calf Raise', muscleGroup: 'Calves' },
  { id: 'smith-calf-raise', name: 'Smith Machine Calf Raise', muscleGroup: 'Calves' },
  
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
  { id: 'side-plank', name: 'Side Plank', muscleGroup: 'Core' },
  { id: 'crunches', name: 'Crunches', muscleGroup: 'Core' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscleGroup: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: 'leg-raises', name: 'Leg Raises', muscleGroup: 'Core' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { id: 'knee-raises', name: 'Hanging Knee Raise', muscleGroup: 'Core' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core' },
  { id: 'woodchoppers', name: 'Cable Woodchoppers', muscleGroup: 'Core' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroup: 'Core' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'Core' },
  { id: 'bird-dog', name: 'Bird Dog', muscleGroup: 'Core' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', muscleGroup: 'Core' },
  { id: 'v-ups', name: 'V-Ups', muscleGroup: 'Core' },
  { id: 'toe-touches', name: 'Toe Touches', muscleGroup: 'Core' },
  { id: 'sit-ups', name: 'Sit-ups', muscleGroup: 'Core' },
  { id: 'decline-situps', name: 'Decline Sit-ups', muscleGroup: 'Core' },
  { id: 'dragon-flag', name: 'Dragon Flag', muscleGroup: 'Core' },
  
  // Forearms
  { id: 'wrist-curl', name: 'Wrist Curl', muscleGroup: 'Forearms' },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', muscleGroup: 'Forearms' },
  { id: 'farmers-walk', name: "Farmer's Walk", muscleGroup: 'Forearms' },
  { id: 'plate-pinch', name: 'Plate Pinch', muscleGroup: 'Forearms' },
  { id: 'dead-hang', name: 'Dead Hang', muscleGroup: 'Forearms' },
  
  // Cardio / Full Body
  { id: 'burpees', name: 'Burpees', muscleGroup: 'Full Body' },
  { id: 'jumping-jacks', name: 'Jumping Jacks', muscleGroup: 'Full Body' },
  { id: 'box-jumps', name: 'Box Jumps', muscleGroup: 'Full Body' },
  { id: 'battle-ropes', name: 'Battle Ropes', muscleGroup: 'Full Body' },
  { id: 'kettlebell-swings', name: 'Kettlebell Swings', muscleGroup: 'Full Body' },
  { id: 'clean-and-press', name: 'Clean and Press', muscleGroup: 'Full Body' },
  { id: 'thrusters', name: 'Thrusters', muscleGroup: 'Full Body' },
  { id: 'man-makers', name: 'Man Makers', muscleGroup: 'Full Body' },
  { id: 'sled-push', name: 'Sled Push', muscleGroup: 'Full Body' },
  { id: 'sled-pull', name: 'Sled Pull', muscleGroup: 'Full Body' },
  { id: 'rowing-machine', name: 'Rowing Machine', muscleGroup: 'Full Body' },
  { id: 'assault-bike', name: 'Assault Bike', muscleGroup: 'Full Body' },
  { id: 'jump-rope', name: 'Jump Rope', muscleGroup: 'Full Body' },
  { id: 'sprints', name: 'Sprints', muscleGroup: 'Full Body' },
  { id: 'treadmill', name: 'Treadmill', muscleGroup: 'Full Body' },
  { id: 'stair-climber', name: 'Stair Climber', muscleGroup: 'Full Body' },
  { id: 'elliptical', name: 'Elliptical', muscleGroup: 'Full Body' },
];

// ============= Coach Memory =============

export const getCoachMemory = (): CoachMemory | null => {
  return getItem<CoachMemory>(STORAGE_KEYS.COACH_MEMORY);
};

export const saveCoachMemory = (memory: CoachMemory): void => {
  setItem(STORAGE_KEYS.COACH_MEMORY, memory);
};

export const initializeCoachMemory = (): CoachMemory => {
  const existing = getCoachMemory();
  if (existing) return existing;
  
  const memory: CoachMemory = {
    id: generateId(),
    missedWorkouts: [],
    nutritionDays: [],
    currentWorkoutStreak: 0,
    longestWorkoutStreak: 0,
    currentNutritionStreak: 0,
    updatedAt: new Date().toISOString(),
  };
  saveCoachMemory(memory);
  return memory;
};

export const recordNutritionDay = (date: string): void => {
  const memory = getCoachMemory() || initializeCoachMemory();
  const profile = getUserProfile();
  const targets = profile?.nutritionTargets ?? { calories: 2000, protein: 150 };
  const totals = getDailyNutritionTotals(date);
  
  // Remove existing entry for this date
  const filtered = memory.nutritionDays.filter(d => d.date !== date);
  
  const calorieThreshold = targets.calories * 0.1; // Within 10%
  const hitCalories = Math.abs(totals.calories - targets.calories) <= calorieThreshold;
  const hitProtein = totals.protein >= targets.protein * 0.9; // At least 90%
  
  const nutritionDay: NutritionDay = {
    date,
    targetCalories: targets.calories,
    actualCalories: totals.calories,
    targetProtein: targets.protein,
    actualProtein: totals.protein,
    hitCalorieTarget: hitCalories,
    hitProteinTarget: hitProtein,
  };
  
  filtered.push(nutritionDay);
  
  // Keep last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = filtered.filter(d => new Date(d.date) >= thirtyDaysAgo);
  
  // Update streak
  let streak = 0;
  const sorted = [...recent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const day of sorted) {
    if (day.hitProteinTarget) {
      streak++;
    } else {
      break;
    }
  }
  
  saveCoachMemory({
    ...memory,
    nutritionDays: recent,
    currentNutritionStreak: streak,
    updatedAt: new Date().toISOString(),
  });
};

export const recordMissedWorkout = (date: string, scheduledType: WorkoutType): void => {
  const memory = getCoachMemory() || initializeCoachMemory();
  
  // Check if already recorded
  if (memory.missedWorkouts.some(m => m.date === date)) return;
  
  memory.missedWorkouts.push({ date, scheduledType });
  
  // Keep last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = memory.missedWorkouts.filter(m => new Date(m.date) >= thirtyDaysAgo);
  
  // Reset workout streak
  saveCoachMemory({
    ...memory,
    missedWorkouts: recent,
    currentWorkoutStreak: 0,
    updatedAt: new Date().toISOString(),
  });
};

export const recordCompletedWorkout = (): void => {
  const memory = getCoachMemory() || initializeCoachMemory();
  
  const newStreak = memory.currentWorkoutStreak + 1;
  saveCoachMemory({
    ...memory,
    currentWorkoutStreak: newStreak,
    longestWorkoutStreak: Math.max(memory.longestWorkoutStreak, newStreak),
    updatedAt: new Date().toISOString(),
  });
};

// ============= Weekly Reviews =============

export const getWeeklyReviews = (): WeeklyReview[] => {
  return getItem<WeeklyReview[]>(STORAGE_KEYS.WEEKLY_REVIEWS) ?? [];
};

export const getLatestWeeklyReview = (): WeeklyReview | null => {
  const reviews = getWeeklyReviews();
  return reviews.length > 0 ? reviews[reviews.length - 1] : null;
};

export const saveWeeklyReview = (review: WeeklyReview): void => {
  const reviews = getWeeklyReviews();
  reviews.push(review);
  // Keep last 12 weeks
  const trimmed = reviews.slice(-12);
  setItem(STORAGE_KEYS.WEEKLY_REVIEWS, trimmed);
};

// ============= Coach Trial Logic =============

export const isCoachTrialActive = (): boolean => {
  const profile = getUserProfile();
  if (!profile) return false;
  if (profile.isPremium) return true; // Premium users always have access
  if (profile.coachTrialExpired) return false;
  if (!profile.coachTrialStart) return true; // Never started = can still use
  
  const trialStart = new Date(profile.coachTrialStart);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceStart < 7; // 7-day trial
};

export const startCoachTrial = (): void => {
  const profile = getUserProfile();
  if (!profile) return;
  if (profile.coachTrialStart) return; // Already started
  
  saveUserProfile({
    ...profile,
    coachTrialStart: new Date().toISOString(),
  });
};

export const getDaysLeftInTrial = (): number => {
  const profile = getUserProfile();
  if (!profile?.coachTrialStart) return 7;
  if (profile.isPremium) return -1; // Premium, no limit
  
  const trialStart = new Date(profile.coachTrialStart);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, 7 - daysSinceStart);
};

export const hasCoachAccess = (): boolean => {
  const profile = getUserProfile();
  if (!profile) return false;
  return profile.isPremium || isCoachTrialActive();
};

// ============= Weekly Review Generation =============

export const shouldShowWeeklyReview = (): boolean => {
  const profile = getUserProfile();
  if (!profile || !hasCoachAccess()) return false;
  
  const memory = getCoachMemory();
  if (!memory?.lastWeeklyReview) return true; // Never reviewed
  
  const lastReview = new Date(memory.lastWeeklyReview);
  const now = new Date();
  const daysSinceReview = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceReview >= 7;
};

export const generateWeeklyReview = (): WeeklyReview | null => {
  const profile = getUserProfile();
  const memory = getCoachMemory();
  if (!profile || !memory) return null;
  
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() - now.getDay()); // Last Sunday
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6); // Previous Monday
  
  const targets = profile.nutritionTargets;
  const workoutDays = profile.workoutDays || profile.coachProfile?.workoutDays || [];
  
  // Get workouts for the week
  const workouts = getWorkouts().filter(w => {
    const d = new Date(w.date);
    return d >= weekStart && d <= weekEnd && w.completed;
  });
  
  // Get nutrition data for the week
  const nutritionDays = memory.nutritionDays.filter(n => {
    const d = new Date(n.date);
    return d >= weekStart && d <= weekEnd;
  });
  
  const workoutsScheduled = workoutDays.length;
  const workoutsCompleted = workouts.length;
  const avgCalories = nutritionDays.length > 0 
    ? Math.round(nutritionDays.reduce((sum, d) => sum + d.actualCalories, 0) / nutritionDays.length)
    : 0;
  const avgProtein = nutritionDays.length > 0
    ? Math.round(nutritionDays.reduce((sum, d) => sum + d.actualProtein, 0) / nutritionDays.length)
    : 0;
  const calorieConsistency = nutritionDays.length > 0
    ? Math.round((nutritionDays.filter(d => d.hitCalorieTarget).length / nutritionDays.length) * 100)
    : 0;
  const proteinConsistency = nutritionDays.length > 0
    ? Math.round((nutritionDays.filter(d => d.hitProteinTarget).length / nutritionDays.length) * 100)
    : 0;
  
  // Determine adjustment
  let adjustmentType: WeeklyReview['adjustmentType'] = 'none';
  let newCalories = targets.calories;
  let newProtein = targets.protein;
  let summary = '';
  let recommendation = '';
  
  const goal = profile.coachProfile?.goal;
  const completionRate = workoutsScheduled > 0 ? workoutsCompleted / workoutsScheduled : 0;
  
  // Logic for adjustments based on goals and consistency
  if (goal === 'weight-loss' || goal === 'leaner') {
    if (calorieConsistency >= 80 && completionRate >= 0.8) {
      // Doing well, slight reduction
      adjustmentType = 'calories';
      newCalories = targets.calories - 50;
      summary = "Great week! You've been consistent with both workouts and nutrition.";
      recommendation = "Reducing calories by 50 to keep progress moving. Stay the course.";
    } else if (calorieConsistency < 50) {
      summary = "Calories were inconsistent this week. That's okay—it happens.";
      recommendation = "Focus on hitting your calorie target more consistently before we adjust anything.";
    } else {
      summary = "Solid effort this week. You're building good habits.";
      recommendation = "Keep your current targets. Consistency is key right now.";
    }
  } else if (goal === 'muscle-gain') {
    if (proteinConsistency >= 80 && completionRate >= 0.8) {
      adjustmentType = 'calories';
      newCalories = targets.calories + 50;
      summary = "Excellent week! Protein and training are on point.";
      recommendation = "Adding 50 calories to support muscle growth. Keep training hard.";
    } else if (proteinConsistency < 60) {
      summary = "Protein intake was lower than ideal this week.";
      recommendation = "Focus on hitting your protein target—it's crucial for muscle building.";
    } else {
      summary = "Good progress this week. Training is building momentum.";
      recommendation = "Maintain current targets and focus on progressive overload in your workouts.";
    }
  } else {
    // healthier or default
    if (completionRate >= 0.8 && calorieConsistency >= 70) {
      summary = "You had a great week! Workouts and nutrition are aligned.";
      recommendation = "No changes needed. You're doing exactly what you should be doing.";
    } else if (completionRate < 0.5) {
      summary = "Training was light this week. Life happens—don't stress.";
      recommendation = "Aim to complete at least half your scheduled workouts next week.";
    } else {
      summary = "A decent week overall. Room to improve, but you're on track.";
      recommendation = "Keep focusing on consistency. Small steps lead to big results.";
    }
  }
  
  // Store whether we need calorie/protein changes for cleaner logic
  // Cast to string to avoid TypeScript narrowing issues from control flow
  const adjType = adjustmentType as string;
  const needsCalorieChange = adjType === 'calories' || adjType === 'both';
  const needsProteinChange = adjType === 'protein' || adjType === 'both';
  
  const review: WeeklyReview = {
    id: generateId(),
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    workoutsScheduled,
    workoutsCompleted,
    avgCalories,
    avgProtein,
    calorieConsistency,
    proteinConsistency,
    adjustmentType,
    previousCalories: targets.calories,
    newCalories: needsCalorieChange ? newCalories : undefined,
    previousProtein: targets.protein,
    newProtein: needsProteinChange ? newProtein : undefined,
    summary,
    recommendation,
  };
  
  // Save review and apply changes if premium
  saveWeeklyReview(review);
  
  if (profile.isPremium && needsCalorieChange) {
    saveUserProfile({
      ...profile,
      nutritionTargets: {
        ...targets,
        calories: newCalories,
      },
    });
  }
  
  // Update coach memory
  saveCoachMemory({
    ...memory,
    lastWeeklyReview: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  return review;
};

// ============= Exercise Progression History =============

// Get all exercise history
export const getExerciseHistory = (): Record<string, ExerciseHistory> => {
  return getItem<Record<string, ExerciseHistory>>(STORAGE_KEYS.EXERCISE_HISTORY) ?? {};
};

// Get history for a specific exercise
export const getExerciseHistoryByName = (exerciseName: string): ExerciseHistory | null => {
  const history = getExerciseHistory();
  return history[exerciseName.toLowerCase()] ?? null;
};

// Calculate suggested weight based on progression logic
const calculateProgressionWeight = (lastWeight: number, allSetsCompleted: boolean): number => {
  if (!allSetsCompleted) {
    // Keep same weight if not all sets completed
    return lastWeight;
  }
  
  // Progressive overload: suggest +2.5kg for lighter weights, +5kg for heavier
  const increment = lastWeight >= 50 ? 5 : 2.5;
  return lastWeight + increment;
};

// Save exercise history after workout completion
export const saveExerciseHistoryFromWorkout = (workout: Workout): void => {
  if (!workout.completed) return;
  
  const history = getExerciseHistory();
  const now = new Date().toISOString();
  
  workout.exercises.forEach(workoutExercise => {
    const exerciseName = workoutExercise.exercise.name.toLowerCase();
    const completedSets = workoutExercise.sets.filter(s => s.completed);
    
    if (completedSets.length === 0) return; // Skip if no sets completed
    
    // Get the max weight used in completed sets
    const maxWeight = Math.max(...completedSets.map(s => s.weight));
    // Get the reps at that weight
    const repsAtMaxWeight = completedSets.find(s => s.weight === maxWeight)?.reps ?? 10;
    
    // Check if all sets were completed
    const allSetsCompleted = workoutExercise.sets.every(s => s.completed);
    
    // Calculate suggested weight for next time
    const suggestedWeight = calculateProgressionWeight(maxWeight, allSetsCompleted);
    
    history[exerciseName] = {
      exerciseName: workoutExercise.exercise.name,
      lastWeight: maxWeight,
      lastReps: repsAtMaxWeight,
      allSetsCompleted,
      lastUsedAt: now,
      suggestedWeight,
    };
  });
  
  setItem(STORAGE_KEYS.EXERCISE_HISTORY, history);
};

// Get suggested weight for an exercise (for pre-filling workout)
export const getSuggestedWeightForExercise = (exerciseName: string): { weight: number; reps: number } | null => {
  const history = getExerciseHistoryByName(exerciseName);
  if (!history) return null;
  
  return {
    weight: history.suggestedWeight,
    reps: history.lastReps,
  };
};
