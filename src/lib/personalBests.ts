// Personal Best (PR) tracking — offline-first, localStorage-backed
// Tracks per-exercise: maxWeight, maxRepsAtWeight, maxVolume (single set)

import { Workout, WorkoutExercise, ExerciseSet } from './types';

export interface PersonalBest {
  exerciseName: string;
  maxWeight: number;         // heaviest weight lifted
  maxWeightReps: number;     // reps achieved at maxWeight
  maxRepsAtWeight: number;   // most reps at any weight
  maxRepsWeight: number;     // the weight for maxRepsAtWeight
  maxVolume: number;         // single-set volume (weight × reps)
  maxVolumeWeight: number;
  maxVolumeReps: number;
  updatedAt: string;         // ISO timestamp
}

export interface PRCheckResult {
  exerciseName: string;
  newMaxWeight: boolean;
  newMaxReps: boolean;
  newMaxVolume: boolean;
}

const STORAGE_KEY = 'fittrack_personal_bests';

// ── Storage helpers ──

export function getPersonalBests(): Record<string, PersonalBest> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersonalBests(pbs: Record<string, PersonalBest>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pbs));
  } catch (e) {
    console.error('PR storage error:', e);
  }
}

// ── Core: check a single completed set against stored PRs ──

export function checkAndUpdatePR(
  exerciseName: string,
  set: ExerciseSet
): PRCheckResult | null {
  if (!set.completed || set.weight <= 0 || set.reps <= 0) return null;

  const pbs = getPersonalBests();
  const existing = pbs[exerciseName];
  const volume = set.weight * set.reps;
  const now = new Date().toISOString();

  let newMaxWeight = false;
  let newMaxReps = false;
  let newMaxVolume = false;

  if (!existing) {
    // First ever record for this exercise — always a PR
    pbs[exerciseName] = {
      exerciseName,
      maxWeight: set.weight,
      maxWeightReps: set.reps,
      maxRepsAtWeight: set.reps,
      maxRepsWeight: set.weight,
      maxVolume: volume,
      maxVolumeWeight: set.weight,
      maxVolumeReps: set.reps,
      updatedAt: now,
    };
    newMaxWeight = true;
    newMaxReps = true;
    newMaxVolume = true;
  } else {
    if (set.weight > existing.maxWeight) {
      existing.maxWeight = set.weight;
      existing.maxWeightReps = set.reps;
      newMaxWeight = true;
    } else if (set.weight === existing.maxWeight && set.reps > existing.maxWeightReps) {
      existing.maxWeightReps = set.reps;
      newMaxWeight = true; // more reps at same weight counts
    }

    if (set.reps > existing.maxRepsAtWeight) {
      existing.maxRepsAtWeight = set.reps;
      existing.maxRepsWeight = set.weight;
      newMaxReps = true;
    }

    if (volume > existing.maxVolume) {
      existing.maxVolume = volume;
      existing.maxVolumeWeight = set.weight;
      existing.maxVolumeReps = set.reps;
      newMaxVolume = true;
    }

    if (newMaxWeight || newMaxReps || newMaxVolume) {
      existing.updatedAt = now;
      pbs[exerciseName] = existing;
    }
  }

  const hasPR = newMaxWeight || newMaxReps || newMaxVolume;
  if (hasPR) {
    savePersonalBests(pbs);
    return { exerciseName, newMaxWeight, newMaxReps, newMaxVolume };
  }

  return null;
}

// ── Batch: scan a full workout for PRs (used on finish / history) ──

export function getWorkoutPRExercises(workout: Workout): Set<string> {
  const prExercises = new Set<string>();
  const pbs = getPersonalBests();

  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
      const name = ex.exercise.name;
      const existing = pbs[name];
      if (!existing) {
        // If there's no record yet, every set is technically a PR
        // but we only mark it if the workout itself created the record
        prExercises.add(name);
        continue;
      }
      const volume = set.weight * set.reps;
      if (
        set.weight >= existing.maxWeight ||
        set.reps >= existing.maxRepsAtWeight ||
        volume >= existing.maxVolume
      ) {
        prExercises.add(name);
      }
    }
  }

  return prExercises;
}

// ── Check if a completed workout contains any PRs (for badge) ──

export function workoutHasPR(workout: Workout): boolean {
  if (!workout.completed) return false;
  const pbs = getPersonalBests();

  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
      const name = ex.exercise.name;
      const existing = pbs[name];
      if (!existing) continue; // can't determine retroactively without stored context
      const volume = set.weight * set.reps;
      if (
        set.weight >= existing.maxWeight ||
        volume >= existing.maxVolume
      ) {
        return true;
      }
    }
  }
  return false;
}

// ── Get sorted list for Profile display ──

export function getPersonalBestsList(): PersonalBest[] {
  const pbs = getPersonalBests();
  return Object.values(pbs).sort((a, b) => b.maxWeight - a.maxWeight);
}
