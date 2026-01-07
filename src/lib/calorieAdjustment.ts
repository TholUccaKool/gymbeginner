import { getUserProfile, saveUserProfile, getDailyNutritionTotals, getMeals, getTodayDate } from './storage';
import { format, subDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export interface CalorieAdjustment {
  date: string; // The day that had surplus
  surplus: number;
  distributed: boolean; // Whether this surplus has been distributed
  adjustedDate?: string; // When the adjustment was applied
}

export interface DailyAdjustmentState {
  originalTarget: number;
  adjustedTarget: number;
  surplus: number;
  reduction: number;
  remainingDays: number;
  reason: string;
  explanation: string;
  surplusDate: string;
  accepted: boolean;
  dismissed: boolean;
}

const STORAGE_KEY = 'fittrack_calorie_adjustments';
const DAILY_STATE_KEY = 'fittrack_daily_adjustment_state';

// Get all recorded adjustments
export const getCalorieAdjustments = (): CalorieAdjustment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save calorie adjustments
const saveCalorieAdjustments = (adjustments: CalorieAdjustment[]): void => {
  try {
    // Keep only last 14 days
    const cutoff = subDays(new Date(), 14);
    const filtered = adjustments.filter(a => new Date(a.date) >= cutoff);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save adjustments:', error);
  }
};

// Get daily adjustment state
export const getDailyAdjustmentState = (): DailyAdjustmentState | null => {
  try {
    const stored = localStorage.getItem(DAILY_STATE_KEY);
    if (!stored) return null;
    const state = JSON.parse(stored) as DailyAdjustmentState;
    // Only valid for today
    const today = getTodayDate();
    if (state.adjustedTarget && !state.dismissed) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
};

// Save daily adjustment state
export const saveDailyAdjustmentState = (state: DailyAdjustmentState): void => {
  try {
    localStorage.setItem(DAILY_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save daily state:', error);
  }
};

// Clear daily adjustment state (for new day)
export const clearDailyAdjustmentState = (): void => {
  localStorage.removeItem(DAILY_STATE_KEY);
};

// Get the current simulated/real date
const getCurrentDate = (): Date => {
  const offset = localStorage.getItem('fittrack_debug_date_offset');
  if (offset && (import.meta.env.DEV || localStorage.getItem('fittrack_debug_enabled') === 'true')) {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(offset, 10));
    return date;
  }
  return new Date();
};

// Check yesterday's calories and calculate adjustment
export const checkForSurplus = (): { surplus: number; yesterdayDate: string } | null => {
  const profile = getUserProfile();
  if (!profile) return null;

  const today = getCurrentDate();
  const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');
  const yesterdayMeals = getMeals().filter(m => m.date === yesterday);
  
  // Only check if they actually logged meals yesterday
  if (yesterdayMeals.length === 0) return null;
  
  const yesterdayTotals = getDailyNutritionTotals(yesterday);
  const target = profile.nutritionTargets.calories;
  const surplus = yesterdayTotals.calories - target;

  // Only trigger adjustment for significant surplus (>150 cal)
  if (surplus > 150) {
    return { surplus, yesterdayDate: yesterday };
  }

  return null;
};

// Calculate remaining days in the week (including today)
const getRemainingWeekDays = (): number => {
  const today = getCurrentDate();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  // Remaining days including today (Sunday = 1, Monday = 6, etc.)
  return dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1;
};

// Calculate a gentle adjustment suggestion
export const calculateAdjustment = (): DailyAdjustmentState | null => {
  const profile = getUserProfile();
  if (!profile) return null;

  // Check if we already have an adjustment for today
  const existingState = getDailyAdjustmentState();
  if (existingState) return existingState;

  // Check if yesterday had a surplus
  const surplusInfo = checkForSurplus();
  if (!surplusInfo) return null;

  const { surplus, yesterdayDate } = surplusInfo;
  const originalTarget = profile.nutritionTargets.calories;
  
  // Get remaining days to distribute
  const remainingDays = getRemainingWeekDays();
  
  // Calculate reduction - distribute surplus across remaining days
  // But cap at 15% reduction max per day to avoid extreme deficits
  const maxDailyReduction = Math.round(originalTarget * 0.15);
  const idealDistribution = Math.round(surplus / remainingDays);
  let reduction = Math.min(idealDistribution, maxDailyReduction);
  
  // Minimum adjusted target should be at least 1200 for safety
  let adjustedTarget = Math.max(1200, originalTarget - reduction);
  
  // Recalculate actual reduction after safety floor
  reduction = originalTarget - adjustedTarget;
  
  // Don't suggest if the reduction is tiny (<50 cal)
  if (reduction < 50) return null;

  // Create clear, explanatory text
  const reason = generateReason(surplus);
  const explanation = generateExplanation(surplus, reduction, remainingDays, adjustedTarget);

  const adjustment: DailyAdjustmentState = {
    originalTarget,
    adjustedTarget,
    surplus,
    reduction,
    remainingDays,
    reason,
    explanation,
    surplusDate: yesterdayDate,
    accepted: false,
    dismissed: false,
  };

  return adjustment;
};

// Generate a friendly reason based on surplus size
const generateReason = (surplus: number): string => {
  if (surplus < 200) {
    return "Yesterday was slightly over target";
  } else if (surplus < 400) {
    return "Yesterday was a bit higher than planned";
  } else {
    return "Yesterday had more calories than usual";
  }
};

// Generate clear explanation of the adjustment logic
const generateExplanation = (
  surplus: number, 
  reduction: number, 
  remainingDays: number,
  adjustedTarget: number
): string => {
  const roundedSurplus = Math.round(surplus / 50) * 50; // Round to nearest 50
  
  if (remainingDays === 1) {
    return `You ate about ${roundedSurplus} kcal over yesterday. Today's suggested target is ${adjustedTarget} kcal to help balance the week.`;
  }
  
  if (reduction < 100) {
    return `You ate about ${roundedSurplus} kcal over yesterday. A small ${reduction} kcal reduction today will keep you on track.`;
  }
  
  return `You ate about ${roundedSurplus} kcal over yesterday. Spreading this across ${remainingDays} days means about ${reduction} kcal less today — bringing your target to ${adjustedTarget} kcal.`;
};

// Accept the adjustment (update today's effective target)
export const acceptAdjustment = (adjustment: DailyAdjustmentState): void => {
  const profile = getUserProfile();
  if (!profile) return;

  // Save adjustment as accepted
  const updated = { ...adjustment, accepted: true };
  saveDailyAdjustmentState(updated);

  // Record the surplus as distributed
  const adjustments = getCalorieAdjustments();
  const existing = adjustments.find(a => a.date === adjustment.surplusDate);
  if (existing) {
    existing.distributed = true;
    existing.adjustedDate = getTodayDate();
  } else {
    adjustments.push({
      date: adjustment.surplusDate,
      surplus: adjustment.originalTarget - adjustment.adjustedTarget,
      distributed: true,
      adjustedDate: getTodayDate(),
    });
  }
  saveCalorieAdjustments(adjustments);
};

// Dismiss the adjustment (keep original target)
export const dismissAdjustment = (adjustment: DailyAdjustmentState): void => {
  const updated = { ...adjustment, dismissed: true };
  saveDailyAdjustmentState(updated);
};

// Get today's effective calorie target (considering any accepted adjustment)
export const getTodayCalorieTarget = (): number => {
  const profile = getUserProfile();
  if (!profile) return 2000;

  const state = getDailyAdjustmentState();
  if (state?.accepted && !state.dismissed) {
    return state.adjustedTarget;
  }

  return profile.nutritionTargets.calories;
};

// Check if there's a pending adjustment suggestion to show
export const getPendingAdjustment = (): DailyAdjustmentState | null => {
  const existingState = getDailyAdjustmentState();
  
  // If already accepted or dismissed today, don't show
  if (existingState?.accepted || existingState?.dismissed) {
    return null;
  }

  // Calculate fresh adjustment
  return calculateAdjustment();
};
