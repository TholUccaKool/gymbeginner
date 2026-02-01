import { WorkoutType, Exercise } from "./types";

// Personalized workout templates based on experience level

export interface WorkoutTemplate {
  exercises: Exercise[];
  setsPerExercise: number;
  repsPerSet: number;
}

// Beginner-focused: fewer exercises, compound movements, simpler progression
const BEGINNER_TEMPLATES: Record<string, Exercise[]> = {
  push: [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  ],
  pull: [
    { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
    { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Rear Delts' },
    { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  ],
  legs: [
    // Legs: Quad-focused (machine/squat based)
    { id: 'squat', name: 'Goblet Squat', muscleGroup: 'Quads' },
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
    { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Hamstrings' },
    { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
  ],
  lower: [
    // Lower Body: Posterior chain focused (hinge based)
    { id: 'romanian-deadlift', name: 'Romanian Deadlift (DB)', muscleGroup: 'Hamstrings' },
    { id: 'walking-lunges', name: 'Walking Lunges', muscleGroup: 'Quads/Glutes' },
    { id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Glutes' },
    { id: 'leg-curl', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings' },
  ],
  upper: [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back' },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back' },
  ],
  'full-body': [
    { id: 'squat', name: 'Goblet Squat', muscleGroup: 'Quads' },
    { id: 'push-up', name: 'Push-ups', muscleGroup: 'Chest' },
    { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'Back' },
    { id: 'overhead-press', name: 'Overhead Press (DB)', muscleGroup: 'Shoulders' },
    { id: 'plank', name: 'Plank', muscleGroup: 'Core' },
  ],
};

// Experienced: more exercises, isolation work, varied techniques
const EXPERIENCED_TEMPLATES: Record<string, Exercise[]> = {
  push: [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'Upper Chest' },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'Chest' },
    { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders' },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  ],
  pull: [
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back' },
    { id: 'pull-ups', name: 'Pull-ups', muscleGroup: 'Lats' },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
    { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Rear Delts' },
    { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Biceps' },
    { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Biceps' },
  ],
  legs: [
    // Legs: Full leg development
    { id: 'squat', name: 'Back Squat', muscleGroup: 'Quads' },
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Quads' },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
    { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'Quads' },
    { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'Hamstrings' },
    { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
  ],
  lower: [
    // Lower Body: Glutes/Hamstrings focus
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
    { id: 'hip-thrust', name: 'Barbell Hip Thrust', muscleGroup: 'Glutes' },
    { id: 'bulgarian-split', name: 'Bulgarian Split Squat', muscleGroup: 'Quads/Glutes' },
    { id: 'cable-pull-through', name: 'Cable Pull Through', muscleGroup: 'Glutes' },
    { id: 'glute-ham-raise', name: 'Glute Ham Raise', muscleGroup: 'Hamstrings' },
    { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'Calves' },
  ],
  upper: [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { id: 'pull-ups', name: 'Pull-ups', muscleGroup: 'Lats' },
    { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Biceps' },
    { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  ],
  'full-body': [
    { id: 'squat', name: 'Back Squat', muscleGroup: 'Quads' },
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back' },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back/Legs' },
    { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Biceps' },
  ],
};

export function getPersonalizedExercises(
  workoutType: WorkoutType,
  experienceLevel: 'new' | 'experienced' = 'new',
  trainingDaysPerWeek: number = 3
): WorkoutTemplate {
  const templates = experienceLevel === 'experienced' ? EXPERIENCED_TEMPLATES : BEGINNER_TEMPLATES;
  const exercises = templates[workoutType as string] || templates['full-body'];

  // Adjust sets and reps based on training frequency
  let setsPerExercise = 3;
  let repsPerSet = 10;

  if (experienceLevel === 'experienced') {
    setsPerExercise = 4;
    repsPerSet = 8;
  }

  // Higher frequency = lower volume per session
  if (trainingDaysPerWeek >= 5) {
    setsPerExercise = Math.max(2, setsPerExercise - 1);
  }

  return {
    exercises,
    setsPerExercise,
    repsPerSet,
  };
}

// Get workout split recommendation based on training days
export function getRecommendedSplit(trainingDays: number): WorkoutType[] {
  switch (trainingDays) {
    case 1:
    case 2:
      return ['full-body', 'full-body'];
    case 3:
      return ['push', 'pull', 'legs'];
    case 4:
      return ['upper', 'lower', 'push', 'pull'];
    case 5:
      return ['push', 'pull', 'legs', 'upper', 'lower'];
    case 6:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    default:
      return ['push', 'pull', 'legs'];
  }
}
