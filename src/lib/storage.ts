import { UserProfile, Meal, Workout, WeeklyPlan, FoodSuggestion, WorkoutType } from './types';

const STORAGE_KEYS = {
  USER_PROFILE: 'fittrack_user_profile',
  MEALS: 'fittrack_meals',
  WORKOUTS: 'fittrack_workouts',
  WEEKLY_PLANS: 'fittrack_weekly_plans',
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
  if (!profile?.coachProfile) return null;
  
  const trainingDays = profile.coachProfile.trainingDays;
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  
  // Generate a workout schedule based on training days
  // Spread workouts evenly across the week with rest days
  const schedule = generateWorkoutSchedule(trainingDays);
  
  return schedule[dayOfWeek];
};

// Generate workout schedule based on training days per week
const generateWorkoutSchedule = (trainingDays: number): { type: WorkoutType; isRestDay: boolean }[] => {
  const week: { type: WorkoutType; isRestDay: boolean }[] = [];
  
  // Workout rotation based on number of training days
  const workoutRotations: Record<number, WorkoutType[]> = {
    2: ['full-body', 'full-body'],
    3: ['push', 'pull', 'legs'],
    4: ['push', 'pull', 'legs', 'upper'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full-body'],
  };
  
  // Map training days to workout days (spread evenly)
  const workoutDaysMap: Record<number, number[]> = {
    2: [1, 4], // Mon, Thu
    3: [1, 3, 5], // Mon, Wed, Fri
    4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    5: [1, 2, 3, 5, 6], // Mon-Wed, Fri, Sat
    6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6], // Every day
  };
  
  const workoutDays = workoutDaysMap[trainingDays] || workoutDaysMap[3];
  const rotation = workoutRotations[trainingDays] || workoutRotations[3];
  
  let workoutIndex = 0;
  for (let day = 0; day < 7; day++) {
    if (workoutDays.includes(day)) {
      week[day] = { type: rotation[workoutIndex % rotation.length], isRestDay: false };
      workoutIndex++;
    } else {
      week[day] = { type: 'rest', isRestDay: true };
    }
  }
  
  return week;
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
export const getTodayDate = (): string => {
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
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { id: 'chest-fly', name: 'Chest Fly', muscleGroup: 'Chest' },
  { id: 'push-ups', name: 'Push-ups', muscleGroup: 'Chest' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'Chest' },
  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 'pull-ups', name: 'Pull-ups', muscleGroup: 'Back' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
  { id: 'seated-row', name: 'Seated Row', muscleGroup: 'Back' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', muscleGroup: 'Shoulders' },
  { id: 'reverse-fly', name: 'Reverse Fly', muscleGroup: 'Shoulders' },
  // Arms
  { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { id: 'skull-crushers', name: 'Skull Crushers', muscleGroup: 'Triceps' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Triceps' },
  // Legs
  { id: 'squat', name: 'Squat', muscleGroup: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'Quads' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Hamstrings' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
  { id: 'crunches', name: 'Crunches', muscleGroup: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core' },
  { id: 'leg-raises', name: 'Leg Raises', muscleGroup: 'Core' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
];
