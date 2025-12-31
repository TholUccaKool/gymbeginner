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
